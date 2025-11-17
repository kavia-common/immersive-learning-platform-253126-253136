import React, { createContext, useContext, useMemo, useState } from 'react';

export const UIContext = createContext({
  toasts: [],
  modals: [],
  // PUBLIC_INTERFACE
  addToast: () => {},
  // PUBLIC_INTERFACE
  removeToast: () => {},
  // PUBLIC_INTERFACE
  openModal: () => {},
  // PUBLIC_INTERFACE
  closeModal: () => {},
});

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [modals, setModals] = useState([]);

  const addToast = (toast) => setToasts((t) => [...t, { id: crypto.randomUUID(), ...toast }]);
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const openModal = (modal) => setModals((m) => [...m, { id: crypto.randomUUID(), ...modal }]);
  const closeModal = (id) => setModals((m) => m.filter((x) => x.id !== id));

  const value = useMemo(
    () => ({ toasts, modals, addToast, removeToast, openModal, closeModal }),
    [toasts, modals]
  );

  return (
    <UIContext.Provider value={value}>
      {children}
      {/* Placeholder render areas */}
      <div aria-live="polite" aria-atomic="true" style={{ position: 'fixed', right: 16, bottom: 16 }}>
        {toasts.map((t) => (
          <div key={t.id} className="card" style={{ padding: 12, marginTop: 8, minWidth: 240 }}>
            <strong>{t.title || 'Notice'}</strong>
            {t.message ? <div style={{ color: 'var(--muted-700)' }}>{t.message}</div> : null}
            <button className="btn ghost small" onClick={() => removeToast(t.id)} style={{ marginTop: 8 }}>Dismiss</button>
          </div>
        ))}
      </div>
      {modals.map((m) => (
        <div key={m.id} role="dialog" aria-modal="true" className="card"
             style={{ position: 'fixed', inset: 0, margin: 'auto', width: 480, maxWidth: '90%', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong>{m.title || 'Modal'}</strong>
            <button className="btn ghost small" onClick={() => closeModal(m.id)}>Close</button>
          </div>
          {m.content}
        </div>
      ))}
    </UIContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useUI() {
  /** Hook to access UI context */
  return useContext(UIContext);
}
