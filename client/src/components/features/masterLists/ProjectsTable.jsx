import React, { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { createProject, updateProject, deleteProject } from '../../../api/master-lists/projects';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useMasterListsStore } from '../../../stores/masterListsStore';
import { useProjectsTableStore } from '../../../stores/masterListTablesStore';
import TableActionButton from '../../ui/TableActionButton';

function ProjectsTable() {
  const { getProjects, projects, loading } = useProjectsTableStore();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    project_code: '',
    status: 'active',
    project_manager: ''
  });

  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);
  const { clearCache: clearMasterListsCache } = useMasterListsStore();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      await getProjects(); // Uses cache if available
    } catch (err) {
      showError('Failed to load projects');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingProject) {
        await updateProject(editingProject.id, formData);
        showSuccess('Project updated successfully');
      } else {
        await createProject(formData);
        showSuccess('Project created successfully');
      }
      setIsFormVisible(false);
      setEditingProject(null);
      setFormData({ name: '', project_code: '', status: 'active', project_manager: '' });
      loadProjects();
      clearMasterListsCache(); // Clear master lists cache after CRUD operation
    } catch (err) {
      showError(err?.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name || '',
      project_code: project.project_code || '',
      status: project.status || 'active',
      project_manager: project.project_manager || ''
    });
    setIsFormVisible(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      setLoading(true);
      await deleteProject(id);
      showSuccess('Project deleted successfully');
      loadProjects();
      clearMasterListsCache(); // Clear master lists cache after CRUD operation
    } catch (err) {
      showError(err?.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setEditingProject(null);
    setFormData({ name: '', project_code: '', status: 'active', project_manager: '' });
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      completed: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Project Affiliations</h3>
        <button
          onClick={() => setIsFormVisible(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          ➕ Add Project
        </button>
      </div>

      {loading && projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No projects found. Create your first project to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Focal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{project.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {project.project_code || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(project.status)}`}>
                      {project.status?.toUpperCase() || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.project_manager || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2 items-center flex-wrap">
                      <TableActionButton
                        variant="indigo"
                        icon={Pencil}
                        label="Edit"
                        onClick={() => handleEdit(project)}
                        title="Edit project"
                      />
                      <TableActionButton
                        variant="red"
                        icon={Trash2}
                        label="Delete"
                        onClick={() => handleDelete(project.id)}
                        title="Delete project"
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
                {editingProject ? 'Edit Project' : 'Create Project'}
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
                <label className="block text-sm font-medium text-gray-700">Project Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="e.g., Digital Transformation Project"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Project Code</label>
                <input
                  type="text"
                  value={formData.project_code}
                  onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="e.g., DTP-2025"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Status <span className="text-red-500">*</span></label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Project Focal</label>
                <input
                  type="text"
                  value={formData.project_manager}
                  onChange={(e) => setFormData({ ...formData, project_manager: e.target.value })}
                  disabled={loading}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Project focal name"
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
                  {loading ? 'Saving...' : editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsTable;

