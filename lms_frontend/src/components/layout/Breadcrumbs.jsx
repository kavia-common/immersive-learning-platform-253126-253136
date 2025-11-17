import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Breadcrumbs navigation with aria-label and list semantics.
 * items: [{ label, to, current }]
 */
// PUBLIC_INTERFACE
export function Breadcrumbs({ items = [] }) {
  return (
    <nav className="oui-breadcrumbs" aria-label="Breadcrumb">
      <ol className="oui-breadcrumbs__list">
        {items.map((item, idx) => {
          const isCurrent = !!item.current || idx === items.length - 1;
          return (
            <li key={idx} className="oui-breadcrumbs__item">
              {isCurrent ? (
                <span aria-current="page" className="oui-breadcrumbs__link is-current">
                  {item.label}
                </span>
              ) : (
                <Link className="oui-breadcrumbs__link" to={item.to || '#'}>
                  {item.label}
                </Link>
              )}
              {idx < items.length - 1 ? <span className="oui-breadcrumbs__divider" aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
