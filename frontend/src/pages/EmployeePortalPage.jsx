import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { toast } from '../components/Toast';
import QRCodeView from '../components/QRCodeView';

export default function EmployeePortalPage() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [activeTickets, setActiveTickets] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const loadData = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    try {
      const stored = localStorage.getItem('employeeData');
      if (!stored) {
        navigate('/login');
        return null;
      }
      const emp = JSON.parse(stored);
      setEmployee(emp);

      const [tickets, sum] = await Promise.all([
        api.getActive(emp.id),
        api.getMySummary(),
      ]);

      const activeList = tickets || [];
      setActiveTickets(activeList);
      setSummary(sum);
      return { tickets: activeList, summary: sum };
    } catch (err) {
      toast.err(err.message);
      return null;
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchInitial = async () => {
      try {
        const stored = localStorage.getItem('employeeData');
        if (!stored) {
          navigate('/login');
          return;
        }
        const emp = JSON.parse(stored);
        if (!ignore) setEmployee(emp);

        const [tickets, sum] = await Promise.all([
          api.getActive(emp.id),
          api.getMySummary(),
        ]);

        if (!ignore) {
          setActiveTickets(tickets || []);
          setSummary(sum);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          toast.err(err.message);
          setLoading(false);
        }
      }
    };

    fetchInitial();
    return () => {
      ignore = true;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('employeeData');
    navigate('/login');
  };

  const handleCloseModal = async () => {
    const closedTicket = selectedTicket;
    setSelectedTicket(null);

    if (closedTicket) {
      const updated = await loadData(false);
      if (updated?.tickets) {
        const stillActive = updated.tickets.some((t) => t.id === closedTicket.id);
        if (!stillActive) {
          const typeName = closedTicket.type === 'ALMUERZO' ? 'Almuerzo' : 'Merienda';
          toast.ok(`✅ ¡Ticket de ${typeName} canjeado con éxito!`);
        }
      }
    }
  };

  const showTicketQR = (type) => {
    const ticket = activeTickets.find((t) => t.type === type);
    if (!ticket) {
      toast.err(`No tienes tickets activos de ${type} en este periodo`);
      return;
    }
    setSelectedTicket(ticket);
  };

  if (loading) {
    return <div className="loading" style={{ minHeight: '100vh' }}>Cargando tus tickets...</div>;
  }

  const almuerzos = activeTickets.filter((t) => t.type === 'ALMUERZO');
  const meriendas = activeTickets.filter((t) => t.type === 'MERIENDA');

  return (
    <div className="portal-container">
      {/* Encabezado Mobile */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 14,
        }}
      >
        <div>
          <div className="brand-badge-wrap portal-brand-badge" style={{ marginBottom: 8 }}>
            <img src="/logo.png" alt="Logo" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <span className="brand-title" style={{ fontSize: 14 }}>
              <span className="brand-ticket">Ticket</span>
              <span className="brand-casino">Casino</span>
            </span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>¡Hola, {employee?.name?.split(' ')[0]}!</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            @{employee?.username} · C.C. {employee?.document}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => loadData(false)}
            title="Actualizar saldo"
            style={{ padding: '6px 10px' }}
          >
            🔄
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{ padding: '6px 12px' }}
          >
            🚪 Salir
          </button>
        </div>
      </div>

      {/* Saldo de Tickets Disponibles */}
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        Tus Tickets Disponibles (Periodo Actual)
      </h3>

      <div className="portal-tickets-grid">
        {/* Tarjeta Almuerzo */}
        <div
          className="card"
          style={{
            textAlign: 'center',
            borderColor: almuerzos.length > 0 ? '#6366f160' : 'var(--border)',
            background: almuerzos.length > 0 ? 'rgba(99, 102, 241, 0.08)' : 'var(--surface)',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 4 }}>🍽</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>ALMUERZOS</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)', margin: '4px 0' }}>
            {almuerzos.length}
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
            disabled={almuerzos.length === 0}
            onClick={() => showTicketQR('ALMUERZO')}
          >
            📱 Mostrar QR
          </button>
        </div>

        {/* Tarjeta Merienda */}
        <div
          className="card"
          style={{
            textAlign: 'center',
            borderColor: meriendas.length > 0 ? '#f59e0b60' : 'var(--border)',
            background: meriendas.length > 0 ? 'rgba(245, 158, 11, 0.08)' : 'var(--surface)',
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 4 }}>🥪</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>MERIENDAS</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--warning)', margin: '4px 0' }}>
            {meriendas.length}
          </div>
          <button
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
            disabled={meriendas.length === 0}
            onClick={() => showTicketQR('MERIENDA')}
          >
            📱 Mostrar QR
          </button>
        </div>
      </div>

      {/* Historial Reciente de Consumos */}
      <div className="card">
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
          🕒 Tus últimos consumos
        </h4>
        {summary?.historialReciente?.length === 0 ? (
          <div className="empty" style={{ padding: '24px 10px' }}>
            <p>Aún no has registrado consumos en este periodo.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {summary?.historialReciente?.slice(0, 5).map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'var(--surface2)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{item.type === 'ALMUERZO' ? '🍽' : '🥪'}</span>
                  <strong>{item.type}</strong>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                  {item.usedAt ? new Date(item.usedAt).toLocaleString('es-CO') : 'Usado'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para presentar el QR en el comedor */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal ticket-modal"
            style={{ textAlign: 'center', maxWidth: 360, width: '100%', padding: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              PRESÉNTALO EN EL COMEDOR
            </div>
            <h3 style={{ fontSize: 20, margin: '6px 0 14px' }}>
              {selectedTicket.type === 'ALMUERZO' ? '🍽 Ticket de Almuerzo' : '🥪 Ticket de Merienda'}
            </h3>

            {/* Código QR generado localmente */}
            <div
              style={{
                background: '#ffffff',
                padding: 16,
                borderRadius: 14,
                display: 'inline-block',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                marginBottom: 14,
              }}
            >
              <QRCodeView
                value={JSON.stringify({
                  ticketId: selectedTicket.id,
                  employeeId: employee.id,
                })}
                size={220}
              />
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              <p>Acerca este código al lector del casino</p>
              <p style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 10 }}>
                ID: {selectedTicket.id.slice(0, 14)}...
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleCloseModal}
            >
              Listo / Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

