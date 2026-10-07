import { useEffect, useState } from 'react';

type ToastKind = 'success' | 'error' | 'info';
type ToastMessage = { id: number; message: string; kind: ToastKind };
const toastEvent = 'defensedesk:toast';

export function notify(message: string, kind: ToastKind = 'success') {
  window.dispatchEvent(new CustomEvent<ToastMessage>(toastEvent, {
    detail: { id: Date.now() + Math.random(), message, kind },
  }));
}

export function ToastHost() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    const showToast = (event: Event) => setToast((event as CustomEvent<ToastMessage>).detail);
    window.addEventListener(toastEvent, showToast);
    return () => window.removeEventListener(toastEvent, showToast);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  if (!toast) return null;
  return <div className={`toast-popup toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
    <span className="toast-icon" aria-hidden="true">{toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '!' : 'i'}</span>
    <span className="toast-message">{toast.message}</span>
    <button type="button" className="toast-dismiss" onClick={() => setToast(null)} aria-label="Dismiss notification">×</button>
  </div>;
}
