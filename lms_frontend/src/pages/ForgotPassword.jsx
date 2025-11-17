import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useUI } from '../state/UIContext';

// PUBLIC_INTERFACE
export default function ForgotPassword() {
  /** Forgot password page: sends a reset link to the provided email. */
  const { requestPasswordReset, loading } = useAuth();
  const { addToast } = useUI();
  const [email, setEmail] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      addToast({ title: 'Missing email', message: 'Please provide your account email.' });
      return;
    }
    await requestPasswordReset(email);
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: '24px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 8 }}>Reset your password</h2>
      <p style={{ color: 'var(--muted-700)', marginBottom: 12 }}>
        Enter your email and we’ll send you a reset link.
      </p>
      <form onSubmit={onSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          autoComplete="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: 'block', width: '100%', margin: '6px 0 12px 0', padding: 10, borderRadius: 10, border: '1px solid var(--glass-border)' }}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Link to="/signin" className="nav-link" style={{ padding: 0 }}>Back to sign in</Link>
          <button disabled={loading} className="btn primary" type="submit">
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </div>
      </form>
    </div>
  );
}
