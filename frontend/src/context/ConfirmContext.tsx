import { useEffect, useState } from 'react';

type Confirmation = { id: number; message: string; confirmLabel: string };
const confirmEvent = 'defensedesk:confirm';
const pendingConfirmations = new Map<number, (confirmed: boolean) => void>();

export function confirmAction(message: string, confirmLabel = 'Delete') {
  return new Promise<boolean>((resolve) => {
    const id = Date.now() + Math.random();
    pendingConfirmations.set(id, resolve);
    window.dispatchEvent(new CustomEvent<Confirmation>(confirmEvent, {
      detail: { id, message, confirmLabel },
    }));
  });
}

export function ConfirmHost() {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    const showConfirmation = (event: Event) => setConfirmation((event as CustomEvent<Confirmation>).detail);
    window.addEventListener(confirmEvent, showConfirmation);
    return () => window.removeEventListener(confirmEvent, showConfirmation);
  }, []);

  const finish = (confirmed: boolean) => {
    if (!confirmation) return;
    pendingConfirmations.get(confirmation.id)?.(confirmed);
    pendingConfirmations.delete(confirmation.id);
    setConfirmation(null);
  };

  useEffect(() => {
    if (!confirmation) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') finish(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [confirmation]);

  if (!confirmation) return null;
  return <div className="confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) finish(false); }}>
    <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <span className="confirm-icon" aria-hidden="true">!</span>
      <h2 id="confirm-title">Are you sure?</h2>
      <p id="confirm-message">{confirmation.message}</p>
      <div className="confirm-actions">
        <button type="button" className="button button-quiet" autoFocus onClick={() => finish(false)}>Cancel</button>
        <button type="button" className="button confirm-delete" onClick={() => finish(true)}>{confirmation.confirmLabel}</button>
      </div>
    </section>
  </div>;
}
