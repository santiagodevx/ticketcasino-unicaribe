import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRCodeView({ value, size = 220 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', margin: '0 auto', borderRadius: 8, maxWidth: '100%' }}
    />
  );
}
