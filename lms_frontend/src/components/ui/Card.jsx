import React from 'react';
import clsx from 'clsx';

/**
 * Card surface container.
 * Variants: default, subtle, gradient
 */
// PUBLIC_INTERFACE
export function Card({ variant = 'default', className, children, ...rest }) {
  const classes = clsx('oui-card', `oui-card--${variant}`, className);
  return (
    <section className={classes} {...rest}>
      {children}
    </section>
  );
}

export default Card;
