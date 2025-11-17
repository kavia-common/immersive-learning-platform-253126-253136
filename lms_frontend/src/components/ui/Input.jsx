import React, { forwardRef, useId } from 'react';
import clsx from 'clsx';

/**
 * Accessible Input with label, description, and error.
 * Supports type, placeholder, disabled, and full width.
 */
// PUBLIC_INTERFACE
export const Input = forwardRef(function Input(
  {
    label,
    id,
    helpText,
    error,
    className,
    full = true,
    type = 'text',
    ...rest
  },
  ref
) {
  const autoId = useId();
  const inputId = id || `input-${autoId}`;
  const helpId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={clsx('oui-field', full && 'oui-field--block', className)}>
      {label && (
        <label className="oui-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={clsx('oui-input', error && 'is-error')}
        aria-invalid={!!error}
        aria-describedby={clsx(helpId, errorId)}
        {...rest}
      />
      {helpText && (
        <div id={helpId} className="oui-help">
          {helpText}
        </div>
      )}
      {error && (
        <div id={errorId} className="oui-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
});

export default Input;
