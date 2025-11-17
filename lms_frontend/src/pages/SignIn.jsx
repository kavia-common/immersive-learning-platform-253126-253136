import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useUI } from '../state/UIContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

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
    <Card className="card" style={{ maxWidth: 420, margin: '24px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 8 }}>Welcome back</h2>
      <p style={{ color: 'var(--muted-700)', marginBottom: 12 }}>
        Sign in to continue learning.
      </p>
      <form onSubmit={onSubmit}>
        <Input
          label="Email"
          id="email"
          autoComplete="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          id="password"
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginTop: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <Link to="/forgot-password" className="nav-link" style={{ padding: 0 }}>Forgot password?</Link>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </div>
      </form>
      <div style={{ marginTop: 12, color: 'var(--muted-700)' }}>
        New here? <Link to="/signup" className="nav-link" style={{ padding: 0 }}>Create an account</Link>
      </div>
    </Card>
  );
}
