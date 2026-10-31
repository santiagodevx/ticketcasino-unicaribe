/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from 'react';

let addToast;

export function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToast = (msg, type = 'ok') => {
      const id = Date.now();
      setToasts((t) => [...t, { id, msg, type }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
    };
  }, []);

  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  );
}

export const toast = {
  ok: (msg) => addToast?.(msg, 'ok'),
  err: (msg) => addToast?.(msg, 'err'),
};

