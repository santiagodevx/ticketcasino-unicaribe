import { useEffect, useState } from 'react';
import { api } from '../api';
import { toast } from '../components/Toast';

function BarChart({ data }) {
  if (!data.length) return null;
  const max = Math.max(...data.flatMap((d) => [d.ALMUERZO, d.MERIENDA]), 1);
  const last15 = data.slice(-15);

  return (
    <div>
      <div className="legend">
        <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--primary)' }} />Almuerzo</div>
        <div className="legend-item"><div className="legend-dot" style={{ background: '#22c55e' }} />Merienda</div>
      </div>
      <div className="bar-chart-wrap">
        <div className="bar-chart">
          {last15.map((d) => (
            <div key={d.date} className="bar-col">
              <div className="bars">
                <div className="bar almuerzo" title={`Almuerzo: ${d.ALMUERZO}`} style={{ height: `${(d.ALMUERZO / max) * 100}px` }} />
                <div className="bar merienda" title={`Merienda: ${d.MERIENDA}`} style={{ height: `${(d.MERIENDA / max) * 100}px` }} />
              </div>
              <div className="bar-label">{d.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [top, setTop] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    try {
      const [s, t, d] = await Promise.all([api.getSummary(), api.getTopConsumers(), api.getDaily()]);
      setSummary(s);
      setTop(t);
      setDaily(d);
    } catch (err) {
      toast.err(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchSummary = async () => {
      try {
        const [s, t, d] = await Promise.all([api.getSummary(), api.getTopConsumers(), api.getDaily()]);
        if (!ignore) {
          setSummary(s);
          setTop(t);
          setDaily(d);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          toast.err(err.message);
          setLoading(false);
        }
      }
    };
    fetchSummary();
    return () => {
      ignore = true;
    };
  }, []);

  const generateAll = async () => {
    setGenerating(true);
    try {
      const res = await api.generateForAll();
      toast.ok(`✅ ${res.ticketsCreated} tickets generados`);
      load();
    } catch (err) {
      toast.err(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const byStatus = (status) => summary?.ticketsByStatus?.find((s) => s.status === status)?.count ?? 0;
  const byType = (type) => summary?.consumedByType?.find((t) => t.type === type)?.count ?? 0;

  if (loading) return <div className="loading">Cargando dashboard...</div>;

  return (
    <div>
      <div className="flex-between page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Resumen general del sistema de tickets</p>
        </div>
        <button className="btn btn-primary" onClick={generateAll} disabled={generating}>
          {generating ? '⏳ Generando...' : '🎫 Generar periodo'}
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card indigo">
          <div className="label">Empleados activos</div>
          <div className="value">{summary?.totalActiveEmployees ?? 0}</div>
          <div className="sublabel">en el sistema</div>
        </div>
        <div className="stat-card green">
          <div className="label">Tickets activos</div>
          <div className="value">{byStatus('ACTIVO')}</div>
          <div className="sublabel">disponibles</div>
        </div>
        <div className="stat-card yellow">
          <div className="label">Tickets usados</div>
          <div className="value">{byStatus('USADO')}</div>
          <div className="sublabel">consumidos</div>
        </div>
        <div className="stat-card red">
          <div className="label">Tickets vencidos</div>
          <div className="value">{byStatus('VENCIDO')}</div>
          <div className="sublabel">expirados</div>
        </div>
        <div className="stat-card">
          <div className="label">Almuerzos consumidos</div>
          <div className="value">{byType('ALMUERZO')}</div>
        </div>
        <div className="stat-card">
          <div className="label">Meriendas consumidas</div>
          <div className="value">{byType('MERIENDA')}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 700 }}>Consumos diarios — últimos 30 días</h3>
          {daily.length ? <BarChart data={daily} /> : <div className="empty"><p>Sin datos de consumo aún</p></div>}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 14, fontWeight: 700 }}>🏆 Top consumidores</h3>
          {top.length === 0 && <div className="empty"><p>Sin datos aún</p></div>}
          {top.map((item, i) => (
            <div key={item.employee?.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < top.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--text-muted)', width: 18, fontSize: 12 }}>#{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.employee?.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{item.employee?.document}</div>
                </div>
              </div>
              <span className="badge indigo">{item.consumed}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

