import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, QrCode, LogOut, Menu, X } from "lucide-react";
import { cn } from "../lib/utils";

const nav = [
  { path: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { path: "/employees", label: "Empleados", icon: <Users size={18} /> },
  { path: "/validate", label: "Validar QR", icon: <QrCode size={18} /> },
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
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("employeeData");
    navigate("/login");
  };

  const handleNav = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header (only visible on <= 768px) */}
      <header className="fixed inset-x-0 top-0  z-40 flex h-14 items-center justify-between border-b border-white/[0.07] bg-surface px-4 md:hidden">
        <button
          type="button"
          className="rounded-lg p-2 text-[#94A3B8] transition-colors hover:bg-white/5 hover:text-text"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="TicketCasino"
            className="size-7  rounded-md object-cover"
          />
          <span className="text-base font-bold tracking-tight">
            <span className="text-text">Ticket</span>
            <span className="text-primary-dark">Casino</span>
          </span>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-[#94A3B8] transition-colors hover:bg-white/5 hover:text-text"
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop fixed sidebar / Mobile drawer) */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-[240px] flex-col border-r border-white/[0.07] bg-surface transition-transform duration-300",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-white/[0.07] px-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="TicketCasino"
              className="size-8  rounded-lg object-cover"
            />
            <div className="text-base leading-none font-bold tracking-tight">
              <span className="text-text">Ticket</span>
              <span className="text-primary-dark">Casino</span>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            type="button"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-text md:hidden"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => (
            <button
              key={item.path}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                pathname === item.path
                  ? "bg-primary/10 text-primary"
                  : "text-[#94A3B8] hover:bg-white/5 hover:text-text",
              )}
              onClick={() => handleNav(item.path)}
            >
              <span
                className={
                  pathname === item.path ? "text-primary" : "text-muted"
                }
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/[0.07] px-3 py-4">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#94A3B8] transition-colors hover:bg-white/5 hover:text-text"
            onClick={logout}
          >
            <span className="text-muted">
              <LogOut size={18} />
            </span>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
