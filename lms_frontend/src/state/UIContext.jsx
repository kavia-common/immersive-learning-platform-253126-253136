import React, { createContext, useContext, useMemo, useState } from 'react';
import Toast from '../components/ui/Toast';
import Modal from '../components/ui/Modal';

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

      {/* Toast region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 60 }}
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            title={t.title || 'Notice'}
            message={t.message}
            variant={t.variant || 'info'}
            onDismiss={() => removeToast(t.id)}
          />
        ))}
      </div>

      {/* Modal region */}
      {modals.map((m) => (
        <Modal
          key={m.id}
          open
          title={m.title || 'Modal'}
          onClose={() => closeModal(m.id)}
        >
          {m.content}
        </Modal>
      ))}
    </UIContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useUI() {
  /** Hook to access UI context */
  return useContext(UIContext);
}
