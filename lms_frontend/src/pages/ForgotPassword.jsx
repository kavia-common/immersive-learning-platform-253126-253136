import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useUI } from '../state/UIContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

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
    <Card className="card" style={{ maxWidth: 420, margin: '24px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 8 }}>Reset your password</h2>
      <p style={{ color: 'var(--muted-700)', marginBottom: 12 }}>
        Enter your email and we’ll send you a reset link.
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <Link to="/signin" className="nav-link" style={{ padding: 0 }}>Back to sign in</Link>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
