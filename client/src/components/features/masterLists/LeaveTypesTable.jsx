import React, { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { createLeaveType, updateLeaveType, deleteLeaveType } from '../../../api/master-lists/leaveTypes';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useLeaveTypesStore } from '../../../stores/leaveTypesStore';
import { useLeaveTypesTableStore } from '../../../stores/leaveTypesTableStore';
import TableActionButton from '../../ui/TableActionButton';

function LeaveTypesTable() {
  const { getLeaveTypesForTable, leaveTypes, loading } = useLeaveTypesTableStore();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    max_days: 0,
    description: '',
    requires_document: false,
    requires_approval: true,
    is_active: true
  });

  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);
  const { clearCache: clearLeaveTypesCache } = useLeaveTypesStore();

  useEffect(() => {
    loadLeaveTypes();
  }, []);

  const loadLeaveTypes = async () => {
    try {
      await getLeaveTypesForTable(); // Uses cache if available (5 min TTL)
    } catch (err) {
      showError('Failed to load leave types');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingLeaveType) {
        await updateLeaveType(editingLeaveType.id, formData);
        showSuccess('Leave type updated successfully');
      } else {
        await createLeaveType(formData);
        showSuccess('Leave type created successfully');
      }
      setIsFormVisible(false);
      setEditingLeaveType(null);
      setFormData({
        code: '',
        name: '',
        max_days: 0,
        description: '',
        requires_document: false,
        requires_approval: true,
        is_active: true
      });
      loadLeaveTypes();
      clearLeaveTypesCache(); // Clear leave types cache after CRUD operation
    } catch (err) {
      showError(err?.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (leaveType) => {
    setEditingLeaveType(leaveType);
    setFormData({
      code: leaveType.code || '',
      name: leaveType.name || '',
      max_days: leaveType.max_days || 0,
      description: leaveType.description || '',
      requires_document: leaveType.requires_document || false,
      requires_approval: leaveType.requires_approval !== undefined ? leaveType.requires_approval : true,
      is_active: leaveType.is_active !== undefined ? leaveType.is_active : true
    });
    setIsFormVisible(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leave type?')) return;
    
    try {
      setLoading(true);
      await deleteLeaveType(id);
      showSuccess('Leave type deleted successfully');
      loadLeaveTypes();
    } catch (err) {
      showError(err?.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingLeaveType(null);
    setFormData({
      code: '',
      name: '',
      max_days: 0,
      description: '',
      requires_document: false,
      requires_approval: true,
      is_active: true
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Leave Types</h3>
        <button
          onClick={() => setIsFormVisible(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          ➕ Add Leave Type
        </button>
      </div>

      {loading && leaveTypes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Loading leave types...</div>
      ) : leaveTypes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No leave types found. Create your first leave type to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaveTypes.map((leaveType) => (
                <tr key={leaveType.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{leaveType.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{leaveType.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{leaveType.max_days}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {leaveType.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      leaveType.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {leaveType.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2 items-center flex-wrap">
                      <TableActionButton
                        variant="indigo"
                        icon={Pencil}
                        label="Edit"
                        onClick={() => handleEdit(leaveType)}
                        title="Edit leave type"
                      />
                      <TableActionButton
                        variant="red"
                        icon={Trash2}
                        label="Delete"
                        onClick={() => handleDelete(leaveType.id)}
                        title="Delete leave type"
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-medium text-gray-900">
                {editingLeaveType ? 'Edit Leave Type' : 'Create Leave Type'}
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
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    disabled={loading || editingLeaveType}
                    maxLength={10}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="e.g., VL, SL, SPL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max Days <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.max_days}
                    onChange={(e) => setFormData({ ...formData, max_days: parseInt(e.target.value) || 0 })}
                    required
                    disabled={loading}
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="e.g., 15"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="e.g., Vacation Leave"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Leave type description..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requires_document"
                    checked={formData.requires_document}
                    onChange={(e) => setFormData({ ...formData, requires_document: e.target.checked })}
                    disabled={loading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requires_document" className="ml-2 block text-sm text-gray-700">
                    Requires Document
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requires_approval"
                    checked={formData.requires_approval}
                    onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                    disabled={loading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requires_approval" className="ml-2 block text-sm text-gray-700">
                    Requires Approval
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    disabled={loading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
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
                  {loading ? 'Saving...' : editingLeaveType ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveTypesTable;

