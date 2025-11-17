import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';

// PUBLIC_INTERFACE
export function AuthGuard({ children }) {
  /**
   * Route guard: requires authenticated user session.
   * Redirects to /signin preserving the original intent.
   */
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="card" style={{ padding: 16 }}><p>Loading…</p></div>;
  }
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }
  return children;
}

// PUBLIC_INTERFACE
export function RoleGuard({ roles = [], fallback = '/learn', children }) {
  /**
   * Role-based guard in addition to AuthGuard.
   * Requires user to have one of the roles.
   */
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return <div className="card" style={{ padding: 16 }}><p>Loading…</p></div>;
  }
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  if (roles.length && !roles.some((r) => hasRole(r))) {
    return <Navigate to={fallback} replace />;
  }
  return children;
}

export default AuthGuard;
