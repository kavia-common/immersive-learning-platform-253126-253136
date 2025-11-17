import React, { useMemo, useState } from 'react';
import getSupabaseClient from '../config/supabaseClient';

/**
 * DiagnosticsPanel
 *
 * PUBLIC_INTERFACE
 * A reusable diagnostics panel to validate Supabase setup from the frontend.
 * It performs:
 *  - Environment check: validates required env vars are present (masked display)
 *  - Network reachability: HEAD/GET to Supabase URL
 *  - DB probe: calls a lightweight RPC or list from a public table to verify DB access
 *  - Auth session: checks current session and displays masked tokens
 *
 * Security:
 * - Does NOT expose full secret values. Masks keys and sensitive tokens.
 * - Reads only from process.env variables injected at build-time.
 *
 * Usage:
 *  import DiagnosticsPanel from '../components/DiagnosticsPanel';
 *  <DiagnosticsPanel />
 */

const REQUIRED_ENV_KEYS = [
  'REACT_APP_SUPABASE_URL',
  'REACT_APP_SUPABASE_KEY',
];

function maskValue(value, visible = 4) {
  if (!value) return '';
  const str = String(value);
  if (str.length <= visible) return '*'.repeat(str.length);
  return `${str.slice(0, visible)}${'*'.repeat(Math.max(0, str.length - visible - 2))}${str.slice(-2)}`;
}

function getMaskedEnv() {
  return REQUIRED_ENV_KEYS.map((k) => {
    const v = process.env[k];
    return {
      key: k,
      present: !!v,
      valueMasked: v ? maskValue(v) : '',
    };
  });
}

async function checkNetwork(url) {
  if (!url) return { ok: false, status: 'No URL' };
  try {
    // Prefer HEAD if allowed, otherwise fallback to GET
    const resp = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    // no-cors may not give us status; try GET without credentials
    return { ok: true, status: 'Reachable (HEAD/no-cors)' };
  } catch {
    try {
      const resp2 = await fetch(url, { method: 'GET' });
      return { ok: resp2.ok, status: `GET ${resp2.status}` };
    } catch (err) {
      return { ok: false, status: String(err) };
    }
  }
}

async function probeDatabase() {
  const supabase = getSupabaseClient();
  // Try a very lightweight call: get auth settings (public)
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { ok: false, message: `Auth check failed: ${error.message}` };
    }
  } catch (e) {
    // continue to next probe
  }

  // Try listing from a non-sensitive schema via rest meta endpoint
  try {
    // We can attempt a ping by invoking a simple RPC if defined; fallback to anon query against pg
    // Since we cannot assume a table, we will call the root URL with GET which should return 404/200
    // The key goal is verifying we can reach Supabase REST with the anon key.
    const url = process.env.REACT_APP_SUPABASE_URL;
    const key = process.env.REACT_APP_SUPABASE_KEY;

    if (!url || !key) {
      return { ok: false, message: 'Missing Supabase env variables.' };
    }

    const resp = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    // 200 or 404 is acceptable as long as we can reach and authorize
    if (resp.status === 200 || resp.status === 404) {
      return { ok: true, message: `REST reachable (status ${resp.status})` };
    }
    return { ok: false, message: `REST responded with status ${resp.status}` };
  } catch (err) {
    return { ok: false, message: `DB probe error: ${String(err)}` };
  }
}

async function checkAuthSession() {
  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      return { ok: false, message: error.message };
    }
    const sess = data?.session;
    if (!sess) return { ok: true, session: null };

    const masked = {
      userId: sess.user?.id || null,
      expires_at: sess.expires_at || null,
      access_token_masked: sess.access_token ? maskValue(sess.access_token, 6) : null,
      refresh_token_masked: sess.refresh_token ? maskValue(sess.refresh_token, 6) : null,
      provider_token_present: !!sess.provider_token,
    };
    return { ok: true, session: masked };
  } catch (err) {
    return { ok: false, message: String(err) };
  }
}

const Section = ({ title, children }) => (
  <div style={{
    background: '#ffffff',
    borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    padding: 16,
    marginBottom: 16,
    border: '1px solid #e5e7eb'
  }}>
    <h3 style={{ margin: '0 0 8px', color: '#111827', fontSize: 16 }}>{title}</h3>
    <div>{children}</div>
  </div>
);

const Badge = ({ ok, label }) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color: ok ? '#065f46' : '#991b1b',
    background: ok ? '#d1fae5' : '#fee2e2',
    border: `1px solid ${ok ? '#34d399' : '#fca5a5'}`,
    marginLeft: 8
  }}>
    {label}
  </span>
);

export default function DiagnosticsPanel() {
  const [envResults, setEnvResults] = useState(getMaskedEnv());
  const [network, setNetwork] = useState({ loading: false, result: null });
  const [db, setDb] = useState({ loading: false, result: null });
  const [auth, setAuth] = useState({ loading: false, result: null });
  const [runningAll, setRunningAll] = useState(false);

  const supabaseUrl = useMemo(() => process.env.REACT_APP_SUPABASE_URL || '', []);
  const supabaseKeyMasked = useMemo(() => maskValue(process.env.REACT_APP_SUPABASE_KEY || ''), []);

  const runEnvCheck = () => {
    setEnvResults(getMaskedEnv());
  };

  const runNetworkCheck = async () => {
    setNetwork({ loading: true, result: null });
    const result = await checkNetwork(supabaseUrl);
    setNetwork({ loading: false, result });
  };

  const runDbProbe = async () => {
    setDb({ loading: true, result: null });
    const result = await probeDatabase();
    setDb({ loading: false, result });
  };

  const runAuthCheck = async () => {
    setAuth({ loading: true, result: null });
    const result = await checkAuthSession();
    setAuth({ loading: false, result });
  };

  const runAll = async () => {
    setRunningAll(true);
    try {
      runEnvCheck();
      const [net, dbres, authres] = await Promise.all([
        (async () => {
          const r = await checkNetwork(supabaseUrl);
          setNetwork({ loading: false, result: r });
          return r;
        })(),
        (async () => {
          const r = await probeDatabase();
          setDb({ loading: false, result: r });
          return r;
        })(),
        (async () => {
          const r = await checkAuthSession();
          setAuth({ loading: false, result: r });
          return r;
        })(),
      ]);
      try {
        // eslint-disable-next-line no-console
        console.info('DiagnosticsPanel runAll (masked):', {
          env: envResults.map(e => ({ key: e.key, present: e.present })),
          network: net,
          db: { ok: dbres?.ok, message: dbres?.message },
          auth: { ok: authres?.ok, hasSession: !!authres?.session },
        });
      } catch (_) {}
    } finally {
      setRunningAll(false);
    }
  };

  const allEnvPresent = envResults.every((e) => e.present);

  return (
    <div style={{
      background: 'linear-gradient(to bottom right, rgba(37,99,235,0.08), rgba(249,250,251,1))',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #dbeafe'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#111827' }}>Supabase Diagnostics</h2>
          <Badge ok={allEnvPresent} label={allEnvPresent ? 'Env OK' : 'Env Missing'} />
        </div>
        <div>
          <button
            onClick={runAll}
            disabled={runningAll}
            style={{
              background: '#111827',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: runningAll ? 'not-allowed' : 'pointer',
              opacity: runningAll ? 0.7 : 1
            }}
            aria-label="Run all diagnostics checks"
          >
            {runningAll ? 'Running…' : 'Run all checks'}
          </button>
        </div>
      </div>

      <Section title="Environment Variables">
        <div style={{ fontSize: 14, color: '#374151' }}>
          {envResults.map(({ key, present, valueMasked }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6, border: '1px solid #e5e7eb' }}>{key}</code>
              <span style={{ marginLeft: 8, color: present ? '#065f46' : '#991b1b' }}>
                {present ? 'present' : 'missing'}
              </span>
              {present && (
                <span style={{ marginLeft: 8, color: '#6b7280' }}>
                  ({valueMasked})
                </span>
              )}
            </div>
          ))}

          <div style={{ marginTop: 8 }}>
            <button
              onClick={runEnvCheck}
              style={{
                background: '#2563EB',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Re-check env
            </button>
          </div>
        </div>
      </Section>

      <Section title="Network Reachability">
        <div style={{ fontSize: 14, color: '#374151' }}>
          <div style={{ marginBottom: 8 }}>
            <div>Supabase URL:</div>
            <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6, border: '1px solid #e5e7eb' }}>
              {supabaseUrl || '(not set)'}
            </code>
          </div>

          <button
            onClick={runNetworkCheck}
            disabled={!supabaseUrl || network.loading}
            style={{
              background: '#2563EB',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: !supabaseUrl || network.loading ? 'not-allowed' : 'pointer',
              opacity: !supabaseUrl || network.loading ? 0.6 : 1
            }}
          >
            {network.loading ? 'Checking…' : 'Check network'}
          </button>

          {network.result && (
            <div style={{ marginTop: 8 }}>
              <Badge ok={!!network.result.ok} label={network.result.ok ? 'Reachable' : 'Unreachable'} />
              <span style={{ marginLeft: 8, color: '#6b7280' }}>
                {network.result.status}
              </span>
            </div>
          )}
        </div>
      </Section>

      <Section title="Database Probe (REST)">
        <div style={{ fontSize: 14, color: '#374151' }}>
          <div style={{ marginBottom: 8 }}>
            <div>Anon key (masked):</div>
            <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: 6, border: '1px solid #e5e7eb' }}>
              {supabaseKeyMasked || '(not set)'}
            </code>
          </div>

          <button
            onClick={runDbProbe}
            disabled={db.loading}
            style={{
              background: '#2563EB',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: db.loading ? 'not-allowed' : 'pointer',
              opacity: db.loading ? 0.6 : 1
            }}
          >
            {db.loading ? 'Probing…' : 'Probe DB'}
          </button>

          {db.result && (
            <div style={{ marginTop: 8 }}>
              <Badge ok={!!db.result.ok} label={db.result.ok ? 'OK' : 'Failed'} />
              <span style={{ marginLeft: 8, color: '#6b7280' }}>
                {db.result.message}
              </span>
            </div>
          )}
        </div>
      </Section>

      <Section title="Auth Session">
        <div style={{ fontSize: 14, color: '#374151' }}>
          <button
            onClick={runAuthCheck}
            disabled={auth.loading}
            style={{
              background: '#2563EB',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: auth.loading ? 'not-allowed' : 'pointer',
              opacity: auth.loading ? 0.6 : 1
            }}
          >
            {auth.loading ? 'Checking…' : 'Check session'}
          </button>

          {auth.result && (
            <div style={{ marginTop: 8 }}>
              <Badge ok={!!auth.result.ok} label={auth.result.ok ? 'OK' : 'Failed'} />
              {!auth.result.ok && (
                <span style={{ marginLeft: 8, color: '#991b1b' }}>
                  {auth.result.message}
                </span>
              )}
              {auth.result.ok && auth.result.session === null && (
                <span style={{ marginLeft: 8, color: '#6b7280' }}>
                  No active session
                </span>
              )}
              {auth.result.ok && auth.result.session && (
                <div style={{
                  marginTop: 8,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 8
                }}>
                  <div><strong>User:</strong> {auth.result.session.userId || '(unknown)'}</div>
                  <div><strong>Expires:</strong> {auth.result.session.expires_at || '(n/a)'}</div>
                  <div><strong>Access token:</strong> {auth.result.session.access_token_masked || '(none)'}</div>
                  <div><strong>Refresh token:</strong> {auth.result.session.refresh_token_masked || '(none)'}</div>
                  <div><strong>Provider token present:</strong> {auth.result.session.provider_token_present ? 'yes' : 'no'}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
