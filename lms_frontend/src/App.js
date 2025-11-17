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
import { FeatureFlagProvider } from './state/FeatureFlagContext';
import { runSupabaseSelfTest } from './utils/testSupabase';

function TopbarActions() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate('/marketplace')}>Search</Button>
      {user && hasRole && hasRole('instructor') ? (
        <Button variant="ghost" size="sm" onClick={() => navigate('/instructor')}>Instructor</Button>
      ) : null}
      {user && hasRole && hasRole('admin') ? (
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>Admin</Button>
      ) : null}
      {process.env.REACT_APP_NODE_ENV !== 'production' ? (
        <Button variant="ghost" size="sm" onClick={() => navigate('/diagnostics')}>Diagnostics</Button>
      ) : null}
      {user ? (
        <Button variant="primary" size="sm" onClick={() => navigate('/profile')}>My Account</Button>
      ) : (
        <Button variant="primary" size="sm" onClick={() => navigate('/signin')}>Sign In</Button>
      )}
    </>
  );
}

function SupabaseStatusBanner() {
  const [status, setStatus] = React.useState({ loading: true });

  const refresh = React.useCallback(async () => {
    const s = await runSupabaseSelfTest();
    setStatus({ loading: false, ...s });
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await runSupabaseSelfTest();
      if (mounted) setStatus({ loading: false, ...s });
    })();

    const handler = () => {
      // re-run when diagnostics page triggers global event
      refresh();
    };
    window.addEventListener('diagnostics:rerun', handler);

    return () => {
      mounted = false;
      window.removeEventListener('diagnostics:rerun', handler);
    };
  }, [refresh]);

  if (status.loading) return null;

  const ok = status.ok;
  const style = {
    padding: '8px 12px',
    borderRadius: 8,
    margin: '8px 16px',
    background: ok ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
    color: ok ? 'rgb(6, 95, 70)' : 'rgb(127, 29, 29)',
    fontSize: 12,
    display: 'inline-block',
  };

  return (
    <div role="status" aria-live="polite" style={style}>
      Supabase: {status.message}
    </div>
  );
}

function App() {
  return (
      <BrowserRouter>
        <FeatureFlagProvider>
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
              <SupabaseStatusBanner />
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
                // Admin link shown, RoleGuard will protect actual route
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
        </FeatureFlagProvider>
      </BrowserRouter>
  );
}

export default App;
