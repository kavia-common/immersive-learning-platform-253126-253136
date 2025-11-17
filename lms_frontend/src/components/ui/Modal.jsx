import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';

/**
 * Accessible modal dialog with ESC and backdrop close, initial focus, and aria wiring.
 */
// PUBLIC_INTERFACE
export function Modal({
  open,
  onClose,
  title = 'Modal',
  children,
  className,
  initialFocusSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
}) {
  const containerRef = useRef(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`).current;

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && open) {
        onClose?.();
      }
      // Very light focus trap: cycle focus within modal
      if (open && e.key === 'Tab' && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll(initialFocusSelector);
        const list = Array.from(focusables);
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || !containerRef.current.contains(active)) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (active === last || !containerRef.current.contains(active)) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, initialFocusSelector]);

  useEffect(() => {
    if (open && containerRef.current) {
      const node = containerRef.current.querySelector(initialFocusSelector);
      node?.focus?.();
    }
  }, [open, initialFocusSelector]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="oui-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={clsx('oui-modal', className)}
      >
        <div className="oui-modal__header">
          <h2 id={titleId} className="oui-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="oui-btn oui-btn--ghost oui-btn--sm"
            aria-label="Close dialog"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="oui-modal__body">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
