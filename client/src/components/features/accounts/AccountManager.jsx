import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import AddAccountForm from "./AddAccountForm";
import api from "../../../api/axios";
import createAccount from "../../../api/user/create_account";
import deleteAccount from "../../../api/user/delete_account";
import toggleSystemSettingsAccess from "../../../api/user/toggleSystemSettingsAccess";
import LoadingSpinner from "../../../components/Loading/LoadingSpinner";
import { useAuth } from "../../../hooks/useAuth";
import { getUserRole } from "../../../utils/userHelpers";
import { useNotificationStore } from "../../../stores/notificationStore";

function AccountManager() {
    const { user: currentUser } = useAuth();
    const isAdmin = getUserRole(currentUser) === 'admin';
    const showSuccess = useNotificationStore((state) => state.showSuccess);
    const showError = useNotificationStore((state) => state.showError);
    const [accounts, setAccounts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [employmentTypes, setEmploymentTypes] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState(null);

    // Fetch roles + users on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                await api.get("/sanctum/csrf-cookie");

                const [rolesRes, usersRes, employmentRes] = await Promise.all([
                    api.get("/api/roles"),
                    api.get("/api/users"),
                    api.get("/api/employment/types")
                ]);
                
                setRoles(rolesRes.data.roles || []);
                setAccounts(usersRes.data.users || []);
                setEmploymentTypes(employmentRes.data || []);
                
            } catch (err) {
                setError("Failed to load account data.");
            } finally {
                setInitializing(false);
            }
        };

        fetchData();
    }, []);

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
                    email,
                    password,
                    newAccountData.position_id,
                    newAccountData.role_id,
                    newAccountData.project_id,
                    employment_type_id,
                    newAccountData.special_capability_ids || [],
                    newAccountData.office_id || null
                );

                // Refresh accounts list after creation
                const usersRes = await api.get("/api/users");
                setAccounts(usersRes.data.users || []);

                setIsFormVisible(false);
            } catch (err) {
                const message =
                    err?.response?.data?.message ||
                    err.message ||
                    "Unexpected error.";
                setError(`Registration Failed: ${message}`);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const handleCancel = useCallback(() => {
        setIsFormVisible(false);
        setError(null);
    }, []);

    const handleAction = async (accountId, action) => {
        if (action === "Delete") {
            const confirmDelete = window.confirm(
                "Are you sure you want to delete this account?"
            );
            if (!confirmDelete) return;

            try {
                await deleteAccount(accountId);
                setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
            } catch (err) {
                const message =
                    err?.response?.data?.message || err.message || "Delete failed.";
                setError(message);
            }
        } else if (action === "Edit") {
            setError("Edit functionality not yet implemented");
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
            
            // Update the account in the list
            setAccounts((prev) => 
                prev.map(acc => 
                    acc.id === accountId 
                        ? { ...acc, has_system_settings_access: updatedUser.has_system_settings_access }
                        : acc
                )
            );
            
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
                                    Project
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Office
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Type
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
                                        {account.role?.name || account.roles?.[0]?.name || "No role"}
                                    </td>
                                    <td className="px-6 py-4">
                                        {account.project?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {account.office?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {(account.employmentTypes || account.employment_types)?.[0]?.name || "N/A"}
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
                                    <td className="px-6 py-4 text-sm font-medium">
                                        <button
                                            onClick={() => handleAction(account.id, "Edit")}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleAction(account.id, "Delete")}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
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
        </div>
    );
}

export default React.memo(AccountManager);

