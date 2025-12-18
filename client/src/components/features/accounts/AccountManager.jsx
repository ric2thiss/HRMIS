import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, Lock, Unlock, Trash2 } from 'lucide-react';
import AddAccountForm from "./AddAccountForm";
import EditAccountModal from "./EditAccountModal";
import api from "../../../api/axios";
import createAccount from "../../../api/user/create_account";
import deleteAccount from "../../../api/user/delete_account";
import toggleSystemSettingsAccess from "../../../api/user/toggleSystemSettingsAccess";
import toggleLock from "../../../api/user/toggleLock";
import LoadingSpinner from "../../../components/Loading/LoadingSpinner";
import { useAuth } from "../../../hooks/useAuth";
import { getUserRole } from "../../../utils/userHelpers";
import { useNotificationStore } from "../../../stores/notificationStore";
import { useUserAccountsStore } from "../../../stores/userAccountsStore";
import { useEmploymentTypesStore } from "../../../stores/employmentTypesStore";
import TableActionButton from "../../ui/TableActionButton";

function AccountManager() {
    const { user: currentUser } = useAuth();
    const isAdmin = getUserRole(currentUser) === 'admin';
    const showSuccess = useNotificationStore((state) => state.showSuccess);
    const showError = useNotificationStore((state) => state.showError);
    const { getAccounts, accounts, updateAccountInCache, addAccountToCache, removeAccountFromCache, refreshAccounts } = useUserAccountsStore();
    const { getEmploymentTypes, employmentTypes } = useEmploymentTypesStore();
    const [roles, setRoles] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState(null);

    // Fetch roles, users, and employment types on mount (using cache where available)
    useEffect(() => {
        const fetchData = async () => {
            try {
                await api.get("/sanctum/csrf-cookie");

                const [rolesRes] = await Promise.all([
                    api.get("/api/roles"),
                    getAccounts(), // Use cached accounts
                    getEmploymentTypes() // Use cached employment types
                ]);
                
                setRoles(rolesRes.data.roles || []);
                
            } catch (err) {
                setError("Failed to load account data.");
            } finally {
                setInitializing(false);
            }
        };

        fetchData();
    }, [getAccounts, getEmploymentTypes]);

    // Handle new account creation
    const handleAddAccount = useCallback(
        async (newAccountData) => {
            const { first_name, middle_initial, last_name, email, password, role_id, employment_type_id } = newAccountData;

            setError(null);
            setLoading(true);

            try {
                const created = await createAccount(
                    first_name,
                    middle_initial || '',
                    last_name,
                    newAccountData.sex,
                    email,
                    password,
                    newAccountData.position_id,
                    newAccountData.role_id,
                    newAccountData.project_id,
                    employment_type_id,
                    newAccountData.special_capability_ids || [],
                    newAccountData.office_id || null
                );

                // Build account name for success message
                const accountName = `${first_name} ${middle_initial || ''} ${last_name}`.trim() || email;

                // Refresh accounts cache after creation
                await refreshAccounts();

                setIsFormVisible(false);
                setError(null);
                
                // Show success notification
                showSuccess(`Account created successfully for ${accountName}. The user will be required to change their password on first login.`);
            } catch (err) {
                const message =
                    err?.response?.data?.message ||
                    err.message ||
                    "Unexpected error occurred while creating the account.";
                const errorMessage = `Registration Failed: ${message}`;
                setError(errorMessage);
                showError(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [showSuccess, showError, refreshAccounts]
    );

    const handleCancel = useCallback(() => {
        setIsFormVisible(false);
        setError(null);
    }, []);

    const handleAction = async (accountId, action) => {
        if (action === "Delete") {
            const account = accounts.find(acc => acc.id === accountId);
            const accountName = account 
                ? `${account.first_name || ''} ${account.last_name || ''}`.trim() || account.name || 'this account'
                : 'this account';
            
            const confirmDelete = window.confirm(
                `Are you sure you want to delete ${accountName}? This action cannot be undone.`
            );
            if (!confirmDelete) return;

            try {
                setLoading(true);
                await deleteAccount(accountId);
                removeAccountFromCache(accountId);
                showSuccess('Account deleted successfully');
                setError(null);
            } catch (err) {
                const message =
                    err?.response?.data?.message || err.message || "Delete failed.";
                showError(message);
                setError(message);
            } finally {
                setLoading(false);
            }
        } else if (action === "Edit") {
            const account = accounts.find(acc => acc.id === accountId);
            if (account) {
                setEditingAccount(account);
            }
        }
    };

    const handleAccountUpdate = (updatedAccount) => {
        updateAccountInCache(updatedAccount);
        setEditingAccount(null);
    };

    const handleCloseEditModal = () => {
        setEditingAccount(null);
        setError(null);
    };

    const handleToggleLock = async (accountId, currentLockStatus) => {
        const account = accounts.find(acc => acc.id === accountId);
        const accountName = account 
            ? `${account.first_name || ''} ${account.last_name || ''}`.trim() || account.name || 'this account'
            : 'this account';
        
        const action = currentLockStatus ? 'unlock' : 'lock';
        const confirmAction = window.confirm(
            `Are you sure you want to ${action} ${accountName}? ${currentLockStatus ? 'The user will be able to login again.' : 'The user will be forced to logout and cannot login.'}`
        );
        if (!confirmAction) return;

        try {
            setLoading(true);
            const updatedUser = await toggleLock(accountId, !currentLockStatus);
            updateAccountInCache(updatedUser);
            showSuccess(`Account ${action}ed successfully`);
            setError(null);
        } catch (err) {
            const message =
                err?.response?.data?.message || err.message || `${action} failed.`;
            showError(message);
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSystemSettingsAccess = async (accountId, currentAccess) => {
        if (!isAdmin) {
            showError("Only administrators can grant system settings access.");
            return;
        }

        try {
            setLoading(true);
            const updatedUser = await toggleSystemSettingsAccess(accountId, !currentAccess);
            
            // Update the account in cache
            updateAccountInCache({
                ...accounts.find(acc => acc.id === accountId),
                has_system_settings_access: updatedUser.has_system_settings_access
            });
            
            showSuccess(
                updatedUser.has_system_settings_access 
                    ? 'System settings access granted successfully'
                    : 'System settings access revoked successfully'
            );
        } catch (err) {
            const message = err?.response?.data?.message || err.message || "Operation failed.";
            showError(message);
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return <LoadingSpinner text="Loading accounts..." />;
    }

    return (
        <div className="bg-white shadow-lg rounded-lg p-6">
            <header className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                    Manage Accounts
                </h2>
                <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    onClick={() => setIsFormVisible(true)}
                    disabled={loading}
                >
                    ➕ Add Account
                </button>
            </header>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <strong className="font-bold">Error: </strong>
                    {error}
                </div>
            )}

            {accounts.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    No accounts found.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Position
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Project Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Office
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                {isAdmin && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        System Settings Access
                                    </th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200">
                            {accounts.map((account) => {
                                // Build full name from parts or use name field
                                const fullName = account.first_name && account.last_name
                                    ? `${account.first_name} ${account.middle_initial || ''} ${account.last_name}`.trim()
                                    : account.name || 'N/A';
                                
                                return (
                                <tr key={account.id}>
                                    <td className="px-6 py-4">
                                        {fullName}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {account.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        {account.position?.title || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const role = account.role?.name || account.roles?.[0]?.name || "No role";
                                            return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
                                        })()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {account.project?.project_code || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {account.office?.code || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {(account.employmentTypes || account.employment_types)?.[0]?.name || "N/A"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            account.is_locked 
                                                ? 'bg-red-100 text-red-800' 
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {account.is_locked ? 'Locked' : 'Active'}
                                        </span>
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4">
                                            {account.role?.name === 'hr' ? (
                                                <button
                                                    onClick={() => handleToggleSystemSettingsAccess(account.id, account.has_system_settings_access)}
                                                    disabled={loading}
                                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                                                        account.has_system_settings_access
                                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    } disabled:opacity-50`}
                                                    title={account.has_system_settings_access ? 'Click to revoke access' : 'Click to grant access'}
                                                >
                                                    {account.has_system_settings_access ? '✓ Granted' : '✗ Not Granted'}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400">N/A</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center gap-2 flex-nowrap">
                                            <TableActionButton
                                                variant="indigo"
                                                icon={Pencil}
                                                label="Edit"
                                                onClick={() => handleAction(account.id, "Edit")}
                                                disabled={loading}
                                                title="Edit account"
                                            />
                                            <TableActionButton
                                                variant={account.is_locked ? "green" : "yellow"}
                                                icon={account.is_locked ? Unlock : Lock}
                                                label={account.is_locked ? 'Unlock' : 'Lock'}
                                                onClick={() => handleToggleLock(account.id, account.is_locked)}
                                                disabled={loading}
                                                title={account.is_locked ? 'Click to unlock account' : 'Click to lock account'}
                                            />
                                            <TableActionButton
                                                variant="red"
                                                icon={Trash2}
                                                label="Delete"
                                                onClick={() => handleAction(account.id, "Delete")}
                                                disabled={loading}
                                                title="Delete account"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}

            {isFormVisible &&
                createPortal(
                    <AddAccountForm
                        onAddAccount={handleAddAccount}
                        onCancel={handleCancel}
                        loading={loading}
                        roles={roles}
                        employmentTypes={employmentTypes}
                    />,
                    document.body
                )}

            {editingAccount &&
                <EditAccountModal
                    account={editingAccount}
                    onClose={handleCloseEditModal}
                    onUpdate={handleAccountUpdate}
                    loading={loading}
                    employmentTypes={employmentTypes}
                />
            }
        </div>
    );
}

export default React.memo(AccountManager);

