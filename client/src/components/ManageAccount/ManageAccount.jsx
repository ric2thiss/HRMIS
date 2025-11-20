import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import AddAccountForm from "./AddAccountForm";
import api from "../../api/axios";
import createAccount from "../../api/user/create_account";
import deleteAccount from "../../api/user/delete_account";
import { useNavigate } from "react-router-dom";

function ManageAccounts() {
    const navigate = useNavigate();

    const [accounts, setAccounts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const [loading, setLoading] = useState(false); // form loading
    const [initializing, setInitializing] = useState(true); // page loading
    const [error, setError] = useState(null);

    // Fetch roles + users on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                await api.get("/sanctum/csrf-cookie");

                const [rolesRes, usersRes] = await Promise.all([
                    api.get("/api/roles"),
                    api.get("/api/users"),
                ]);

                console.log(usersRes.data.users);
                
                setRoles(rolesRes.data.roles || []);
                setAccounts(usersRes.data.users || []);
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
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
            const { name, email, password, role_id } = newAccountData;

            setError(null);
            setLoading(true);

            try {
                const created = await createAccount(
                    name,
                    email,
                    password,
                    role_id
                );

                setAccounts((prev) => [
                    ...prev,
                    {
                        id: created?.id || prev.length + 1,
                        name,
                        email,
                        role:
                            roles.find((r) => r.id == role_id)?.name ||
                            "Unknown",
                        status: "Active",
                    },
                ]);

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
        [roles]
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
                await deleteAccount(accountId); // call your API
                // Remove the deleted account from state
                setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
            } catch (err) {
                const message =
                    err?.response?.data?.message || err.message || "Delete failed.";
                setError(message);
                console.error("Delete Error:", err);
            }
        } else if (action === "Edit") {
            console.log("Edit account with ID:", accountId);
            // Implement your edit logic here
        }
    };


    // -------------------------------------------
    // 🔥 RENDERING STATES HANDLING
    // -------------------------------------------

    // (1) Page still loading data
    if (initializing) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="text-gray-600 animate-pulse text-lg">
                    Loading accounts...
                </div>
            </div>
        );
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

            {/* (2) Empty state */}
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
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody className="bg-white divide-y divide-gray-200">
                            {accounts.map((account) => (
                                <tr key={account.id}>
                                    <td className="px-6 py-4">
                                        {account.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {account.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        {account.roles
                                            ?.map(r => r.name.charAt(0).toUpperCase() + r.name.slice(1))
                                            .join(", ") || "No role"
                                        }
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                account.status === "Active"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {account.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">
                                        <button
                                            onClick={() =>
                                                handleAction(
                                                    account.id,
                                                    "Edit"
                                                )
                                            }
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleAction(
                                                    account.id,
                                                    "Delete"
                                                )
                                            }
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
                    />,
                    document.body
                )}
        </div>
    );
}

export default ManageAccounts;
