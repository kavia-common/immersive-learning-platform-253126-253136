import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../state/AuthContext';
import { getConfig } from '../lib/config';
import { runSupabaseSelfTest } from '../utils/testSupabase';
import { debugSupabaseConnection } from '../utils/debugConnection';
import DiagnosticsPanel from '../components/DiagnosticsPanel';

/**
 * Diagnostics panel for environment, network reachability, Supabase client, DB probe, and auth session.
 * - Shows masked environment presence only (no secrets).
 * - Provides a "Run checks" button to re-run probes.
 * - Displays timestamps and statuses using Ocean Professional styling.
 */
// PUBLIC_INTERFACE
export default function Diagnostics() {
  /** In-app diagnostics page for signed-in users to validate environment and connectivity. */
  const { user, session } = useAuth();
  const [ts, setTs] = React.useState(null);
  const [checking, setChecking] = React.useState(false);
  const [envInfo, setEnvInfo] = React.useState(null);
  const [connInfo, setConnInfo] = React.useState(null);
  const [selfTest, setSelfTest] = React.useState(null);

  const cfg = React.useMemo(() => getConfig(), []);

  const mask = (str) => {
    if (!str) return '';
    const v = String(str);
    if (v.length <= 6) return '***';
    return `${v.slice(0, 3)}***${v.slice(-3)}`;
  };

  const runChecks = async () => {
    setChecking(true);
    try {
      // Masked env presence view
      const env = {
        nodeEnv: cfg.env,
        supabaseUrlPresent: Boolean(cfg.supabase?.url),
        supabaseKeyPresent: Boolean(cfg.supabase?.anonKey),
        apiBasePresent: Boolean(cfg.apiBase),
        frontendUrlPresent: Boolean(cfg.frontendUrl),
        wsUrlPresent: Boolean(cfg.wsUrl),
        // masked samples
        supabaseUrlSample: cfg.supabase?.url ? mask(cfg.supabase.url) : '',
        supabaseKeyLen: cfg.supabase?.anonKey ? String(cfg.supabase.anonKey).length : 0,
      };
      setEnvInfo(env);

      // Detailed connection diagnostics
      const connection = await debugSupabaseConnection(4000);
      setConnInfo(connection);

      // Supabase self test (includes session and DB probe)
      const self = await runSupabaseSelfTest();
      setSelfTest(self);

      setTs(new Date().toISOString());
    } finally {
      setChecking(false);
    }
  };

  React.useEffect(() => {
    runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Stat = ({ label, value, hint }) => (
    <div className="diag-stat">
      <div className="diag-stat__label">{label}</div>
      <div className="diag-stat__value">
        {typeof value === 'boolean' ? (
          <span className={value ? 'ok' : 'fail'}>{String(value)}</span>
        ) : (
          <span>{value ?? '-'}</span>
        )}
      </div>
      {hint ? <div className="diag-stat__hint">{hint}</div> : null}
    </div>
  );

  const Section = ({ title, children }) => (
    <Card className="diag-card">
      <div style={{ padding: 16 }}>
        <h3 className="card-title" style={{ marginTop: 0 }}>{title}</h3>
        <div className="diag-grid">
          {children}
        </div>
      </div>
    </Card>
  );

  const Note = ({ children }) => (
    <div className="diag-note">{children}</div>
  );

  return (
    <div className="container" aria-labelledby="diagnostics-heading">
      <h1 id="diagnostics-heading" className="page-title">Diagnostics</h1>
      <p className="muted">
        Run environment and connectivity checks to quickly validate your setup. Secrets are never displayed.
      </p>

      {/* New comprehensive DiagnosticsPanel (Supabase environment, network, DB probe, auth session) */}
      <div style={{ margin: '16px 0' }}>
        <DiagnosticsPanel />
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <Button variant="ghost" onClick={runChecks} disabled={checking}>
          {checking ? 'Running checks…' : 'Run checks'}
        </Button>
        {ts ? <span className="muted">Last run: <code>{ts}</code></span> : null}
        {selfTest?.ok === true ? (
          <span className="diag-chip ok">Healthy</span>
        ) : selfTest?.ok === false ? (
          <span className="diag-chip warn">Issues detected</span>
        ) : null}
      </div>

      <Section title="Environment (masked)">
        <Stat label="NODE_ENV" value={cfg.env} />
        <Stat label="Supabase URL present" value={envInfo?.supabaseUrlPresent} hint={envInfo?.supabaseUrlSample} />
        <Stat label="Supabase Key present" value={envInfo?.supabaseKeyPresent} hint={envInfo?.supabaseKeyLen ? `len=${envInfo.supabaseKeyLen}` : ''} />
        <Stat label="API Base present" value={envInfo?.apiBasePresent} />
        <Stat label="Frontend URL present" value={envInfo?.frontendUrlPresent} />
        <Stat label="WebSocket URL present" value={envInfo?.wsUrlPresent} />
      </Section>

      <Section title="Network reachability">
        <Stat label="Reachable" value={connInfo?.network?.reachable} />
        <Stat label="HTTP status" value={connInfo?.network?.status ?? '—'} />
        {Array.isArray(connInfo?.notes) && connInfo.notes.length > 0 ? (
          <div style={{ gridColumn: '1/-1' }}>
            {connInfo.notes.map((n, i) => <Note key={i}>{n}</Note>)}
          </div>
        ) : null}
      </Section>

      <Section title="Database probe">
        <Stat label="Probe OK" value={connInfo?.probe?.ok} />
        <Stat label="Table used" value={connInfo?.probe?.table || 'profiles/courses'} />
        <Stat label="Tables tried" value={Array.isArray(connInfo?.probe?.tried) ? connInfo.probe.tried.join(', ') : '—'} />
        <Stat label="Errors" value={Array.isArray(connInfo?.probe?.errors) && connInfo.probe.errors.length ? connInfo.probe.errors.map(e => `${e.table}: ${e.error}`).join(' | ') : '—'} />
      </Section>

      <Section title="Auth session">
        <Stat label="Signed in" value={Boolean(user)} />
        <Stat label="Session present" value={Boolean(session)} />
        <Stat label="Self-test OK" value={selfTest?.ok ?? false} hint={selfTest?.message} />
        <Note>
          If session is false, sign in first, then re-run diagnostics.
        </Note>
      </Section>

      <style>
        {`
          .diag-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
          .diag-stat__label { font-size: 0.9rem; color: var(--muted-600); }
          .diag-stat__value { font-weight: 700; }
          .diag-stat__value .ok { color: #065f46; }
          .diag-stat__value .fail { color: #7f1d1d; }
          .diag-stat__hint { font-size: 0.8rem; color: var(--muted-600); }
          .diag-card { margin-bottom: 12px; }
          .diag-note {
            background: var(--surface-translucent);
            border: 1px dashed var(--glass-border);
            color: var(--muted-700);
            padding: 8px 10px;
            border-radius: var(--radius-md);
            margin-top: 8px;
          }
          .diag-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            border: 1px solid var(--glass-border);
            background: rgba(255,255,255,0.7);
            backdrop-filter: blur(6px);
          }
          .diag-chip.ok { color: #065f46; background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.4); }
          .diag-chip.warn { color: #7f1d1d; background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.4); }
        `}
      </style>
    </div>
  );
}
