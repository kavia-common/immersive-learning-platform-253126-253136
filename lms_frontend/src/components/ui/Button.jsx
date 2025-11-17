import React from 'react';
import clsx from 'clsx';

/**
 * Button component with Ocean Professional styles, ARIA and focus-visible support.
 * Variants: primary, ghost, subtle, danger. Sizes: sm, md, lg. Full-width optional.
 */
// PUBLIC_INTERFACE
export function Button({
  as: Comp = 'button',
  type = 'button',
  variant = 'primary',
  size = 'md',
  full = false,
  className,
  children,
  ...rest
}) {
  const base = 'oui-btn';
  const classes = clsx(
    base,
    `${base}--${variant}`,
    `${base}--${size}`,
    full && `${base}--block`,
    className
  );

  // If rendering as link, drop type attr
  const commonProps = { className: classes, ...rest };
  if (Comp === 'button') {
    commonProps.type = type;
  }

  return <Comp {...commonProps}>{children}</Comp>;
}

export default Button;
