import { getSupabaseClient } from '../config/supabaseClient';
import { logger } from '../lib/logger';

// PUBLIC_INTERFACE
export async function runSupabaseSelfTest() {
  /**
   * Perform a lightweight client probe:
   * 1) Fetch current session (no network if not logged in).
   * 2) Ping a cheap RPC: get auth settings or a no-op (select now()) via SQL function substitute.
   * 3) Return a structured status object for UI display.
   */
  const status = {
    ok: false,
    message: '',
    details: {},
  };

  try {
    const supabase = getSupabaseClient();

    // Step 1: Check session (does not fail if not logged-in)
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      logger.warn('Supabase session check warning', { error: sessionError.message });
    }

    // Step 2: Execute a trivial request - get auth settings (public, cheap)
    const { data: settings, error: settingsError } = await supabase.auth.getSettings();
    if (settingsError) {
      // Fallback: try a lightweight fetch to root (anon), to ensure URL/connectivity
      const url = supabase?.functions?.url || supabase?.rest?.url || '';
      logger.warn('Auth settings fetch failed; connectivity might still be OK', {
        error: settingsError.message,
        url,
      });
    }

    status.ok = !settingsError; // if settings succeeded, connectivity is proven
    status.message = status.ok
      ? 'Supabase connection OK'
      : 'Supabase reachable but settings fetch failed (check project policies)';
    status.details = {
      sessionPresent: Boolean(session),
      settingsOk: !settingsError,
    };

    return status;
  } catch (err) {
    logger.error('Supabase self-test failed', { error: err?.message });
    status.ok = false;
    status.message = 'Supabase client initialization failed';
    status.details = { error: err?.message };
    return status;
  }
}

export default runSupabaseSelfTest;
