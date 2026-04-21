import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STATUS_COLORS = { PENDING: '#f59e0b', IN_PROGRESS: '#3b82f6', COMPLETED: '#10b981' };
const PRIORITY_COLORS = { LOW: '#9ca3af', MEDIUM: '#f59e0b', HIGH: '#ef4444' };

const EMPTY_FORM = { title: '', description: '', status: 'PENDING', priority: 'MEDIUM', dueDate: '' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [success, setSuccess] = useState('');

  const [modal, setModal] = useState({ open: false, mode: 'create', task: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setPageError('');
    try {
      const params = new URLSearchParams({ page: pagination.page, limit: pagination.limit });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);

      const { data } = await api.get(`/tasks?${params}`);
      setTasks(data.data.tasks);
      setPagination(data.data.pagination);
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Reset page when filters change
  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setModal({ open: true, mode: 'create', task: null });
  };

  const openEdit = (task) => {
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setFormError('');
    setModal({ open: true, mode: 'edit', task });
  };

  const closeModal = () => setModal({ open: false, mode: 'create', task: null });

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const payload = { ...form, dueDate: form.dueDate || undefined };
      if (modal.mode === 'create') {
        await api.post('/tasks', payload);
        showSuccess('Task created successfully!');
      } else {
        await api.put(`/tasks/${modal.task.id}`, payload);
        showSuccess('Task updated successfully!');
      }
      closeModal();
      fetchTasks();
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong.';
      const errs = err.response?.data?.errors;
      setFormError(errs ? errs.map((e) => e.msg).join(', ') : msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tasks/${deleteTarget}`);
      setDeleteTarget(null);
      showSuccess('Task deleted successfully!');
      fetchTasks();
    } catch (err) {
      setPageError(err.response?.data?.message || 'Delete failed.');
      setDeleteTarget(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">Prime Trade</div>
        <div className="navbar-user">
          <span>
            {user?.name}
            <span className={`role-badge role-${user?.role?.toLowerCase()}`}>{user?.role}</span>
          </span>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header">
          <h1>{user?.role === 'ADMIN' ? 'All Tasks' : 'My Tasks'}</h1>
          <button className="btn btn-primary" onClick={openCreate}>
            + New Task
          </button>
        </div>

        {/* Alerts */}
        {success && <div className="alert alert-success">{success}</div>}
        {pageError && <div className="alert alert-error">{pageError}</div>}

        {/* Filters */}
        <div className="filters">
          <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)}>
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="loading">Loading tasks…</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <strong>No tasks found</strong>
            <p>Create your first task to get started!</p>
          </div>
        ) : (
          <div className="task-grid">
            {tasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-header">
                  <h3 className="task-title">{task.title}</h3>
                  <div className="task-actions">
                    <button className="btn-icon" title="Edit" onClick={() => openEdit(task)}>✏️</button>
                    <button className="btn-icon" title="Delete" onClick={() => setDeleteTarget(task.id)}>🗑️</button>
                  </div>
                </div>

                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}

                <div className="task-meta">
                  <span className="badge" style={{ backgroundColor: STATUS_COLORS[task.status] }}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className="badge" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <span className="due-date">
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {user?.role === 'ADMIN' && (
                  <p className="task-owner">👤 {task.user?.name} ({task.user?.email})</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              ← Prev
            </button>
            <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      {modal.open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modal.mode === 'create' ? 'Create New Task' : 'Edit Task'}</h2>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="Task title"
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="Optional description…"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select id="status" name="status" value={form.status} onChange={handleFormChange}>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select id="priority" name="priority" value={form.priority} onChange={handleFormChange}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Due Date</label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={handleFormChange}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving…' : modal.mode === 'create' ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <h2>Delete Task</h2>
            <p>Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
