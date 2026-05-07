import { useState, useEffect } from 'react';
import api from '../api';

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, eqRes] = await Promise.all([
        api.get('/borrow-requests/stats'),
        api.get('/equipment'),
      ]);
      setStats(statsRes.data.stats);
      setEquipment(eqRes.data.equipment);
    } catch (err) {
      console.error('Failed to load admin data');
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Admin Panel</h1>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalEquipment}</div>
            <div className="stat-label">Equipment Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Registered Users</div>
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
            <div className="stat-value">{stats.totalRequests}</div>
            <div className="stat-label">Total Requests</div>
          </div>
        </div>
      )}

      <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Equipment Inventory</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Condition</th>
              <th>Total</th>
              <th>Available</th>
              <th>Utilization</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map(item => {
              const utilization = item.total_quantity > 0
                ? Math.round(((item.total_quantity - item.available_quantity) / item.total_quantity) * 100)
                : 0;
              return (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>{item.category}</td>
                  <td>{item.condition}</td>
                  <td>{item.total_quantity}</td>
                  <td>
                    <span className={`status-badge ${item.available_quantity > 0 ? 'status-available' : 'status-unavailable'}`}>
                      {item.available_quantity}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        flex: 1,
                        height: '8px',
                        background: '#e2e8f0',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${utilization}%`,
                          height: '100%',
                          background: utilization > 80 ? 'var(--danger)' : utilization > 50 ? 'var(--warning)' : 'var(--success)',
                          borderRadius: '4px'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', minWidth: '35px' }}>{utilization}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
