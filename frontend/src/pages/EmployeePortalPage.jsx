import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, LogOut, Utensils, Coffee, QrCode, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import QRCodeView from '../components/QRCodeView';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Dialog, DialogContent } from '../components/ui/dialog';

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
      if (!stored) { navigate('/login'); return null; }
      const emp = JSON.parse(stored);
      setEmployee(emp);

      const [tickets, sum] = await Promise.all([api.getActive(emp.id), api.getMySummary()]);
      const activeList = tickets || [];
      setActiveTickets(activeList);
      setSummary(sum);
      return { tickets: activeList, summary: sum };
    } catch (err) {
      toast.error(err.message);
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
        if (!stored) { navigate('/login'); return; }
        const emp = JSON.parse(stored);
        if (!ignore) setEmployee(emp);

        const [tickets, sum] = await Promise.all([api.getActive(emp.id), api.getMySummary()]);
        if (!ignore) {
          setActiveTickets(tickets || []);
          setSummary(sum);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) { toast.error(err.message); setLoading(false); }
      }
    };
    fetchInitial();
    return () => { ignore = true; };
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
          toast.success(`¡Ticket de ${typeName} canjeado con éxito!`);
        }
      }
    }
  };

  const showTicketQR = (type) => {
    const ticket = activeTickets.find((t) => t.type === type);
    if (!ticket) { toast.error(`No tienes tickets activos de ${type} en este periodo`); return; }
    setSelectedTicket(ticket);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-[#090B10] text-[#64748B]">
        <Loader2 size={20} className="spin" /> Cargando tus tickets...
      </div>
    );
  }

  const almuerzos = activeTickets.filter((t) => t.type === 'ALMUERZO');
  const meriendas = activeTickets.filter((t) => t.type === 'MERIENDA');

  return (
    <div className="min-h-screen bg-[#090B10] p-4 pb-8">
      <div className="mx-auto max-w-sm space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <img src="/logo.png" alt="TicketCasino" className="h-7 w-7 rounded-md object-cover" />
              <span className="text-base font-bold">
                <span className="text-[#F1F5F9]">Ticket</span>
                <span className="text-[#D97706]">Casino</span>
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-[#F1F5F9]">¡Hola, {employee?.name?.split(' ')[0]}!</h2>
            <p className="text-xs text-[#64748B]">@{employee?.username} · C.C. {employee?.document}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" onClick={() => loadData(false)} title="Actualizar">
              <RefreshCw size={14} />
            </Button>
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              <LogOut size={14} /> Salir
            </Button>
          </div>
        </div>

        {/* Section label */}
        <p className="text-xs font-semibold uppercase tracking-widest text-[#475569]">
          Tus Tickets Disponibles (Periodo Actual)
        </p>

        {/* Ticket cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Almuerzo */}
          <Card className={`text-center ${almuerzos.length > 0 ? 'border-[#F59E0B]/30 bg-[#F59E0B]/5' : ''}`}>
            <div className="flex justify-center mb-2">
              <Utensils size={26} className="text-[#F59E0B]" />
            </div>
            <p className="text-xs font-semibold text-[#64748B]">ALMUERZOS</p>
            <p className="text-3xl font-black text-[#F59E0B] my-1">{almuerzos.length}</p>
            <Button
              className="w-full mt-2" size="sm"
              disabled={almuerzos.length === 0}
              onClick={() => showTicketQR('ALMUERZO')}
            >
              <QrCode size={13} /> Mostrar QR
            </Button>
          </Card>

          {/* Merienda */}
          <Card className={`text-center ${meriendas.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
            <div className="flex justify-center mb-2">
              <Coffee size={26} className="text-amber-400" />
            </div>
            <p className="text-xs font-semibold text-[#64748B]">MERIENDAS</p>
            <p className="text-3xl font-black text-amber-400 my-1">{meriendas.length}</p>
            <Button
              variant="secondary" className="w-full mt-2" size="sm"
              disabled={meriendas.length === 0}
              onClick={() => showTicketQR('MERIENDA')}
            >
              <QrCode size={13} /> Mostrar QR
            </Button>
          </Card>
        </div>

        {/* Historial reciente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={14} className="text-[#64748B]" /> Tus últimos consumos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.historialReciente?.length === 0 ? (
              <p className="py-4 text-center text-sm text-[#475569]">Aún no has registrado consumos en este periodo.</p>
            ) : (
              <div className="space-y-2">
                {summary?.historialReciente?.slice(0, 5).map((item) => (
                  <div key={item.id}
                    className="flex items-center justify-between rounded-lg bg-[#161B27] px-3 py-2.5 text-sm">
                    <div className="flex items-center gap-2.5">
                      {item.type === 'ALMUERZO' ? <Utensils size={13} className="text-[#64748B]" /> : <Coffee size={13} className="text-[#64748B]" />}
                      <strong className="text-[#F1F5F9]">{item.type}</strong>
                    </div>
                    <span className="text-xs text-[#475569]">
                      {item.usedAt ? new Date(item.usedAt).toLocaleString('es-CO') : 'Usado'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal QR */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={(v) => !v && handleCloseModal()}>
          <DialogContent className="max-w-xs text-center">
            <p className="text-xs uppercase tracking-widest text-[#64748B]">Preséntalo en el comedor</p>
            <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-[#F1F5F9]">
              {selectedTicket.type === 'ALMUERZO'
                ? <><Utensils size={17} className="text-[#F59E0B]" /> Ticket de Almuerzo</>
                : <><Coffee size={17} className="text-amber-400" /> Ticket de Merienda</>}
            </h3>

            <div className="flex justify-center">
              <div className="rounded-2xl bg-white p-4 shadow-2xl">
                <QRCodeView
                  value={JSON.stringify({ ticketId: selectedTicket.id, employeeId: employee.id })}
                  size={200}
                />
              </div>
            </div>

            <div className="text-xs text-[#64748B]">
              <p>Acerca este código al lector del casino</p>
              <p className="mt-1 font-mono text-[10px] text-[#475569]">ID: {selectedTicket.id.slice(0, 14)}…</p>
            </div>

            <Button className="w-full" onClick={handleCloseModal}>Listo / Cerrar</Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
