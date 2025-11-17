import React from 'react';
import './App.css';
import './theme/global.css';
import { BrowserRouter, Link, useNavigate } from 'react-router-dom';
import { RoutesRoot } from './router/Routes';
import { useAuth } from './state/AuthContext';
import { ErrorBoundary } from './lib/errorBoundary';

/**
 * App root with layout scaffold (Topbar/Sidebar placeholders) and gradient header.
 * Uses contexts and router to display basic route placeholders.
 */
function TopbarActions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="topbar-right">
      <button className="btn ghost small" type="button" onClick={() => navigate('/marketplace')}>Search</button>
      {user ? (
        <button className="btn primary small" type="button" onClick={() => navigate('/profile')}>My Account</button>
      ) : (
        <button className="btn primary small" type="button" onClick={() => navigate('/signin')}>Sign In</button>
      )}
    </div>
  );
}

function App() {
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
            <TopbarActions />
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
                <li><Link to="/marketplace" className="nav-link">Marketplace</Link></li>
                <li><Link to="/learn" className="nav-link">Learn</Link></li>
                <li><Link to="/profile" className="nav-link">Profile</Link></li>
                <li className="divider" />
                <li><Link to="/instructor" className="nav-link">Instructor</Link></li>
                <li><Link to="/admin" className="nav-link">Admin</Link></li>
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
