import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function BorrowRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const res = await api.get('/borrow-requests');
    setRequests(res.data.requests);
  };

  const handleAction = async (id, action) => {
    try {
      await api.put(`/borrow-requests/${id}/${action}`);
      setMessage(`Request ${action === 'return' ? 'marked as returned' : action + 'd'} successfully.`);
      setError('');
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed.');
      setMessage('');
    }
  };

  const statusClass = (status) => `status-badge status-${status}`;

  return (
    <div className="container">
      <div className="page-header">
        <h1>{user.role === 'student' ? 'My Borrow Requests' : 'All Borrow Requests'}</h1>
      </div>

      {message && <div className="alert alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert alert-error" onClick={() => setError('')}>{error}</div>}

      {requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
          No borrow requests found.
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Category</th>
                {user.role !== 'student' && <th>Requested By</th>}
                <th>Qty</th>
                <th>Request Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Notes</th>
                {user.role !== 'student' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td style={{ fontWeight: 500 }}>{req.equipment_name}</td>
                  <td>{req.equipment_category}</td>
                  {user.role !== 'student' && <td>{req.user_name}<br/><span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{req.user_email}</span></td>}
                  <td>{req.quantity}</td>
                  <td>{new Date(req.request_date).toLocaleDateString()}</td>
                  <td>{req.due_date ? new Date(req.due_date).toLocaleDateString() : '—'}</td>
                  <td><span className={statusClass(req.status)}>{req.status}</span></td>
                  <td style={{ maxWidth: '150px', fontSize: '0.85rem', color: 'var(--text-light)' }}>{req.notes || '—'}</td>
                  {user.role !== 'student' && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        {req.status === 'pending' && (
                          <>
                            <button className="btn btn-sm btn-success" onClick={() => handleAction(req.id, 'approve')}>Approve</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleAction(req.id, 'reject')}>Reject</button>
                          </>
                        )}
                        {req.status === 'approved' && (
                          <button className="btn btn-sm btn-warning" onClick={() => handleAction(req.id, 'return')}>Return</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
