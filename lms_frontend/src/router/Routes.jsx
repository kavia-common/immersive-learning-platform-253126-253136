import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

const Placeholder = ({ title, desc }) => (
  <div className="card" style={{ padding: 16 }}>
    <h2>{title}</h2>
    {desc ? <p style={{ color: 'var(--muted-700)' }}>{desc}</p> : null}
  </div>
);

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Placeholder title="Protected Area" desc="Sign in required. Placeholder guard." />;
  }
  return children;
}

// PUBLIC_INTERFACE
export function RoutesRoot() {
  /** Defines all application routes (public and protected) */
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/marketplace" replace />} />
      <Route path="/signin" element={<Placeholder title="Sign In" desc="Auth screen placeholder." />} />
      <Route path="/signup" element={<Placeholder title="Sign Up" desc="Registration placeholder." />} />
      <Route path="/marketplace" element={<Placeholder title="Marketplace" desc="Course catalog placeholder." />} />

      {/* Protected routes - simple placeholder guard for now */}
      <Route
        path="/learn"
        element={
          <Protected>
            <Placeholder title="Learn" desc="Learning dashboard placeholder." />
          </Protected>
        }
      />
      <Route
        path="/profile"
        element={
          <Protected>
            <Placeholder title="Profile" desc="User profile placeholder." />
          </Protected>
        }
      />
      <Route
        path="/instructor"
        element={
          <Protected>
            <Placeholder title="Instructor" desc="Instructor tools placeholder." />
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected>
            <Placeholder title="Admin" desc="Administration console placeholder." />
          </Protected>
        }
      />
      <Route path="*" element={<Placeholder title="Not Found" desc="The page you’re looking for doesn’t exist." />} />
    </Routes>
  );
}
