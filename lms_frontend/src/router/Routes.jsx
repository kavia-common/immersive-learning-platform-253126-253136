import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SignIn from '../pages/SignIn';
import SignUp from '../pages/SignUp';
import ForgotPassword from '../pages/ForgotPassword';
import VerifyEmail from '../pages/VerifyEmail';
import Profile from '../pages/Profile';
import { AuthGuard, RoleGuard } from '../components/guards/AuthGuard';

const Placeholder = ({ title, desc }) => (
  <div className="card" style={{ padding: 16 }}>
    <h2>{title}</h2>
    {desc ? <p style={{ color: 'var(--muted-700)' }}>{desc}</p> : null}
  </div>
);

// PUBLIC_INTERFACE
export function RoutesRoot() {
  /** Defines all application routes (public and protected) */
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/marketplace" replace />} />
      <Route path="/marketplace" element={<Placeholder title="Marketplace" desc="Course catalog placeholder." />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Authenticated routes */}
      <Route
        path="/learn"
        element={
          <AuthGuard>
            <Placeholder title="Learn" desc="Learning dashboard placeholder." />
          </AuthGuard>
        }
      />
      <Route
        path="/profile"
        element={
          <AuthGuard>
            <Profile />
          </AuthGuard>
        }
      />
      <Route
        path="/instructor"
        element={
          <RoleGuard roles={['instructor', 'admin']}>
            <Placeholder title="Instructor" desc="Instructor tools placeholder." />
          </RoleGuard>
        }
      />
      <Route
        path="/admin"
        element={
          <RoleGuard roles={['admin']}>
            <Placeholder title="Admin" desc="Administration console placeholder." />
          </RoleGuard>
        }
      />
      <Route path="*" element={<Placeholder title="Not Found" desc="The page you’re looking for doesn’t exist." />} />
    </Routes>
  );
}
