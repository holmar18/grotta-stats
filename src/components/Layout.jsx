import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/', icon: '⚡', label: 'Leikur' },
  { to: '/games', icon: '📋', label: 'Leikir' },
  { to: '/players', icon: '👥', label: 'Leikmenn' },
  { to: '/stats', icon: '📊', label: 'Tölfræði' },
  { to: '/compare', icon: '⚖️', label: 'Saman' },
];

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-logo">
            <img src="assets/grotta-logo.png" alt="Grótta" style={{ width: 28, height: 28 }} />
          </span>
          <span className="topbar-title">Grótta Stats</span>
        </div>
        <button className="topbar-settings" onClick={() => navigate('/settings')}>
          ⚙️
        </button>
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      <nav className="bottomnav">
        {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `bottomnav-item ${isActive ? 'active' : ''}`
              }
            >
            <span className="bottomnav-icon">{item.icon}</span>
            <span className="bottomnav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}