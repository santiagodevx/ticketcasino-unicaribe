import { useState, useCallback, useRef } from 'react';
import { api } from '../api';
import { toast } from '../components/Toast';
import QRScanner from '../components/QRScanner';

const TYPE_LABEL = { ALMUERZO: '🍽 Almuerzo', MERIENDA: '🥪 Merienda' };

/** Pantalla de éxito que se muestra sobre el escáner antes de autoreiniciarse */
function ScanSuccess({ ticket, countdown }) {
  return (
    <div className="scanner-success-overlay">
      <div className="scanner-success-box">
        <div className="scanner-success-icon">✅</div>
        <h3>¡Ticket válido!</h3>
        <p className="scanner-success-type">
          {TYPE_LABEL[ticket.type] ?? ticket.type}
        </p>
        <p className="scanner-success-name">{ticket.employee?.name}</p>
        <p className="scanner-success-doc">C.C. {ticket.employee?.document}</p>
        <div className="scanner-success-countdown">
          Listo para escanear en {countdown}s…
        </div>
      </div>
    </div>
  );
}

export default function ValidatePage() {
  const [scanning, setScanning] = useState(false);
  const [successTicket, setSuccessTicket] = useState(null); // éxito dentro del scanner
  const [countdown, setCountdown] = useState(3);
  const [errorResult, setErrorResult] = useState(null);     // sólo errores (permanentes)
  const [loading, setLoading] = useState(false);
  const countdownRef = useRef(null);

  // Modo manual (backup)
  const [manualMode, setManualMode] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

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
  const handleScan = useCallback(async (rawText) => {
    setLoading(true);
    setErrorResult(null);

    try {
      let payload;
      try {
        payload = JSON.parse(rawText);
      } catch {
        throw new Error('QR inválido: el código no corresponde a un ticket de TicketCasino');
      }

      const { ticketId: tId, employeeId: eId } = payload;
      if (!tId || !eId) {
        throw new Error('QR inválido: faltan datos en el código escaneado');
      }

      const data = await api.validateTicket({ ticketId: tId, employeeId: eId });
      toast.ok(`✅ ${TYPE_LABEL[data.ticket.type]} — ${data.ticket.employee?.name}`);
      startCountdown(data.ticket);
    } catch (err) {
      // Error: cerrar el escáner y mostrar el error en la página
      setScanning(false);
      setErrorResult(err.message);
      toast.err(err.message);
    } finally {
      setLoading(false);
    }
  }, [startCountdown]);

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
      toast.ok(`✅ ${TYPE_LABEL[data.ticket.type]} — ${data.ticket.employee?.name}`);
      setTicketId('');
      setEmployeeId('');
      startCountdown(data.ticket);
    } catch (err) {
      setErrorResult(err.message);
      toast.err(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    clearInterval(countdownRef.current);
    setSuccessTicket(null);
    setErrorResult(null);
    setTicketId('');
    setEmployeeId('');
    setManualMode(false);
    setScanning(false);
  };

  const showMain = !manualMode && !errorResult && !successTicket;

  return (
    <div className="validate-page">
      <div className="page-header">
        <h2>Validar Ticket</h2>
        <p>Escanea el código QR del empleado para marcar su ticket como usado</p>
      </div>

      <div className="validate-box">

        {/* ── Éxito (sin escáner abierto) ── */}
        {successTicket && !scanning && (
          <div className="validate-result ok validate-success-inline">
            <div className="icon">✅</div>
            <h3>¡Ticket consumido!</h3>
            <p style={{ marginTop: 8, fontSize: 15 }}>
              <strong>{TYPE_LABEL[successTicket.type] ?? successTicket.type}</strong>
            </p>
            <p style={{ marginTop: 6 }}>
              Empleado: <strong>{successTicket.employee?.name}</strong>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
              C.C. {successTicket.employee?.document}
              &nbsp;·&nbsp;
              {new Date(successTicket.usedAt).toLocaleTimeString('es-CO')}
            </p>
            <div className="validate-countdown">
              Listo para escanear en <strong>{countdown}s</strong>…
            </div>
          </div>
        )}

        {/* ── Error (permanente hasta que el admin lo descarte) ── */}
        {errorResult && (
          <div className="validate-result err">
            <div className="icon">❌</div>
            <h3>Ticket inválido</h3>
            <p>{errorResult}</p>
            <div className="validate-result-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => { setErrorResult(null); setScanning(true); }}
              >
                📷 Intentar de nuevo
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={reset}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* ── Botón principal de escaneo ── */}
        {showMain && !loading && (
          <button
            type="button"
            className="scan-trigger-btn"
            onClick={() => setScanning(true)}
          >
            <span className="scan-trigger-icon">📷</span>
            <span className="scan-trigger-label">Presiona para escanear un ticket</span>
            <span className="scan-trigger-sub">
              Se abrirá la cámara para leer el código QR del empleado
            </span>
          </button>
        )}

        {/* Procesando... */}
        {loading && !scanning && (
          <div className="loading">⏳ Procesando ticket...</div>
        )}

        {/* ── Toggle modo manual ── */}
        {!errorResult && !successTicket && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              className="btn-text"
              onClick={() => setManualMode((m) => !m)}
            >
              {manualMode ? '← Volver al escáner' : '⌨️ Ingresar ID manualmente'}
            </button>
          </div>
        )}

        {/* ── Formulario manual (backup) ── */}
        {manualMode && !errorResult && !successTicket && (
          <div className="card" style={{ marginTop: 16 }}>
            <form onSubmit={handleManual}>
              <div className="form-group">
                <label>ID del Ticket (código QR)</label>
                <input
                  autoFocus
                  placeholder="Pega el ID del ticket..."
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>ID del Empleado</label>
                <input
                  placeholder="ID del empleado..."
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>
              <div className="flex-gap validate-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !ticketId || !employeeId}
                >
                  {loading ? '⏳ Validando...' : '✅ Validar ticket'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ── Modal del escáner de cámara ── */}
      {scanning && (
        <QRScanner
          onScan={handleScan}
          onClose={() => { clearInterval(countdownRef.current); setScanning(false); setSuccessTicket(null); }}
          successTicket={successTicket}
          countdown={countdown}
          ScanSuccess={ScanSuccess}
        />
      )}
    </div>
  );
}
