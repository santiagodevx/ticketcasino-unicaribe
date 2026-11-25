import { useCallback, useEffect, useState } from "react";
import {
  PlusCircle,
  Loader2,
  Users,
  Ticket,
  CheckCircle2,
  Clock,
  Utensils,
  Coffee,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";

/* ── Constantes ── */
const CHART_DAYS = 15;
const TODAY_REFRESH_MS = 30_000;

const TYPE_META = {
  ALMUERZO: { label: "Almuerzo", icon: Utensils, variant: "default" },
  MERIENDA: { label: "Merienda", icon: Coffee, variant: "secondary" },
};

const STAT_COLORS = {
  indigo: "text-indigo-400 bg-indigo-500/10",
  green: "text-emerald-400 bg-emerald-500/10",
  yellow: "text-primary bg-primary/10",
  red: "text-red-400 bg-red-500/10",
  default: "text-[#94A3B8] bg-white/5",
};

const formatTime = (date) =>
  date
    ? new Date(date).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

/* ── Bar chart artesanal ── */
function BarChart({ data }) {
  if (!data.length) return null;

  const days = data.slice(-CHART_DAYS);
  const max = Math.max(...days.flatMap((d) => [d.ALMUERZO, d.MERIENDA]), 1);

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5  rounded-sm bg-primary" />
          Almuerzo
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5  rounded-sm bg-emerald-500" />
          Merienda
        </div>
      </div>
      <div className="overflow-x-auto pb-1">
        <div
          className="flex min-w-max items-end gap-1.5"
          style={{ height: 108 }}
        >
          {days.map((d) => (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <div className="flex items-end gap-0.5" style={{ height: 90 }}>
                <div
                  className="w-4 rounded-t-sm bg-primary/80 transition-colors hover:bg-primary"
                  title={`Almuerzo: ${d.ALMUERZO}`}
                  style={{
                    height: `${(d.ALMUERZO / max) * 90}px`,
                    minHeight: d.ALMUERZO ? 3 : 0,
                  }}
                />
                <div
                  className="w-4 rounded-t-sm bg-emerald-500/80 transition-colors hover:bg-emerald-500"
                  title={`Merienda: ${d.MERIENDA}`}
                  style={{
                    height: `${(d.MERIENDA / max) * 90}px`,
                    minHeight: d.MERIENDA ? 3 : 0,
                  }}
                />
              </div>
              <span className="text-[10px] text-[#475569]">
                {d.date.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, sub, icon: Icon, color }) {
  const cls = STAT_COLORS[color] || STAT_COLORS.default;

  return (
    <Card className="flex items-center gap-4">
      <div
        className={`flex size-11  shrink-0 items-center justify-center rounded-xl ${cls}`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-2xl/tight  font-bold text-text">{value}</p>
        {sub && <p className="text-xs text-[#475569]">{sub}</p>}
      </div>
    </Card>
  );
}

/* ── Badge de tipo de ticket ── */
function TypeBadge({ type }) {
  const { label, icon: Icon, variant } = TYPE_META[type] ?? TYPE_META.MERIENDA;

  return (
    <Badge variant={variant} className="text-[11px]">
      <span className="flex items-center gap-1">
        <Icon size={11} /> {label}
      </span>
    </Badge>
  );
}

/* ── Consumos del día ── */
function TodayCard({ data }) {
  const items = data?.items ?? [];

  return (
    <Card className="border-white/8 bg-surface">
      <CardHeader className="flex flex-col gap-2 border-b border-white/6 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8  items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarCheck size={18} />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-text">
              Consumos de Hoy
            </CardTitle>
            <p className="text-xs text-muted">
              Registro en tiempo real de tickets canjeados durante el día
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
            <span className="size-1.5  animate-pulse rounded-full bg-emerald-400" />
            {data?.total ?? 0} consumos hoy
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-white/6 bg-white/3 px-2 py-1 text-xs text-[#94A3B8]">
            <Utensils size={12} className="text-primary" />{" "}
            {data?.almuerzos ?? 0}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-white/6 bg-white/3 px-2 py-1 text-xs text-[#94A3B8]">
            <Coffee size={12} className="text-amber-400" />{" "}
            {data?.meriendas ?? 0}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted">
            <Clock size={28} strokeWidth={1.5} />
            <p className="text-sm">
              Aún no se han registrado consumos en el día de hoy
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-[11px] font-semibold tracking-wider text-muted uppercase">
                  <th className="pb-2 text-left">Hora</th>
                  <th className="pb-2 text-left">Empleado</th>
                  <th className="pb-2 text-left">Documento</th>
                  <th className="pb-2 text-left">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/3">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-white/1.5"
                  >
                    <td className="py-2.5 font-mono text-xs text-[#94A3B8]">
                      {formatTime(item.usedAt)}
                    </td>
                    <td className="py-2.5">
                      <p className="leading-tight font-medium text-text">
                        {item.employee?.name || "Empleado sin registrar"}
                      </p>
                      {item.employee?.username && (
                        <p className="mt-0.5 font-mono text-[11px] leading-tight text-[#475569]">
                          @{item.employee.username}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 font-mono text-xs text-muted">
                      {item.employee?.document || "—"}
                    </td>
                    <td className="py-2.5">
                      <TypeBadge type={item.type} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Top consumidores ── */
function TopConsumers({ items }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Top consumidores</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#475569]">
            Sin datos aún
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map((item, i) => (
              <div
                key={item.employee?.id ?? i}
                className="flex items-center justify-between py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 text-xs text-[#475569]">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-text">
                      {item.employee?.name}
                    </p>
                    <p className="font-mono text-xs text-[#475569]">
                      {item.employee?.document}
                    </p>
                  </div>
                </div>
                <Badge>{item.consumed}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Página ── */
export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [top, setTop] = useState([]);
  const [daily, setDaily] = useState([]);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, t, d, today] = await Promise.all([
        api.getSummary(),
        api.getTopConsumers(),
        api.getDaily(),
        api.getToday(),
      ]);
      setSummary(s);
      setTop(t);
      setDaily(d);
      setTodayData(today);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    load();
  }, [load]);

  // Refresca solo "Consumos de hoy" cada 30 s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        setTodayData(await api.getToday());
      } catch {
        // Silencioso: el próximo intento lo vuelve a cargar
      }
    }, TODAY_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const generateAll = async () => {
    setGenerating(true);
    try {
      const res = await api.generateForAll();
      toast.success(`${res.ticketsCreated} tickets generados`);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-muted">
        <Loader2 size={20} className="spin" /> Cargando dashboard...
      </div>
    );
  }

  const status = Object.fromEntries(
    (summary?.ticketsByStatus ?? []).map((s) => [s.status, s.count]),
  );
  const type = Object.fromEntries(
    (summary?.consumedByType ?? []).map((t) => [t.type, t.count]),
  );

  const stats = [
    {
      label: "Empleados activos",
      value: summary?.totalActiveEmployees,
      sub: "en el sistema",
      icon: Users,
      color: "indigo",
    },
    {
      label: "Tickets activos",
      value: status.ACTIVO,
      sub: "disponibles",
      icon: Ticket,
      color: "green",
    },
    {
      label: "Tickets usados",
      value: status.USADO,
      sub: "consumidos",
      icon: CheckCircle2,
      color: "yellow",
    },
    {
      label: "Tickets vencidos",
      value: status.VENCIDO,
      sub: "expirados",
      icon: Clock,
      color: "red",
    },
    {
      label: "Almuerzos consumidos",
      value: type.ALMUERZO,
      icon: Utensils,
    },
    {
      label: "Meriendas consumidas",
      value: type.MERIENDA,
      icon: Coffee,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-text">Dashboard</h2>
          <p className="text-sm text-muted">
            Resumen general del sistema de tickets
          </p>
        </div>
        <Button onClick={generateAll} disabled={generating}>
          {generating ? (
            <>
              <Loader2 size={15} className="spin" /> Generando...
            </>
          ) : (
            <>
              <PlusCircle size={15} /> Generar periodo
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} value={s.value ?? 0} />
        ))}
      </div>

      {/* Consumos del día */}
      <TodayCard data={todayData} />

      {/* Gráfico + Top consumidores */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Consumos diarios — últimos {CHART_DAYS} días</CardTitle>
          </CardHeader>
          <CardContent>
            {daily.length ? (
              <BarChart data={daily} />
            ) : (
              <p className="py-8 text-center text-sm text-[#475569]">
                Sin datos de consumo aún
              </p>
            )}
          </CardContent>
        </Card>

        <TopConsumers items={top} />
      </div>
    </div>
  );
}
