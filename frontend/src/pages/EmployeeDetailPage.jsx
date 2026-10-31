import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Printer, Utensils, Coffee, QrCode, Ticket } from 'lucide-react';
import { api } from '../api';
import { toast } from '../components/Toast';
import QRCodeView from '../components/QRCodeView';

const STATUS_CLASS = { ACTIVO: 'green', USADO: 'gray', VENCIDO: 'red' };
const TYPE_CLASS = { ALMUERZO: 'indigo', MERIENDA: 'yellow' };

function TicketModal({ ticket, employee, onClose }) {
  const qrPayload = JSON.stringify({
    ticketId: ticket.id,
    employeeId: employee.id,
  });

  const copyPayload = () => {
    navigator.clipboard.writeText(qrPayload);
    toast.ok('Código QR copiado al portapapeles');
  };

  const printTicket = () => {
    window.print();
  };

  const isAlmuerzo = ticket.type === 'ALMUERZO';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal ticket-modal"
        style={{
          maxWidth: 380,
          width: '100%',
          textAlign: 'center',
          background: 'var(--surface)',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del Ticket */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            TICKET DIGITAL CASINO
          </div>
          <h2 style={{ fontSize: 22, marginTop: 4, color: isAlmuerzo ? 'var(--primary)' : '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {isAlmuerzo ? <><Utensils size={20} /> ALMUERZO</> : <><Coffee size={20} /> MERIENDA</>}
          </h2>
          <span className={`badge ${STATUS_CLASS[ticket.status]}`} style={{ marginTop: 6 }}>
            ● {ticket.status}
          </span>
        </div>

        {/* Contenedor del Código QR */}
        <div
          style={{
            background: '#ffffff',
            padding: 18,
            borderRadius: 14,
            display: 'inline-block',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            marginBottom: 16,
          }}
        >
          <QRCodeView value={qrPayload} size={220} />
        </div>

        {/* Datos del Beneficiario */}
        <div
          style={{
            background: 'var(--surface2)',
            padding: '12px 16px',
            borderRadius: 10,
            textAlign: 'left',
            fontSize: 13,
            marginBottom: 18,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Empleado:</span>
            <strong style={{ color: 'var(--text)' }}>{employee.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Documento:</span>
            <span style={{ fontFamily: 'monospace' }}>{employee.document}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Vence:</span>
            <span>{new Date(ticket.expiresAt).toLocaleDateString('es-CO')}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex-gap" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={copyPayload} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Copy size={14} /> Copiar datos QR
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={printTicket} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Printer size={14} /> Imprimir
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [tab, setTab] = useState('activos');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const load = async () => {
    try {
      const data = await api.getEmployee(id);
      setEmployee(data);
    } catch (err) {
      toast.err(err.message);
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchEmp = async () => {
      try {
        const data = await api.getEmployee(id);
        if (!ignore) setEmployee(data);
      } catch (err) {
        if (!ignore) {
          toast.err(err.message);
          navigate('/employees');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchEmp();
    return () => {
      ignore = true;
    };
  }, [id, navigate]);

  const generate = async (type) => {
    setGenerating(true);
    try {
      const res = await api.generateForEmployee({ employeeId: id, type });
      toast.ok(res.message);
      load();
    } catch (err) {
      toast.err(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (!employee) return null;

  const activos = employee.tickets.filter((t) => t.status === 'ACTIVO');
  const usados = employee.tickets.filter((t) => t.status === 'USADO');
  const vencidos = employee.tickets.filter((t) => t.status === 'VENCIDO');
  const displayed = tab === 'activos' ? activos : tab === 'usados' ? usados : vencidos;

  return (
    <div>
      <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('/employees')}>
        <ArrowLeft size={14} /> Volver
      </button>

      <div className="flex-between page-header">
        <div>
          <h2>{employee.name}</h2>
          <p>Doc: {employee.document} &nbsp;·&nbsp; <span className={`badge ${employee.active ? 'green' : 'red'}`}>{employee.active ? '● Activo' : '● Inactivo'}</span></p>
        </div>
        <div className="flex-gap page-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => generate('ALMUERZO')} disabled={generating} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Utensils size={14} /> Generar almuerzos
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => generate('MERIENDA')} disabled={generating} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Coffee size={14} /> Generar meriendas
          </button>
        </div>
      </div>

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card green"><div className="label">Activos</div><div className="value">{activos.length}</div></div>
        <div className="stat-card yellow"><div className="label">Usados</div><div className="value">{usados.length}</div></div>
        <div className="stat-card red"><div className="label">Vencidos</div><div className="value">{vencidos.length}</div></div>
      </div>

      <div className="card">
        <div className="tabs">
          {[['activos', 'Activos'], ['usados', 'Historial'], ['vencidos', 'Vencidos']].map(([key, label]) => (
            <button key={key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <div className="empty"><div className="icon"><Ticket size={32} /></div><p>Sin tickets en esta categoría</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>{tab === 'usados' ? 'Usado el' : 'Vence el'}</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>{t.id.slice(0, 12)}...</td>
                    <td><span className={`badge ${TYPE_CLASS[t.type]}`}>{t.type}</span></td>
                    <td><span className={`badge ${STATUS_CLASS[t.status]}`}>{t.status}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {tab === 'usados' && t.usedAt
                        ? new Date(t.usedAt).toLocaleString('es-CO')
                        : new Date(t.expiresAt).toLocaleDateString('es-CO')}
                    </td>
                    <td>
                      {t.status === 'ACTIVO' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelectedTicket(t)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          <QrCode size={13} /> Ver QR
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          employee={employee}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
