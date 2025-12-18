import React, { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { createRole, updateRole, deleteRole } from '../../../api/master-lists/roles';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useMasterListsStore } from '../../../stores/masterListsStore';
import { useRolesTableStore } from '../../../stores/masterListTablesStore';
import TableActionButton from '../../ui/TableActionButton';

function RolesTable() {
  const { getRoles, roles, loading } = useRolesTableStore();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    access_permissions_scope: ''
  });

  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);
  const { clearCache: clearMasterListsCache } = useMasterListsStore();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      await getRoles(); // Uses cache if available
    } catch (err) {
      showError('Failed to load roles');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingRole) {
        await updateRole(editingRole.id, formData);
        showSuccess('Role updated successfully');
      } else {
        await createRole(formData);
        showSuccess('Role created successfully');
      }
      setIsFormVisible(false);
      setEditingRole(null);
      setFormData({ name: '', access_permissions_scope: '' });
      loadRoles();
      clearMasterListsCache(); // Clear master lists cache after CRUD operation
    } catch (err) {
      showError(err?.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name || '',
      access_permissions_scope: role.access_permissions_scope || ''
    });
    setIsFormVisible(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    
    try {
      setLoading(true);
      await deleteRole(id);
      showSuccess('Role deleted successfully');
      loadRoles();
      clearMasterListsCache(); // Clear master lists cache after CRUD operation
    } catch (err) {
      showError(err?.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingRole(null);
    setFormData({ name: '', access_permissions_scope: '' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Organizational Roles</h3>
        <button
          onClick={() => setIsFormVisible(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          ➕ Add Role
        </button>
      </div>

      {loading && roles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Loading roles...</div>
      ) : roles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No roles found. Create your first role to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Access Permissions Scope</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium capitalize">{role.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {role.access_permissions_scope || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2 items-center flex-nowrap">
                      <TableActionButton
                        variant="indigo"
                        icon={Pencil}
                        label="Edit"
                        onClick={() => handleEdit(role)}
                        title="Edit role"
                      />
                      <TableActionButton
                        variant="red"
                        icon={Trash2}
                        label="Delete"
                        onClick={() => handleDelete(role.id)}
                        title="Delete role"
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
                {editingRole ? 'Edit Role' : 'Create Role'}
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
                <label className="block text-sm font-medium text-gray-700">Role Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="e.g., Employee, HR, Admin"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Access Permissions Scope</label>
                <textarea
                  value={formData.access_permissions_scope}
                  onChange={(e) => setFormData({ ...formData, access_permissions_scope: e.target.value })}
                  disabled={loading}
                  rows="4"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Describe the system access rights and permissions for this role..."
                />
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
                  {loading ? 'Saving...' : editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RolesTable;

