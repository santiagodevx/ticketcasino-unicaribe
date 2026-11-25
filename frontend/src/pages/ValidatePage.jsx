import { useState, useCallback, useRef } from "react";
import {
  CheckCircle2,
  XCircle,
  Camera,
  Keyboard,
  ArrowLeft,
  Loader2,
  Utensils,
  Coffee,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../api";
import QRScanner from "../components/QRScanner";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";

const TYPE_LABEL = { ALMUERZO: "Almuerzo", MERIENDA: "Merienda" };

/** Pantalla de éxito que se muestra sobre el escáner antes de autoreiniciarse */
function ScanSuccess({ ticket, countdown }) {
  const isAlmuerzo = ticket.type === "ALMUERZO";
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/80 backdrop-blur-sm">
      <div className="space-y-3 p-6 text-center">
        <CheckCircle2 size={56} className="mx-auto text-emerald-400" />
        <h3 className="text-xl font-bold text-white">¡Ticket válido!</h3>
        <p className="flex items-center justify-center gap-2 text-sm font-medium text-text">
          {isAlmuerzo ? <Utensils size={15} /> : <Coffee size={15} />}
          {TYPE_LABEL[ticket.type] ?? ticket.type}
        </p>
        <p className="text-base font-semibold text-white">
          {ticket.employee?.name}
        </p>
        <p className="text-xs text-text">C.C. {ticket.employee?.document}</p>
        <p className="text-xs font-medium text-emerald-400">
          Listo para escanear en {countdown}s…
        </p>
      </div>
    </div>
  );
}

export default function ValidatePage() {
  const [scanning, setScanning] = useState(false);
  const [successTicket, setSuccessTicket] = useState(null); // éxito dentro del scanner
  const [countdown, setCountdown] = useState(3);
  const [errorResult, setErrorResult] = useState(null); // sólo errores (permanentes)
  const [loading, setLoading] = useState(false);
  const countdownRef = useRef(null);

  // Modo manual (backup)
  const [manualMode, setManualMode] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  /* ── Autoreinicio después del éxito ── */
  const startCountdown = useCallback((ticket) => {
    setSuccessTicket(ticket);
    setCountdown(3);
    let secs = 3;
    countdownRef.current = setInterval(() => {
      secs -= 1;
      setCountdown(secs);
      if (secs <= 0) {
        clearInterval(countdownRef.current);
        setSuccessTicket(null);
        setScanning(false); // vuelve al botón principal
      }
    }, 1000);
  }, []);

  /* ── Validar desde QR escaneado ── */
  const handleScan = useCallback(
    async (rawText) => {
      setLoading(true);
      setErrorResult(null);
      try {
        let payload;
        try {
          payload = JSON.parse(rawText);
        } catch {
          throw new Error(
            "QR inválido: el código no corresponde a un ticket de TicketCasino",
          );
        }

        const { ticketId: tId, employeeId: eId } = payload;
        if (!tId || !eId)
          throw new Error("QR inválido: faltan datos en el código escaneado");

        const data = await api.validateTicket({
          ticketId: tId,
          employeeId: eId,
        });
        toast.success(
          `${TYPE_LABEL[data.ticket.type]} — ${data.ticket.employee?.name}`,
        );
        startCountdown(data.ticket);
      } catch (err) {
        setScanning(false);
        setErrorResult(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    },
    [startCountdown],
  );

  /* ── Validar manual ── */
  const handleManual = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorResult(null);
    try {
      const data = await api.validateTicket({
        ticketId: ticketId.trim(),
        employeeId: employeeId.trim(),
      });
      toast.success(
        `${TYPE_LABEL[data.ticket.type]} — ${data.ticket.employee?.name}`,
      );
      setTicketId("");
      setEmployeeId("");
      startCountdown(data.ticket);
    } catch (err) {
      setErrorResult(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    clearInterval(countdownRef.current);
    setSuccessTicket(null);
    setErrorResult(null);
    setTicketId("");
    setEmployeeId("");
    setManualMode(false);
    setScanning(false);
  };

  const showMain = !manualMode && !errorResult && !successTicket;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text">Validar Ticket</h2>
        <p className="text-sm text-muted">
          Escanea el código QR del empleado para marcar su ticket como usado
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-4">
        {/* ── Éxito (sin escáner abierto) ── */}
        {successTicket && !scanning && (
          <Card className="border-emerald-500/20 bg-emerald-500/5 py-8 text-center">
            <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-400" />
            <h3 className="text-lg font-bold text-text">¡Ticket consumido!</h3>
            <p className="mt-2 text-sm font-semibold text-text">
              {TYPE_LABEL[successTicket.type] ?? successTicket.type}
            </p>
            <p className="mt-1 text-sm text-text">
              Empleado: <strong>{successTicket.employee?.name}</strong>
            </p>
            <p className="mt-1 text-xs text-muted">
              C.C. {successTicket.employee?.document} ·{" "}
              {new Date(successTicket.usedAt).toLocaleTimeString("es-CO")}
            </p>
            <p className="mt-4 text-sm font-medium text-emerald-400">
              Listo para escanear en <strong>{countdown}s</strong>…
            </p>
          </Card>
        )}

        {/* ── Error ── */}
        {errorResult && (
          <Card className="border-red-500/20 bg-red-500/5 py-8 text-center">
            <XCircle size={48} className="mx-auto mb-3 text-red-400" />
            <h3 className="text-lg font-bold text-text">Ticket inválido</h3>
            <p className="mt-2 text-sm text-text">{errorResult}</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button
                onClick={() => {
                  setErrorResult(null);
                  setScanning(true);
                }}
              >
                <Camera size={14} /> Intentar de nuevo
              </Button>
              <Button variant="secondary" onClick={reset}>
                Cerrar
              </Button>
            </div>
          </Card>
        )}

        {/* ── Botón principal de escaneo ── */}
        {showMain && !loading && (
          <button
            type="button"
            onClick={() => setScanning(true)}
            className="group w-full rounded-2xl border-2 border-dashed border-white/10 bg-surface p-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <Camera
              size={44}
              strokeWidth={1.5}
              className="mx-auto mb-4 text-muted transition-colors group-hover:text-primary"
            />
            <p className="text-sm font-semibold text-text">
              Presiona para escanear un ticket
            </p>
            <p className="mt-1.5 text-xs text-muted">
              Se abrirá la cámara para leer el código QR del empleado
            </p>
          </button>
        )}

        {/* Procesando... */}
        {loading && !scanning && (
          <div className="flex items-center justify-center gap-3 py-12 text-muted">
            <Loader2 size={18} className="spin" /> Procesando ticket...
          </div>
        )}

        {/* ── Toggle modo manual ── */}
        {!errorResult && !successTicket && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setManualMode((m) => !m)}
              className="inline-flex items-center gap-1.5 text-xs text-[#475569] transition-colors hover:text-text"
            >
              {manualMode ? (
                <>
                  <ArrowLeft size={13} /> Volver al escáner
                </>
              ) : (
                <>
                  <Keyboard size={13} /> Ingresar ID manualmente
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Formulario manual ── */}
        {manualMode && !errorResult && !successTicket && (
          <Card>
            <form onSubmit={handleManual} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium tracking-wide text-text uppercase">
                  ID del Ticket (código QR)
                </label>
                <Input
                  autoFocus
                  placeholder="Pega el ID del ticket..."
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium tracking-wide text-text uppercase">
                  ID del Empleado
                </label>
                <Input
                  placeholder="ID del empleado..."
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !ticketId || !employeeId}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="spin" /> Validando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Validar ticket
                  </>
                )}
              </Button>
            </form>
          </Card>
        )}
      </div>

      {/* ── Modal del escáner de cámara ── */}
      {scanning && (
        <QRScanner
          onScan={handleScan}
          onClose={() => {
            clearInterval(countdownRef.current);
            setScanning(false);
            setSuccessTicket(null);
          }}
          successTicket={successTicket}
          countdown={countdown}
          ScanSuccess={ScanSuccess}
        />
      )}
    </div>
  );
}
