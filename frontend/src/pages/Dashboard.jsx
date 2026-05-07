import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [recentEquipment, setRecentEquipment] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const eqRes = await api.get('/equipment');
      setRecentEquipment(eqRes.data.equipment.slice(0, 4));

      if (user.role !== 'student') {
        const statsRes = await api.get('/borrow-requests/stats');
        setStats(statsRes.data.stats);
      }

      const reqRes = await api.get('/borrow-requests');
      setMyRequests(reqRes.data.requests.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Welcome, {user.name}!</h1>
        <span className="status-badge status-approved" style={{ fontSize: '0.9rem', padding: '4px 14px' }}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalEquipment}</div>
            <div className="stat-label">Total Equipment</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pendingRequests}</div>
            <div className="stat-label">Pending Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.approvedRequests}</div>
            <div className="stat-label">Active Borrows</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Recent Equipment</h2>
          {recentEquipment.map(eq => (
            <div key={eq.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="card-title">{eq.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{eq.category}</div>
              </div>
              <span className={`status-badge ${eq.available_quantity > 0 ? 'status-available' : 'status-unavailable'}`}>
                {eq.available_quantity}/{eq.total_quantity} available
              </span>
            </div>
          ))}
        </div>

        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>
            {user.role === 'student' ? 'My Requests' : 'Recent Requests'}
          </h2>
          {myRequests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
              No requests yet.
            </div>
          ) : (
            myRequests.map(req => (
              <div key={req.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="card-title">{req.equipment_name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                    {user.role !== 'student' && `${req.user_name} · `}
                    {new Date(req.request_date).toLocaleDateString()}
                  </div>
                </div>
                <span className={`status-badge status-${req.status}`}>{req.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
