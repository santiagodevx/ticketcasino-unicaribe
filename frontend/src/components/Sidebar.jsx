import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const nav = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/employees', label: 'Empleados', icon: '👥' },
  { path: '/validate', label: 'Validar QR', icon: '🎫' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close sidebar drawer automatically on route navigation (without cascading effect)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  // Lock background scroll when drawer is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('employeeData');
    navigate('/login');
  };

  const handleNav = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header (only visible on <= 768px) */}
      <header className="mobile-topbar">
        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menú"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="mobile-brand">
          <div className="brand-badge-wrap mobile-brand-badge">
            <img src="/logo.png" alt="TicketCasino" className="mobile-brand-logo" />
            <span className="brand-title">
              <span className="brand-ticket">Ticket</span>
              <span className="brand-casino">Casino</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          className="mobile-logout-btn"
          onClick={logout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          🚪
        </button>
      </header>

      {/* Backdrop Overlay for Mobile Drawer */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop fixed sidebar / Mobile drawer) */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-info">
            <div className="brand-badge-wrap">
              <img src="/logo.png" alt="TicketCasino" className="brand-logo-img" />
              <h1 className="brand-title">
                <span className="brand-ticket">Ticket</span>
                <span className="brand-casino">Casino</span>
              </h1>
            </div>
            <span>Panel de administración</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {nav.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={logout}>
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
