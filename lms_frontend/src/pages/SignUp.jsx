import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useUI } from '../state/UIContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

// PUBLIC_INTERFACE
export default function SignUp() {
  /** Sign Up page for new accounts, sends verification email via Supabase. */
  const { signUp, loading } = useAuth();
  const { addToast } = useUI();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({ title: 'Missing info', message: 'Email and password are required.' });
      return;
    }
    await signUp(email, password);
  };

  return (
    <Card className="card" style={{ maxWidth: 420, margin: '24px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 8 }}>Create your account</h2>
      <p style={{ color: 'var(--muted-700)', marginBottom: 12 }}>
        Start your learning journey today.
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
          autoComplete="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ marginTop: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Sign Up'}
          </Button>
        </div>
      </form>
      <div style={{ marginTop: 12, color: 'var(--muted-700)' }}>
        Already have an account? <Link to="/signin" className="nav-link" style={{ padding: 0 }}>Sign in</Link>
      </div>
    </Card>
  );
}
