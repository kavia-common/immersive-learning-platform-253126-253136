import React from 'react';
import clsx from 'clsx';

/**
 * Toast notification item.
 * Variants: info, success, warning, error.
 */
// PUBLIC_INTERFACE
export function Toast({ title = 'Notice', message, variant = 'info', onDismiss }) {
  return (
    <div
      className={clsx('oui-toast', `oui-toast--${variant}`, 'oui-card')}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="oui-toast__header">
        <strong className="oui-toast__title">{title}</strong>
        <button
          className="oui-btn oui-btn--ghost oui-btn--sm"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          type="button"
        >
          Dismiss
        </button>
      </div>
      {message ? <div className="oui-toast__body">{message}</div> : null}
    </div>
  );
}

export default Toast;
