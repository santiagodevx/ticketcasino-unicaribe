import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Printer, Utensils, Coffee, QrCode, Ticket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import QRCodeView from '../components/QRCodeView';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

const STATUS_VARIANT = { ACTIVO: 'success', USADO: 'secondary', VENCIDO: 'danger' };
const TYPE_VARIANT = { ALMUERZO: 'default', MERIENDA: 'warning' };

/* ── Modal QR del ticket ── */
function TicketModal({ ticket, employee, open, onClose }) {
  const qrPayload = JSON.stringify({ ticketId: ticket.id, employeeId: employee.id });
  const isAlmuerzo = ticket.type === 'ALMUERZO';

  const copyPayload = () => {
    navigator.clipboard.writeText(qrPayload);
    toast.success('Código QR copiado al portapapeles');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <div className="text-xs uppercase tracking-widest text-[#64748B] mb-1">Ticket Digital Casino</div>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            {isAlmuerzo ? <><Utensils size={18} className="text-[#F59E0B]" /> ALMUERZO</> : <><Coffee size={18} className="text-amber-400" /> MERIENDA</>}
          </DialogTitle>
          <div className="flex justify-center pt-1">
            <Badge variant={STATUS_VARIANT[ticket.status]}>● {ticket.status}</Badge>
          </div>
        </DialogHeader>

        {/* QR */}
        <div className="flex justify-center">
          <div className="rounded-2xl bg-white p-4 shadow-2xl">
            <QRCodeView value={qrPayload} size={200} />
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl bg-[#161B27] p-4 text-left text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-[#64748B]">Empleado:</span>
            <strong className="text-[#F1F5F9]">{employee.name}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">Documento:</span>
            <span className="font-mono text-xs">{employee.document}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#64748B]">Vence:</span>
            <span>{new Date(ticket.expiresAt).toLocaleDateString('es-CO')}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-center">
          <Button variant="secondary" size="sm" onClick={copyPayload}>
            <Copy size={13} /> Copiar QR
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer size={13} /> Imprimir
          </Button>
          <Button size="sm" onClick={onClose}>Listo</Button>
        </div>
      </DialogContent>
    </Dialog>
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
      toast.error(err.message);
      navigate('/employees');
    }
  };

  useEffect(() => {
    let ignore = false;
    const fetchEmp = async () => {
      try {
        const data = await api.getEmployee(id);
        if (!ignore) setEmployee(data);
      } catch (err) {
        if (!ignore) { toast.error(err.message); navigate('/employees'); }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchEmp();
    return () => { ignore = true; };
  }, [id, navigate]);

  const generate = async (type) => {
    setGenerating(true);
    try {
      const res = await api.generateForEmployee({ employeeId: id, type });
      toast.success(res.message);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-[#64748B]">
        <Loader2 size={18} className="spin" /> Cargando...
      </div>
    );
  }
  if (!employee) return null;

  const activos = employee.tickets.filter((t) => t.status === 'ACTIVO');
  const usados = employee.tickets.filter((t) => t.status === 'USADO');
  const vencidos = employee.tickets.filter((t) => t.status === 'VENCIDO');
  const displayed = tab === 'activos' ? activos : tab === 'usados' ? usados : vencidos;

  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="secondary" size="sm" onClick={() => navigate('/employees')}>
        <ArrowLeft size={13} /> Volver
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#F1F5F9]">{employee.name}</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-[#64748B]">
            Doc: {employee.document}
            <Badge variant={employee.active ? 'success' : 'danger'}>
              {employee.active ? '● Activo' : '● Inactivo'}
            </Badge>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => generate('ALMUERZO')} disabled={generating}>
            <Utensils size={13} /> Generar almuerzos
          </Button>
          <Button variant="secondary" size="sm" onClick={() => generate('MERIENDA')} disabled={generating}>
            <Coffee size={13} /> Generar meriendas
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Activos', value: activos.length, variant: 'success' },
          { label: 'Usados', value: usados.length, variant: 'warning' },
          { label: 'Vencidos', value: vencidos.length, variant: 'danger' },
        ].map(({ label, value, variant }) => (
          <Card key={label} className="text-center py-4">
            <p className="text-xs text-[#64748B]">{label}</p>
            <p className="text-3xl font-bold text-[#F1F5F9] mt-1">{value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs + Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/[0.07]">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="activos">Activos ({activos.length})</TabsTrigger>
              <TabsTrigger value="usados">Historial ({usados.length})</TabsTrigger>
              <TabsTrigger value="vencidos">Vencidos ({vencidos.length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-[#64748B]">
            <Ticket size={32} strokeWidth={1.5} />
            <p className="text-sm">Sin tickets en esta categoría</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] text-xs text-[#64748B] uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-medium">ID</th>
                  <th className="px-5 py-3 text-left font-medium">Tipo</th>
                  <th className="px-5 py-3 text-left font-medium">Estado</th>
                  <th className="px-5 py-3 text-left font-medium">{tab === 'usados' ? 'Usado el' : 'Vence el'}</th>
                  <th className="px-5 py-3 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {displayed.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-[#475569]">{t.id.slice(0, 12)}…</td>
                    <td className="px-5 py-3"><Badge variant={TYPE_VARIANT[t.type]}>{t.type}</Badge></td>
                    <td className="px-5 py-3"><Badge variant={STATUS_VARIANT[t.status]}>{t.status}</Badge></td>
                    <td className="px-5 py-3 text-xs text-[#64748B]">
                      {tab === 'usados' && t.usedAt
                        ? new Date(t.usedAt).toLocaleString('es-CO')
                        : new Date(t.expiresAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {t.status === 'ACTIVO' ? (
                        <Button size="sm" onClick={() => setSelectedTicket(t)}>
                          <QrCode size={12} /> Ver QR
                        </Button>
                      ) : (
                        <span className="text-xs text-[#475569]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedTicket && (
        <TicketModal
          open={!!selectedTicket}
          ticket={selectedTicket}
          employee={employee}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
