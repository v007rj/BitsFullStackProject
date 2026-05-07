import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header className="navbar">
      <Link to="/dashboard" className="logo">Equipment Portal</Link>
      <nav>
        <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
        <Link to="/equipment" className={isActive('/equipment')}>Equipment</Link>
        <Link to="/requests" className={isActive('/requests')}>Requests</Link>
        {user?.role === 'admin' && (
          <Link to="/admin" className={isActive('/admin')}>Admin</Link>
        )}
      </nav>
      <div className="user-info">
        <span>{user?.name}</span>
        <span className="badge">{user?.role}</span>
        <button className="btn btn-sm btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }} onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
