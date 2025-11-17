import React, { useEffect, useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { useUI } from '../state/UIContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

// PUBLIC_INTERFACE
export default function VerifyEmail() {
  /** Email verification landing page with session refresh hint. */
  const { user, refreshSession } = useAuth();
  const { addToast } = useUI();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Attempt to refresh session (in case of email confirmation redirect)
    (async () => {
      await refreshSession();
      setChecked(true);
    })().catch(() => {
      setChecked(true);
    });
  }, [refreshSession]);

  return (
    <Card className="card" style={{ maxWidth: 520, margin: '24px auto', padding: 20 }}>
      <h2 style={{ marginBottom: 8 }}>Verify your email</h2>
      <p style={{ color: 'var(--muted-700)', marginBottom: 12 }}>
        We’ve sent a verification link to your email. Click it to activate your account.
      </p>
      {checked && user ? (
        <Card className="card" style={{ padding: 12, marginTop: 8 }}>
          <strong>Great!</strong>
          <p style={{ color: 'var(--muted-700)' }}>
            Your account appears active. You can now access your dashboard.
          </p>
        </Card>
      ) : (
        <Button
          variant="primary"
          onClick={async () => {
            await refreshSession();
            addToast({ title: 'Session refreshed', message: 'If verified, your account will be active now.' });
          }}
        >
          I’ve verified my email
        </Button>
      )}
    </Card>
  );
}
