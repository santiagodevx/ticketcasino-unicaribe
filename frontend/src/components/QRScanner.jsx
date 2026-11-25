import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  RefreshCw,
  X,
  ScanLine,
} from "lucide-react";
import { Button } from "./ui/button";

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
export default function QRScanner({
  onScan,
  onClose,
  successTicket,
  countdown,
  ScanSuccess,
}) {
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
          setError("No se encontró ninguna cámara disponible.");
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
        setError(
          "No se pudo acceder a la cámara. Comprueba los permisos del navegador.",
        );
      });

    return () => {
      if (readerRef.current) {
        try {
          readerRef.current.reset();
        } catch {
          /* noop */
        }
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
          try {
            codeReader.reset();
          } catch {
            /* noop */
          }
          onScan(result.getText());
        } else if (err && !(err instanceof NotFoundException)) {
          console.warn("QR scan error:", err);
        }
      })
      .then(() => {
        if (!stopped) setReady(true);
      })
      .catch((err) => {
        if (stopped) return;
        setError(
          err?.message?.includes("Permission")
            ? "Permiso de cámara denegado. Habilítalo en el navegador e intenta de nuevo."
            : `Error al iniciar la cámara: ${err?.message ?? err}`,
        );
      });

    return () => {
      stopped = true;
      try {
        codeReader.reset();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameras, activeCamIdx, onScan]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && !successTicket) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, successTicket]);

  const switchCamera = () => setActiveCamIdx((i) => (i + 1) % cameras.length);

  return (
    /* Overlay a pantalla completa */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Escáner de código QR"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-text">
              {successTicket ? (
                <>
                  <CheckCircle2 size={17} className="text-emerald-400" />{" "}
                  ¡Ticket escaneado!
                </>
              ) : (
                <>
                  <Camera size={17} className="text-primary" /> Escanear Ticket
                  QR
                </>
              )}
            </h3>
            <p className="mt-0.5 text-xs text-muted">
              {successTicket
                ? "Listo para el siguiente ticket"
                : "Apunta la cámara al código QR del empleado"}
            </p>
          </div>
          {!successTicket && (
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-text"
              onClick={onClose}
              aria-label="Cerrar escáner"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Visor */}
        <div className="relative bg-black" style={{ aspectRatio: "4/3" }}>
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <CameraOff size={38} className="text-muted" />
              <p className="text-sm text-[#94A3B8]">{error}</p>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          ) : (
            <>
              {/* Video siempre renderizado (oculto durante el éxito) */}
              <video
                ref={videoRef}
                className="absolute inset-0 size-full  object-cover"
                style={{ opacity: successTicket ? 0 : 1 }}
                autoPlay
                playsInline
                muted
              />

              {/* Marco guía — solo mientras escanea */}
              {!successTicket && ready && (
                <>
                  {/* Frame corners */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div
                      className="relative"
                      style={{ width: "60%", aspectRatio: "1" }}
                    >
                      {/* Esquinas */}
                      <div className="absolute top-0 left-0 size-6  rounded-tl-sm border-t-2 border-l-2 border-primary" />
                      <div className="absolute top-0 right-0 size-6  rounded-tr-sm border-t-2 border-r-2 border-primary" />
                      <div className="absolute bottom-0 left-0 size-6  rounded-bl-sm border-b-2 border-l-2 border-primary" />
                      <div className="absolute right-0 bottom-0 size-6  rounded-br-sm border-r-2 border-b-2 border-primary" />
                      {/* Línea de escaneo animada */}
                      <div
                        className="absolute inset-x-1  h-0.5 bg-primary/70"
                        style={{
                          animation: "tc-scan 2s ease-in-out infinite",
                          top: "50%",
                        }}
                      />
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-3  flex justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs text-[#94A3B8] backdrop-blur-sm">
                      <ScanLine size={13} /> Apunta al QR del ticket
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
          <div className="flex justify-center border-t border-white/[0.07] px-5 py-3">
            <Button variant="secondary" size="sm" onClick={switchCamera}>
              <RefreshCw size={13} /> Cambiar cámara ({activeCamIdx + 1}/
              {cameras.length})
            </Button>
          </div>
        )}

        {!error && !successTicket && cameras.length === 0 && (
          <div className="flex items-center justify-center gap-2 border-t border-white/[0.07] px-5 py-3 text-xs text-muted">
            <span className="spin inline-block">⏳</span> Accediendo a la
            cámara...
          </div>
        )}
      </div>
    </div>
  );
}
