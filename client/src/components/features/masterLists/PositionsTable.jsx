import React, { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { createPosition, updatePosition, deletePosition } from '../../../api/master-lists/positions';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useMasterListsStore } from '../../../stores/masterListsStore';
import { usePositionsTableStore } from '../../../stores/masterListTablesStore';
import TableActionButton from '../../ui/TableActionButton';

function PositionsTable() {
  const { getPositions, positions, loading } = usePositionsTableStore();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);
  const { clearCache: clearMasterListsCache } = useMasterListsStore();

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      await getPositions(); // Uses cache if available
    } catch (err) {
      showError('Failed to load positions');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingPosition) {
        await updatePosition(editingPosition.id, formData);
        showSuccess('Position updated successfully');
      } else {
        await createPosition(formData);
        showSuccess('Position created successfully');
      }
      setIsFormVisible(false);
      setEditingPosition(null);
      setFormData({ title: '', description: '' });
      loadPositions();
      clearMasterListsCache(); // Clear master lists cache after CRUD operation
    } catch (err) {
      showError(err?.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (position) => {
    setEditingPosition(position);
    setFormData({
      title: position.title || '',
      description: position.description || ''
    });
    setIsFormVisible(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this position?')) return;
    
    try {
      setLoading(true);
      await deletePosition(id);
      showSuccess('Position deleted successfully');
      loadPositions();
    } catch (err) {
      showError(err?.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingPosition(null);
    setFormData({ title: '', description: '' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Positions/Designations</h3>
        <button
          onClick={() => setIsFormVisible(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          ➕ Add Position
        </button>
      </div>

      {loading && positions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Loading positions...</div>
      ) : positions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No positions found. Create your first position to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {positions.map((position) => (
                <tr key={position.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{position.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {position.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2 items-center flex-nowrap">
                      <TableActionButton
                        variant="indigo"
                        icon={Pencil}
                        label="Edit"
                        onClick={() => handleEdit(position)}
                        title="Edit position"
                      />
                      <TableActionButton
                        variant="red"
                        icon={Trash2}
                        label="Delete"
                        onClick={() => handleDelete(position.id)}
                        title="Delete position"
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
                {editingPosition ? 'Edit Position' : 'Create Position'}
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
                <label className="block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="e.g., IT Officer 1"
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
                  placeholder="Position description..."
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
                  {loading ? 'Saving...' : editingPosition ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PositionsTable;

