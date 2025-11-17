import { logger } from '../lib/logger';
import { getSupabaseClient } from '../config/supabaseClient';

/**
 * Perform multi-step Supabase connectivity diagnostics.
 * Steps:
 * 1) Environment presence check (masked)
 * 2) Network reachability check (HEAD/GET with timeout)
 * 3) Lightweight query probe to profiles/courses
 *
 * Returns a structured result:
 * {
 *   ok: boolean,
 *   env: { urlPresent, anonKeyPresent },
 *   network: { reachable, status?, error? },
 *   probe: { ok, table?, tried, errors? },
 *   notes?: string[]
 * }
 */
// PUBLIC_INTERFACE
export async function debugSupabaseConnection(timeoutMs = 4000) {
  /** Run multi-step diagnostics and return structured results for UI display or console logging. */
  const url = process.env.REACT_APP_SUPABASE_URL || '';
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_KEY || '';

  const env = { urlPresent: Boolean(url), anonKeyPresent: Boolean(anonKey) };
  const notes = [];

  logger.info('Supabase diagnostics: env presence', { env });

  // Step 2: Network reachability
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), Math.max(1000, timeoutMs));
  let network = { reachable: false };
  try {
    // Use GET to the base URL; if blocked by CORS, we still detect reachability via thrown TypeError
    const res = await fetch(url, { method: 'GET', mode: 'cors', signal: controller.signal });
    network = { reachable: res.ok || (res.status >= 200 && res.status < 500), status: res.status };
  } catch (e) {
    network = { reachable: false, error: e?.message || 'fetch_failed' };
  } finally {
    clearTimeout(t);
  }
  logger.info('Supabase diagnostics: network', network);

  // Step 3: Lightweight query probe
  const supabase = getSupabaseClient();
  const trySelect = async (table) => {
    try {
      const { data, error } = await supabase.from(table).select('id').range(0, 0);
      if (error) return { ok: false, table, error: error.message };
      return { ok: true, table, count: Array.isArray(data) ? data.length : 0 };
    } catch (e) {
      return { ok: false, table, error: e?.message || 'unknown' };
    }
  };

  const tried = [];
  const errors = [];
  let probe = { ok: false, tried: [], errors: [] };

  const p1 = await trySelect('profiles');
  tried.push('profiles');
  if (p1.ok) {
    probe = { ok: true, table: 'profiles', tried };
  } else {
    errors.push({ table: 'profiles', error: p1.error });
    const p2 = await trySelect('courses');
    tried.push('courses');
    if (p2.ok) {
      probe = { ok: true, table: 'courses', tried };
    } else {
      errors.push({ table: 'courses', error: p2.error });
      probe = { ok: false, tried, errors };
    }
  }

  if (!env.urlPresent || !env.anonKeyPresent) {
    notes.push('Missing environment variables: ensure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY (or REACT_APP_SUPABASE_KEY) are set.');
  }
  if (!network.reachable) {
    notes.push('Supabase URL not reachable from browser. Check CORS settings, network connectivity, and URL correctness.');
  }
  if (!probe.ok) {
    const bothMissing = (errors[0]?.error || '').match(/relation|not exist/i) && (errors[1]?.error || '').match(/relation|not exist/i);
    const perm = (errors[0]?.error || '').match(/permission|policy|rls|rpc/i) && (errors[1]?.error || '').match(/permission|policy|rls|rpc/i);
    if (bothMissing) {
      notes.push('Tables not found: create public tables "profiles" or "courses", or adjust the probe tables.');
    } else if (perm) {
      notes.push('RLS/permissions may block the probe select. Verify policies or test with anon role access.');
    } else if (errors.length) {
      notes.push(`Probe errors: ${errors.map(e => `${e.table}: ${e.error}`).join(' | ')}`);
    }
  }

  const ok = env.urlPresent && env.anonKeyPresent && network.reachable && probe.ok;

  const result = { ok, env, network, probe, ...(notes.length ? { notes } : {}) };
  if (ok) {
    logger.info('Supabase diagnostics: OK', result);
  } else {
    logger.warn('Supabase diagnostics: issues detected', result);
  }
  return result;
}

export default debugSupabaseConnection;
