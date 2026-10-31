import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, QrCode, LogOut, Menu, X } from 'lucide-react';

const nav = [
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: '/employees', label: 'Empleados', icon: <Users size={18} /> },
  { path: '/validate', label: 'Validar QR', icon: <QrCode size={18} /> },
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
          <Menu size={22} />
        </button>

        <div className="brand-badge mobile-brand-badge">
          <img src="/logo.png" alt="TicketCasino" className="brand-badge-logo" />
          <span className="brand-title">
            <span className="brand-ticket">Ticket</span>
            <span className="brand-casino">Casino</span>
          </span>
        </div>

        <button
          type="button"
          className="mobile-logout-btn"
          onClick={logout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut size={18} />
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
          <div className="brand-badge">
            <img src="/logo.png" alt="TicketCasino" className="brand-badge-logo" />
            <div className="brand-title">
              <span className="brand-ticket">Ticket</span>
              <span className="brand-casino">Casino</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {nav.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={logout}>
            <span className="nav-icon"><LogOut size={18} /></span> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
