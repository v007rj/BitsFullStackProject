import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Equipment() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [borrowModal, setBorrowModal] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', description: '', condition: 'good', total_quantity: 1 });
  const [borrowForm, setBorrowForm] = useState({ due_date: '', notes: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadEquipment();
    loadCategories();
  }, [search, categoryFilter, availableOnly]);

  const loadEquipment = async () => {
    const params = {};
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    if (availableOnly) params.available = 'true';
    const res = await api.get('/equipment', { params });
    setEquipment(res.data.equipment);
  };

  const loadCategories = async () => {
    const res = await api.get('/equipment/categories');
    setCategories(res.data.categories);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', category: '', description: '', condition: 'good', total_quantity: 1 });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description || '',
      condition: item.condition,
      total_quantity: item.total_quantity
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editItem) {
        await api.put(`/equipment/${editItem.id}`, form);
        setMessage('Equipment updated successfully.');
      } else {
        await api.post('/equipment', form);
        setMessage('Equipment added successfully.');
      }
      setShowModal(false);
      loadEquipment();
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    try {
      await api.delete(`/equipment/${id}`);
      setMessage('Equipment deleted.');
      loadEquipment();
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed.');
    }
  };

  const handleBorrow = async (e) => {
    e.preventDefault();
    try {
      await api.post('/borrow-requests', {
        equipment_id: borrowModal.id,
        quantity: 1,
        due_date: borrowForm.due_date || undefined,
        notes: borrowForm.notes || undefined,
      });
      setMessage('Borrow request submitted!');
      setBorrowModal(null);
      setBorrowForm({ due_date: '', notes: '' });
      loadEquipment();
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed.');
      setBorrowModal(null);
    }
  };

  const clearMessages = () => { setMessage(''); setError(''); };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Equipment</h1>
        {user.role === 'admin' && (
          <button className="btn btn-primary" onClick={openAdd}>+ Add Equipment</button>
        )}
      </div>

      {message && <div className="alert alert-success" onClick={clearMessages}>{message}</div>}
      {error && <div className="alert alert-error" onClick={clearMessages}>{error}</div>}

      <div className="filters">
        <input
          type="text"
          placeholder="Search equipment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          Available only
        </label>
      </div>

      <div className="equipment-grid">
        {equipment.map(item => (
          <div key={item.id} className="equipment-card">
            <div className="eq-header">
              <span className="eq-name">{item.name}</span>
              <span className="eq-category">{item.category}</span>
            </div>
            {item.description && <div className="eq-desc">{item.description}</div>}
            <div className="eq-details">
              <span>Condition: {item.condition}</span>
              <span className={item.available_quantity > 0 ? '' : 'status-badge status-unavailable'}>
                {item.available_quantity}/{item.total_quantity} available
              </span>
            </div>
            <div className="eq-actions">
              {item.available_quantity > 0 && (
                <button className="btn btn-sm btn-primary" onClick={() => { setBorrowModal(item); clearMessages(); }}>
                  Request Borrow
                </button>
              )}
              {user.role === 'admin' && (
                <>
                  <button className="btn btn-sm btn-outline" onClick={() => openEdit(item)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {equipment.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
          No equipment found.
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editItem ? 'Edit Equipment' : 'Add Equipment'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required
                  list="category-list" placeholder="e.g., Sports, Lab Equipment" />
                <datalist id="category-list">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Condition</label>
                  <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Quantity</label>
                  <input type="number" min="1" value={form.total_quantity}
                    onChange={e => setForm({ ...form, total_quantity: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Borrow Modal */}
      {borrowModal && (
        <div className="modal-overlay" onClick={() => setBorrowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Request: {borrowModal.name}</h2>
            <form onSubmit={handleBorrow}>
              <div className="form-group">
                <label>Expected Return Date</label>
                <input type="date" value={borrowForm.due_date} onChange={e => setBorrowForm({ ...borrowForm, due_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <textarea value={borrowForm.notes} onChange={e => setBorrowForm({ ...borrowForm, notes: e.target.value })}
                  rows="3" placeholder="Reason for borrowing..." />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setBorrowModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
