import React, { useState, useEffect } from 'react';
import { createSpecialCapability, updateSpecialCapability, deleteSpecialCapability } from '../../../api/master-lists/specialCapabilities';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useMasterListsStore } from '../../../stores/masterListsStore';
import { useCapabilitiesTableStore } from '../../../stores/masterListTablesStore';

function SpecialCapabilitiesTable() {
  const { getCapabilities, capabilities, loading } = useCapabilitiesTableStore();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCapability, setEditingCapability] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);
  const { clearCache: clearMasterListsCache } = useMasterListsStore();

  useEffect(() => {
    loadCapabilities();
  }, []);

  const loadCapabilities = async () => {
    try {
      await getCapabilities(); // Uses cache if available
    } catch (err) {
      showError('Failed to load special capabilities');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingCapability) {
        await updateSpecialCapability(editingCapability.id, formData);
        showSuccess('Special capability updated successfully');
      } else {
        await createSpecialCapability(formData);
        showSuccess('Special capability created successfully');
      }
      setIsFormVisible(false);
      setEditingCapability(null);
      setFormData({ name: '', description: '' });
      loadCapabilities();
      clearMasterListsCache(); // Clear master lists cache after CRUD operation
    } catch (err) {
      showError(err?.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (capability) => {
    setEditingCapability(capability);
    setFormData({
      name: capability.name || '',
      description: capability.description || ''
    });
    setIsFormVisible(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this special capability?')) return;
    
    try {
      setLoading(true);
      await deleteSpecialCapability(id);
      showSuccess('Special capability deleted successfully');
      loadCapabilities();
      clearMasterListsCache(); // Clear master lists cache after CRUD operation
    } catch (err) {
      showError(err?.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingCapability(null);
    setFormData({ name: '', description: '' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Special Capabilities</h3>
        <p className="text-sm text-gray-500">These capabilities can be assigned to Job Order employees for special access rights.</p>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsFormVisible(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          ➕ Add Capability
        </button>
      </div>

      {loading && capabilities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Loading capabilities...</div>
      ) : capabilities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No special capabilities found. Create your first capability to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capability Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {capabilities.map((capability) => (
                <tr key={capability.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{capability.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {capability.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(capability)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(capability.id)}
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

      {isFormVisible && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-medium text-gray-900">
                {editingCapability ? 'Edit Special Capability' : 'Create Special Capability'}
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
                <label className="block text-sm font-medium text-gray-700">Capability Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="e.g., Advanced Reporting Access"
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
                  placeholder="Describe what this capability allows..."
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
                  {loading ? 'Saving...' : editingCapability ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpecialCapabilitiesTable;

