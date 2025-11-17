import React from 'react';
import './App.css';
import './theme/global.css';
import { BrowserRouter } from 'react-router-dom';
import { RoutesRoot } from './router/Routes';
import { useAuth } from './state/AuthContext';
import { ErrorBoundary } from './lib/errorBoundary';

/**
 * App root with layout scaffold (Topbar/Sidebar placeholders) and gradient header.
 * Uses contexts and router to display basic route placeholders.
 */
function App() {
  const { user } = useAuth();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="app-root">
          <header className="topbar" role="banner">
            <div className="topbar-left">
              <div className="brand">
                <span className="brand-dot" aria-hidden="true" />
                <span className="brand-name">Ocean LMS</span>
              </div>
              <nav className="breadcrumb" aria-label="Breadcrumb">
                <span className="crumb">Home</span>
                <span className="divider">/</span>
                <span className="crumb muted">Dashboard</span>
              </nav>
            </div>
            <div className="topbar-right">
              <button className="btn ghost small" type="button">Search</button>
              <button className="btn primary small" type="button">{user ? 'My Account' : 'Sign In'}</button>
            </div>
          </header>

          <div className="gradient-hero" aria-hidden="true">
            <div className="hero-content">
              <h1 className="hero-title">Learn. Create. Grow.</h1>
              <p className="hero-subtitle">A modern learning experience, powered by Ocean Professional design.</p>
            </div>
          </div>

          <div className="layout">
            <aside className="sidebar" aria-label="Sidebar navigation">
              <ul className="nav">
                <li><a href="/marketplace" className="nav-link">Marketplace</a></li>
                <li><a href="/learn" className="nav-link">Learn</a></li>
                <li><a href="/profile" className="nav-link">Profile</a></li>
                <li className="divider" />
                <li><a href="/instructor" className="nav-link">Instructor</a></li>
                <li><a href="/admin" className="nav-link">Admin</a></li>
              </ul>
            </aside>
            <main className="content" role="main">
              <RoutesRoot />
            </main>
          </div>

          <footer className="footer">
            <span>© {new Date().getFullYear()} Ocean LMS</span>
          </footer>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
