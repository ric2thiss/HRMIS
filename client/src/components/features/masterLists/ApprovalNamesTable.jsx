import React, { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { createApprovalName, updateApprovalName, deleteApprovalName } from '../../../api/master-lists/approvalNames';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useMasterListsStore } from '../../../stores/masterListsStore';
import { useUserAccountsStore } from '../../../stores/userAccountsStore';
import { useApprovalNamesTableStore } from '../../../stores/approvalNamesTableStore';
import { useAuth } from '../../../hooks/useAuth';
import TableActionButton from '../../ui/TableActionButton';

function ApprovalNamesTable() {
  const { user: currentUser } = useAuth();
  const { clearCache: clearMasterListsCache } = useMasterListsStore();
  const { getAccounts, accounts: users, loading: loadingUsers } = useUserAccountsStore();
  const { getApprovalNames, approvalNames, loading } = useApprovalNamesTableStore();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingApprovalName, setEditingApprovalName] = useState(null);
  const [formData, setFormData] = useState({
    user_id: '',
    type: 'general',
    description: '',
    is_active: true,
    sort_order: 0
  });

  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);

  useEffect(() => {
    loadApprovalNames();
    // Load users from cache
    getAccounts();
  }, [currentUser, getAccounts]);

  const formatUserName = (user) => {
    if (user.first_name && user.last_name) {
      const middle = user.middle_initial ? ` ${user.middle_initial}` : '';
      const name = `${user.first_name}${middle} ${user.last_name}`.trim();
      const position = user.position?.title ? ` - ${user.position.title}` : '';
      return `${name}${position}`;
    }
    return user.name || user.email || 'Unknown User';
  };

  const loadApprovalNames = async () => {
    try {
      await getApprovalNames(); // Uses cache if available (5 min TTL)
    } catch (err) {
      showError('Failed to load approval names');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Find selected user and format name
      const selectedUser = users.find(u => u.id === parseInt(formData.user_id));
      if (!selectedUser) {
        showError('Please select a user');
        return;
      }
      
      const userName = formatUserName(selectedUser);
      const submissionData = {
        ...formData,
        name: userName,
        user_id: parseInt(formData.user_id)
      };
      
      if (editingApprovalName) {
        await updateApprovalName(editingApprovalName.id, submissionData);
        showSuccess('Approval name updated successfully');
      } else {
        await createApprovalName(submissionData);
        showSuccess('Approval name created successfully');
      }
      setIsFormVisible(false);
      setEditingApprovalName(null);
      setFormData({ user_id: '', type: 'general', description: '', is_active: true, sort_order: 0 });
      loadApprovalNames();
      clearMasterListsCache(); // Clear master lists cache after CRUD operation
    } catch (err) {
      showError(err?.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (approvalName) => {
    setEditingApprovalName(approvalName);
    // Try to find user by name match or user_id
    const matchedUser = users.find(u => 
      u.id === approvalName.user_id || formatUserName(u) === approvalName.name
    );
    setFormData({
      user_id: matchedUser?.id?.toString() || '',
      type: approvalName.type || 'general',
      description: approvalName.description || '',
      is_active: approvalName.is_active !== undefined ? approvalName.is_active : true,
      sort_order: approvalName.sort_order || 0
    });
    setIsFormVisible(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this approval name?')) return;
    
    try {
      setLoading(true);
      await deleteApprovalName(id);
      showSuccess('Approval name deleted successfully');
      loadApprovalNames();
      clearMasterListsCache(); // Clear master lists cache after CRUD operation
    } catch (err) {
      showError(err?.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingApprovalName(null);
    setFormData({ user_id: '', type: 'general', description: '', is_active: true, sort_order: 0 });
  };

  const approvalTypes = [
    { value: 'leave_credit_officer', label: 'Leave Credit Authorized Officer' },
    { value: 'recommendation_approver', label: 'Recommendation Approver' },
    { value: 'leave_approver', label: 'Leave Approver' },
    { value: 'general', label: 'General' }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Approval Names</h3>
        <button
          onClick={() => setIsFormVisible(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          ➕ Add Approval Name
        </button>
      </div>

      {loading && approvalNames.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Loading approval names...</div>
      ) : approvalNames.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No approval names found. Create your first approval name to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sort Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {approvalNames.map((approvalName) => (
                <tr key={approvalName.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{approvalName.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {approvalTypes.find(t => t.value === approvalName.type)?.label || approvalName.type}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {approvalName.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      approvalName.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {approvalName.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {approvalName.sort_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2 items-center flex-nowrap">
                      <TableActionButton
                        variant="indigo"
                        icon={Pencil}
                        label="Edit"
                        onClick={() => handleEdit(approvalName)}
                        title="Edit approval name"
                      />
                      <TableActionButton
                        variant="red"
                        icon={Trash2}
                        label="Delete"
                        onClick={() => handleDelete(approvalName.id)}
                        title="Delete approval name"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFormVisible && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-medium text-gray-900">
                {editingApprovalName ? 'Edit Approval Name' : 'Create Approval Name'}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                disabled={loading}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">User <span className="text-red-500">*</span></label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  required
                  disabled={loading || loadingUsers}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select employee</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {formatUserName(user)}
                    </option>
                  ))}
                </select>
                {loadingUsers && (
                  <p className="mt-1 text-sm text-gray-500">Loading users...</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  {approvalTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Description..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="0"
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    disabled={loading}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="py-2 px-4 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-4 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingApprovalName ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApprovalNamesTable;

