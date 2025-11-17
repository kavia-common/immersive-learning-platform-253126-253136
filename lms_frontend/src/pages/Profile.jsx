import React from 'react';
import { useAuth } from '../state/AuthContext';

// PUBLIC_INTERFACE
export default function Profile() {
  /** Profile page for authenticated users to view basic info and sign out. */
  const { user, roles, signOut, loading } = useAuth();

  return (
    <div className="card" style={{ padding: 16 }}>
      <h2>My Profile</h2>
      {user ? (
        <>
          <p style={{ color: 'var(--muted-700)' }}>Email: {user.email}</p>
          <p style={{ color: 'var(--muted-700)' }}>
            User ID: <code>{user.id}</code>
          </p>
          <p style={{ color: 'var(--muted-700)' }}>
            Roles: {roles.length ? roles.join(', ') : 'none'}
          </p>
          <div style={{ marginTop: 12 }}>
            <button disabled={loading} onClick={signOut} className="btn ghost">Sign Out</button>
          </div>
        </>
      ) : (
        <p style={{ color: 'var(--muted-700)' }}>Not signed in.</p>
      )}
    </div>
  );
}
