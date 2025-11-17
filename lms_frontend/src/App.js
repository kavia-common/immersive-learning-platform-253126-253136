import React from 'react';
import './App.css';
import './theme/global.css';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { RoutesRoot } from './router/Routes';
import { useAuth } from './state/AuthContext';
import { ErrorBoundary } from './lib/errorBoundary';
import Topbar from './components/layout/Topbar';
import Sidebar from './components/layout/Sidebar';
import Button from './components/ui/Button';
import Card from './components/ui/Card';

function TopbarActions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>Search</Button>
      {user ? (
        <Button variant="primary" size="sm" onClick={() => navigate('/profile')}>My Account</Button>
      ) : (
        <Button variant="primary" size="sm" onClick={() => navigate('/signin')}>Sign In</Button>
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="app-root">
          <Topbar
            breadcrumbs={[
              { label: 'Home', to: '/' },
              { label: 'Dashboard', current: true },
            ]}
            actions={<TopbarActions />}
          />

          <div className="gradient-hero" aria-hidden="true">
            <div className="hero-content">
              <h1 className="hero-title">Learn. Create. Grow.</h1>
              <p className="hero-subtitle">A modern learning experience, powered by Ocean Professional design.</p>
            </div>
          </div>

          <div className="layout">
            <Sidebar
              items={[
                { to: '/marketplace', label: 'Marketplace' },
                { to: '/learn', label: 'Learn' },
                { to: '/profile', label: 'Profile' },
                'divider',
                { to: '/instructor', label: 'Instructor' },
                { to: '/admin', label: 'Admin' },
              ]}
            />
            <main className="content" role="main">
              <RoutesRoot />
              <div style={{ marginTop: 16 }}>
                <Card variant="subtle">
                  <div style={{ padding: 12, color: 'var(--muted-700)' }}>
                    Tip: Use the sidebar to explore different roles and sections.
                  </div>
                </Card>
              </div>
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
