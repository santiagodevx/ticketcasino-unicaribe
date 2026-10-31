import { useEffect, useState } from 'react';
import { PlusCircle, Loader2, Users, Ticket, CheckCircle2, Clock, Utensils, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

/* ── Bar chart artesanal (se mantiene la lógica, solo estilos) ── */
function BarChart({ data }) {
  if (!data.length) return null;
  const max = Math.max(...data.flatMap((d) => [d.ALMUERZO, d.MERIENDA]), 1);
  const last15 = data.slice(-15);

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-[#64748B]">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[#F59E0B]" />
          Almuerzo
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          Merienda
        </div>
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex items-end gap-1.5 min-w-max" style={{ height: 108 }}>
          {last15.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <div className="flex items-end gap-0.5" style={{ height: 90 }}>
                <div
                  className="w-4 rounded-t-sm bg-[#F59E0B]/80 hover:bg-[#F59E0B] transition-colors"
                  title={`Almuerzo: ${d.ALMUERZO}`}
                  style={{ height: `${(d.ALMUERZO / max) * 90}px`, minHeight: d.ALMUERZO ? 3 : 0 }}
                />
                <div
                  className="w-4 rounded-t-sm bg-emerald-500/80 hover:bg-emerald-500 transition-colors"
                  title={`Merienda: ${d.MERIENDA}`}
                  style={{ height: `${(d.MERIENDA / max) * 90}px`, minHeight: d.MERIENDA ? 3 : 0 }}
                />
              </div>
              <span className="text-[10px] text-[#475569] rotate-0">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, sub, icon: Icon, color }) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10',
    green: 'text-emerald-400 bg-emerald-500/10',
    yellow: 'text-[#F59E0B] bg-[#F59E0B]/10',
    red: 'text-red-400 bg-red-500/10',
    default: 'text-[#94A3B8] bg-white/5',
  };
  const cls = colors[color] || colors.default;

  return (
    <Card className="flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cls}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-[#64748B]">{label}</p>
        <p className="text-2xl font-bold text-[#F1F5F9] leading-tight">{value}</p>
        {sub && <p className="text-xs text-[#475569]">{sub}</p>}
      </div>
    </Card>
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
      toast.error(err.message);
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchAll = async () => {
      try {
        const [s, t, d] = await Promise.all([api.getSummary(), api.getTopConsumers(), api.getDaily()]);
        if (!ignore) { setSummary(s); setTop(t); setDaily(d); setLoading(false); }
      } catch (err) {
        if (!ignore) { toast.error(err.message); setLoading(false); }
      }
    };
    fetchAll();
    return () => { ignore = true; };
  }, []);

  const generateAll = async () => {
    setGenerating(true);
    try {
      const res = await api.generateForAll();
      toast.success(`${res.ticketsCreated} tickets generados`);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const byStatus = (status) => summary?.ticketsByStatus?.find((s) => s.status === status)?.count ?? 0;
  const byType = (type) => summary?.consumedByType?.find((t) => t.type === type)?.count ?? 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-[#64748B]">
        <Loader2 size={20} className="spin" /> Cargando dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F1F5F9]">Dashboard</h2>
          <p className="text-sm text-[#64748B]">Resumen general del sistema de tickets</p>
        </div>
        <Button onClick={generateAll} disabled={generating}>
          {generating ? <><Loader2 size={15} className="spin" /> Generando...</> : <><PlusCircle size={15} /> Generar periodo</>}
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Empleados activos" value={summary?.totalActiveEmployees ?? 0} sub="en el sistema" icon={Users} color="indigo" />
        <StatCard label="Tickets activos" value={byStatus('ACTIVO')} sub="disponibles" icon={Ticket} color="green" />
        <StatCard label="Tickets usados" value={byStatus('USADO')} sub="consumidos" icon={CheckCircle2} color="yellow" />
        <StatCard label="Tickets vencidos" value={byStatus('VENCIDO')} sub="expirados" icon={Clock} color="red" />
        <StatCard label="Almuerzos consumidos" value={byType('ALMUERZO')} icon={Utensils} color="default" />
        <StatCard label="Meriendas consumidas" value={byType('MERIENDA')} icon={Coffee} color="default" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Consumos diarios — últimos 30 días</CardTitle>
          </CardHeader>
          <CardContent>
            {daily.length
              ? <BarChart data={daily} />
              : <p className="py-8 text-center text-sm text-[#475569]">Sin datos de consumo aún</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top consumidores</CardTitle>
          </CardHeader>
          <CardContent>
            {top.length === 0
              ? <p className="py-8 text-center text-sm text-[#475569]">Sin datos aún</p>
              : (
                <div className="divide-y divide-white/[0.05]">
                  {top.map((item, i) => (
                    <div key={item.employee?.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-xs text-[#475569]">#{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#F1F5F9]">{item.employee?.name}</p>
                          <p className="text-xs text-[#475569] font-mono">{item.employee?.document}</p>
                        </div>
                      </div>
                      <Badge>{item.consumed}</Badge>
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
