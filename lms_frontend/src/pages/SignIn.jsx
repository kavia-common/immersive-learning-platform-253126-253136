import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useUI } from '../state/UIContext';

// PUBLIC_INTERFACE
export default function SignIn() {
  /** Sign In page for email/password authentication. Redirects after success. */
  const { signIn, loading } = useAuth();
  const { addToast } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state && location.state.from) || '/learn';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({ title: 'Missing info', message: 'Email and password are required.' });
      return;
    }
    const { error } = await signIn(email, password);
    if (!error) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: '24px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 8 }}>Welcome back</h2>
      <p style={{ color: 'var(--muted-700)', marginBottom: 12 }}>
        Sign in to continue learning.
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
        <label htmlFor="password">Password</label>
        <input
          id="password"
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: 'block', width: '100%', margin: '6px 0 12px 0', padding: 10, borderRadius: 10, border: '1px solid var(--glass-border)' }}
          required
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <Link to="/forgot-password" className="nav-link" style={{ padding: 0 }}>Forgot password?</Link>
          <button disabled={loading} className="btn primary" type="submit">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </form>
      <div style={{ marginTop: 12, color: 'var(--muted-700)' }}>
        New here? <Link to="/signup" className="nav-link" style={{ padding: 0 }}>Create an account</Link>
      </div>
    </div>
  );
}
