import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

/**
 * Sidebar with responsive collapse, keyboard/focus visibility, and active link styling.
 * Provide items: [{ to, label, section?: 'primary'|'secondary' }]
 */
// PUBLIC_INTERFACE
export function Sidebar({ items = [] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) setOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <aside className="sidebar" aria-label="Sidebar navigation">
      <button
        className="oui-btn oui-btn--ghost oui-btn--sm sidebar__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="sidebar-nav"
      >
        {open ? 'Hide Menu' : 'Show Menu'}
      </button>
      <nav id="sidebar-nav" className={clsx('oui-side', open && 'is-open')}>
        <ul className="nav">
          {items
            .filter(Boolean)
            .map((item, idx) =>
              item === 'divider' ? (
                <li key={`div-${idx}`} className="divider" aria-hidden="true" />
              ) : (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      clsx('nav-link', isActive && 'is-active')
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              )
            )}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
