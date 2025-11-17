import { getSupabaseClient } from '../config/supabaseClient';
import { logger } from '../lib/logger';

/**
 * Mask only presence/length of sensitive values for diagnostics.
 */
function maskEnv() {
  const url = process.env.REACT_APP_SUPABASE_URL || '';
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_KEY || '';
  const siteUrl = process.env.REACT_APP_SITE_URL || '';
  const appName = process.env.REACT_APP_APP_NAME || '';

  const len = (v) => (v ? String(v).length : 0);
  const redact = (v) => {
    if (!v) return '';
    if (v.length <= 8) return '***';
    return `${v.slice(0, 3)}***${v.slice(-3)}`;
  };

  return {
    urlPresent: Boolean(url),
    anonKeyPresent: Boolean(anonKey),
    siteUrlPresent: Boolean(siteUrl),
    appNamePresent: Boolean(appName),
    // masked samples for debugging (safe)
    urlSample: url ? redact(url) : '',
    anonKeyLen: len(anonKey),
  };
}

/**
 * Try selecting from a known public table with minimal cost.
 * Attempts 'profiles' then 'courses'. If both fail due to missing relation,
 * handles gracefully and reports that tables may be absent.
 */
async function tryLightweightSelect(supabase) {
  // helper to attempt a select with minimal overhead
  const attempt = async (table) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .range(0, 0); // one-row range; cheapest
      if (error) {
        // If table missing or permission denied, return informative payload
        return { ok: false, table, error };
      }
      return { ok: true, table, count: Array.isArray(data) ? data.length : 0 };
    } catch (e) {
      return { ok: false, table, error: e };
    }
  };

  const first = await attempt('profiles');
  if (first.ok) return { tried: ['profiles'], ok: true, details: first };

  const second = await attempt('courses');
  if (second.ok) return { tried: ['profiles', 'courses'], ok: true, details: second };

  return {
    tried: ['profiles', 'courses'],
    ok: false,
    details: { first, second },
  };
}

// PUBLIC_INTERFACE
export async function runSupabaseSelfTest() {
  const status = {
    ok: false,
    message: '',
    details: {},
  };

  // 1) Log masked env presence
  const envMask = maskEnv();
  logger.info('Supabase env presence', { env: envMask });

  let supabase;
  try {
    // 2) Initialize client (or get noop from factory if env missing)
    supabase = getSupabaseClient();
  } catch (e) {
    logger.error('Supabase client initialization threw', { error: e?.message });
    status.ok = false;
    status.message = 'Supabase client initialization failed';
    status.details = { error: e?.message, env: envMask };
    return status;
  }

  try {
    // 3) Check session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      logger.warn('Supabase session check warning', { error: sessionError.message });
    }

    // 4) Run lightweight select against known table(s)
    const probe = await tryLightweightSelect(supabase);

    // 5) If both tables absent or access denied, log clearly but handle gracefully
    if (!probe.ok) {
      const firstErrMsg = probe.details?.first?.error?.message || '';
      const secondErrMsg = probe.details?.second?.error?.message || '';
      const bothMissing =
        /relation|not exist/i.test(firstErrMsg) && /relation|not exist/i.test(secondErrMsg);

      const permissionIssues =
        /permission|rpc|policy/i.test(firstErrMsg) && /permission|rpc|policy/i.test(secondErrMsg);

      if (bothMissing) {
        logger.warn('Supabase tables not found during self-check', {
          tried: probe.tried,
          errors: [firstErrMsg, secondErrMsg].filter(Boolean),
        });
        status.ok = envMask.urlPresent && envMask.anonKeyPresent; // envs ok, but schema empty
        status.message = 'Connected; tables not found (create "profiles" or "courses")';
        status.details = {
          sessionPresent: Boolean(session),
          tablesPresent: false,
          tried: probe.tried,
        };
        return status;
      }

      if (permissionIssues) {
        logger.warn('Supabase RLS/permissions might block self-check select', {
          tried: probe.tried,
          errors: [firstErrMsg, secondErrMsg].filter(Boolean),
        });
        status.ok = envMask.urlPresent && envMask.anonKeyPresent;
        status.message = 'Connected; select blocked by RLS/permissions';
        status.details = {
          sessionPresent: Boolean(session),
          selectOk: false,
          tried: probe.tried,
        };
        return status;
      }

      // Generic failure
      logger.warn('Supabase lightweight query failed', {
        tried: probe.tried,
        errors: [firstErrMsg, secondErrMsg].filter(Boolean),
      });
      status.ok = false;
      status.message = 'Supabase query failed (see console for details)';
      status.details = {
        sessionPresent: Boolean(session),
        selectOk: false,
        tried: probe.tried,
      };
      return status;
    }

    // 6) If select succeeded, also ping auth settings as an extra connectivity signal
    const { error: settingsError } = await supabase.auth.getSettings();
    if (settingsError) {
      logger.warn('Auth settings fetch failed; connectivity may still be OK', {
        error: settingsError.message,
      });
    }

    status.ok = true;
    status.message = `OK: session=${Boolean(session) ? 'yes' : 'no'}, table=${probe.details.table}`;
    status.details = {
      sessionPresent: Boolean(session),
      tableProbe: probe.details,
      settingsOk: !settingsError,
    };
    return status;
  } catch (err) {
    logger.error('Supabase self-check failed', { error: err?.message });
    status.ok = false;
    status.message = 'Supabase self-check encountered an error';
    status.details = { error: err?.message, env: envMask };
    return status;
  }
}

export default runSupabaseSelfTest;
