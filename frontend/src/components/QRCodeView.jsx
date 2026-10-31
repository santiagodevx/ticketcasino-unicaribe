import { useEffect, useRef } from 'react';
import { createQrMatrix } from '../utils/qrcode';

export default function QRCodeView({ value, size = 220 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    try {
      const qr = createQrMatrix(value);
      const moduleCount = qr.getModuleCount();
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const margin = 2; // módulos de margen
      const totalModules = moduleCount + margin * 2;
      const cellSize = Math.floor(size / totalModules);
      const realSize = cellSize * totalModules;

      canvas.width = realSize;
      canvas.height = realSize;

      // Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, realSize, realSize);

      // Módulos oscuros
      ctx.fillStyle = '#000000';
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(
              (c + margin) * cellSize,
              (r + margin) * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      }
    } catch (err) {
      console.error('Error generando QR local:', err);
    }
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        margin: '0 auto',
        borderRadius: 8,
        maxWidth: '100%',
        height: 'auto',
      }}
    />
  );
}

