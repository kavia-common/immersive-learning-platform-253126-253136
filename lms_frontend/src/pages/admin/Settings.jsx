import React from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getConfig } from '../../lib/config';

/**
 * Admin Settings page: readonly view for env-based settings with note.
 */
 // PUBLIC_INTERFACE
export default function AdminSettings() {
  /** Admin page showing environment-driven settings; instructs to use env for changes. */
  const cfg = getConfig();
  return (
    <div className="container" aria-labelledby="settings-heading">
      <h1 id="settings-heading" className="page-title">Settings</h1>
      <Card>
        <div style={{ padding: 16, display: 'grid', gap: 12 }}>
          <p className="muted">
            Configuration is environment-driven. To change these values, update .env and redeploy. Secrets are not shown.
          </p>
          <div className="grid grid-2">
            <Input label="Environment" value={cfg.env} readOnly />
            <Input label="API Base" value={cfg.apiBase} readOnly />
            <Input label="Frontend URL" value={cfg.frontendUrl} readOnly />
            <Input label="WebSocket URL" value={cfg.wsUrl} readOnly />
          </div>
          <div>
            <Button variant="ghost" disabled aria-disabled="true" title="Read-only">
              Save (env-managed)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
