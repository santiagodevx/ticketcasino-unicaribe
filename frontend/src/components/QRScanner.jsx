import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import { Camera, CameraOff, CheckCircle2, RefreshCw, X, ScanLine } from 'lucide-react';

/**
 * QRScanner
 * Abre la cámara y decodifica QR en tiempo real.
 *
 * Props:
 *   onScan(text)        — texto decodificado
 *   onClose()           — cierra el escáner
 *   successTicket       — si existe, muestra la pantalla de éxito sobre el visor
 *   countdown           — segundos restantes para autoreinicio
 *   ScanSuccess         — componente de éxito inyectado desde el padre
 */
export default function QRScanner({ onScan, onClose, successTicket, countdown, ScanSuccess }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [activeCamIdx, setActiveCamIdx] = useState(0);
  const [ready, setReady] = useState(false); // cámara iniciada

  // Inicializar lector y enumerar cámaras
  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        if (!devices || devices.length === 0) {
          setError('No se encontró ninguna cámara disponible.');
          return;
        }
        // Prefiere cámara trasera
        const sorted = [...devices].sort((a, b) => {
          const aBack = /back|rear|trasera|environment/i.test(a.label);
          const bBack = /back|rear|trasera|environment/i.test(b.label);
          return bBack - aBack;
        });
        setCameras(sorted);
      })
      .catch(() => {
        setError('No se pudo acceder a la cámara. Comprueba los permisos del navegador.');
      });

    return () => {
      if (readerRef.current) {
        try { readerRef.current.reset(); } catch { /* noop */ }
      }
    };
  }, []);

  // Arrancar / cambiar cámara activa (solo si no hay éxito mostrado)
  useEffect(() => {
    if (!cameras.length || !videoRef.current || successTicket) return;

    const codeReader = readerRef.current;
    const deviceId = cameras[activeCamIdx]?.deviceId;
    let stopped = false;

    codeReader
      .decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
        if (stopped || successTicket) return;
        if (result) {
          stopped = true;
          try { codeReader.reset(); } catch { /* noop */ }
          onScan(result.getText());
        } else if (err && !(err instanceof NotFoundException)) {
          console.warn('QR scan error:', err);
        }
      })
      .then(() => { if (!stopped) setReady(true); })
      .catch((err) => {
        if (stopped) return;
        setError(
          err?.message?.includes('Permission')
            ? 'Permiso de cámara denegado. Habilítalo en el navegador e intenta de nuevo.'
            : `Error al iniciar la cámara: ${err?.message ?? err}`
        );
      });

    return () => {
      stopped = true;
      try { codeReader.reset(); } catch { /* noop */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameras, activeCamIdx, onScan]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && !successTicket) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, successTicket]);

  const switchCamera = () => setActiveCamIdx((i) => (i + 1) % cameras.length);

  return (
    <div
      className="scanner-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Escáner de código QR"
    >
      <div className="scanner-box">
        {/* Header */}
        <div className="scanner-header">
          <div>
            <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              {successTicket ? (
                <><CheckCircle2 size={18} color="#10B981" /> ¡Ticket escaneado!</>
              ) : (
                <><Camera size={18} /> Escanear Ticket QR</>
              )}
            </h3>
            <p>
              {successTicket
                ? 'Listo para el siguiente ticket'
                : 'Apunta la cámara al código QR del empleado'}
            </p>
          </div>
          {!successTicket && (
            <button
              type="button"
              className="btn btn-secondary btn-sm scanner-close"
              onClick={onClose}
              aria-label="Cerrar escáner"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Visor */}
        <div className="scanner-viewport">
          {error ? (
            <div className="scanner-error">
              <CameraOff size={38} color="var(--text-muted)" style={{ marginBottom: 8 }} />
              <p>{error}</p>
              <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={onClose}>
                Cerrar
              </button>
            </div>
          ) : (
            <>
              {/* Video siempre renderizado (oculto durante el éxito) */}
              <video
                ref={videoRef}
                className="scanner-video"
                style={{ opacity: successTicket ? 0 : 1 }}
                autoPlay
                playsInline
                muted
              />

              {/* Marco guía — solo mientras escanea */}
              {!successTicket && ready && (
                <>
                  <div className="scanner-frame">
                    <div className="scanner-corner tl" />
                    <div className="scanner-corner tr" />
                    <div className="scanner-corner bl" />
                    <div className="scanner-corner br" />
                    <div className="scanner-line" />
                  </div>
                  <div className="scanner-hint">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <ScanLine size={15} /> Apunta al QR del ticket
                    </span>
                  </div>
                </>
              )}

              {/* Pantalla de éxito superpuesta */}
              {successTicket && ScanSuccess && (
                <ScanSuccess ticket={successTicket} countdown={countdown} />
              )}
            </>
          )}
        </div>

        {/* Controles */}
        {!error && !successTicket && cameras.length > 1 && (
          <div className="scanner-controls">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={switchCamera}
              title="Cambiar cámara"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} /> Cambiar cámara ({activeCamIdx + 1}/{cameras.length})
            </button>
          </div>
        )}

        {!error && !successTicket && cameras.length === 0 && (
          <div className="scanner-loading">
            <span>Accediendo a la cámara...</span>
          </div>
        )}
      </div>
    </div>
  );
}
