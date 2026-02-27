import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/', icon: '⚡', label: 'Leikur' },
  { to: '/games', icon: '📋', label: 'Leikir' },
  { to: '/players', icon: '👥', label: 'Leikmenn' },
  { to: '/stats', icon: '📊', label: 'Tölfræði' },
  { to: '/compare', icon: '⚖️', label: 'Saman' },
];

export default function Layout({ gameActive }) {
  const navigate = useNavigate();

  const handleNavClick = (e, to) => {
    if (gameActive && to !== '/') {
      e.preventDefault();
      if (confirm('Leikur er í gangi! Gögn tapast ef þú ferð héðan. Ertu viss?')) {
        navigate(to);
      }
    }
  };

  const handleSettingsClick = () => {
    if (gameActive) {
      if (confirm('Leikur er í gangi! Gögn tapast ef þú ferð héðan. Ertu viss?')) {
        navigate('/settings');
      }
    } else {
      navigate('/settings');
    }
  };

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-logo">
            <img src="/grotta-stats/grotta-logo.webp" alt="Grótta" style={{ width: 28, height: 28 }} />
          </span>
          <span className="topbar-title">Grótta Stats</span>
          {gameActive && <span className="live-badge">● LIVE</span>}
        </div>
        <button className="topbar-settings" onClick={handleSettingsClick}>
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
              `bottomnav-item ${isActive ? 'active' : ''} ${gameActive && item.to !== '/' ? 'disabled' : ''}`
            }
            onClick={(e) => handleNavClick(e, item.to)}
          >
            <span className="bottomnav-icon">{item.icon}</span>
            <span className="bottomnav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}