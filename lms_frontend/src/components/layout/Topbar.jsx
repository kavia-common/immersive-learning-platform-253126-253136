import React from 'react';
import Breadcrumbs from './Breadcrumbs';

/**
 * Topbar with brand, breadcrumbs, and actions slot.
 */
// PUBLIC_INTERFACE
export function Topbar({ breadcrumbs = [], actions }) {
  return (
    <header className="topbar" role="banner">
      <div className="topbar-left">
        <div className="brand" aria-label="Ocean LMS">
          <span className="brand-dot" aria-hidden="true" />
          <span className="brand-name">Ocean LMS</span>
        </div>
        <Breadcrumbs items={breadcrumbs} />
      </div>
      <div className="topbar-right" role="group" aria-label="Header actions">
        {actions}
      </div>
    </header>
  );
}

export default Topbar;
