import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../lib/config';
import { logger } from '../lib/logger';

let client;

/**
 * Build a non-crashing, minimal no-op supabase-like object when envs are missing.
 * This prevents the app from throwing during local dev while clearly logging guidance.
 * NOTE: No credentials are hardcoded; real values must be set via .env
 */
function createNoopClient(maskedStatus) {
  const noop = async () => ({ data: null, error: new Error('Supabase not configured') });
  const noopSync = () => ({ data: null, error: new Error('Supabase not configured') });

  // Small facade for frequently used namespaces to avoid runtime crashes
  return {
    from: () => ({
      select: noop,
      insert: noop,
      upsert: noop,
      update: noop,
      delete: noop,
      eq: () => ({ select: noop, update: noop, delete: noop, maybeSingle: noop, single: noop, order: noop, in: () => ({ select: noop }) }),
      in: () => ({ select: noop }),
      order: () => ({ select: noop }),
      range: () => ({ select: noop }),
      maybeSingle: noop,
      single: noop,
    }),
    storage: {
      from: () => ({
        upload: noop,
        createSignedUrl: noop,
      }),
    },
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSettings: async () => ({ data: null, error: new Error('Supabase not configured') }),
      signInWithPassword: noop,
      signUp: noop,
      signOut: noop,
    },
    channel: () => ({
      on: () => ({ on: () => ({ subscribe: () => ({}) }) }),
      subscribe: () => ({}),
    }),
    removeChannel: noopSync,
    functions: { url: '' },
    rest: { url: '' },
    __noop__: true,
    __status__: maskedStatus,
  };
}

/**
 * Mask env presence in logs without leaking secrets or exact URLs.
 */
function maskEnvPresence(cfg) {
  return {
    urlPresent: Boolean(cfg.supabase?.url),
    anonKeyPresent: Boolean(cfg.supabase?.anonKey),
    env: cfg.env,
  };
}

/**
 * PUBLIC_INTERFACE
 * Returns a singleton Supabase client instance.
 * - If REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY (or REACT_APP_SUPABASE_KEY) are set,
 *   initialize real Supabase with:
 *     - PKCE auth flow
 *     - autoRefreshToken
 *     - persistSession
 *     - detectSessionInUrl
 * - If missing, return a non-crashing no-op client and log masked diagnostics.
 *
 * IMPORTANT:
 * - Do NOT hardcode credentials. Add real values to your .env:
 *     REACT_APP_SUPABASE_URL=...
 *     REACT_APP_SUPABASE_ANON_KEY=...   (or REACT_APP_SUPABASE_KEY=...)
 */
export function getSupabaseClient() {
  /** Returns a singleton Supabase client instance configured with safe fallbacks for local dev. */
  if (client) return client;

  const cfg = getConfig();
  const missing = cfg._validation?.missing || [];
  const masked = maskEnvPresence(cfg);

  if (missing.length > 0) {
    logger.warn('Supabase environment missing; using fallback client', {
      context: 'supabase',
      missing,
      ...masked,
    });
    client = createNoopClient(masked);
    return client;
  }

  try {
    client = createClient(cfg.supabase.url, cfg.supabase.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      global: {
        headers: {
          'X-Client-App': cfg.appName || 'LMS',
        },
      },
    });

    logger.info('Supabase client initialized', {
      context: 'supabase',
      ...masked,
    });
  } catch (e) {
    logger.error('Failed to initialize Supabase client; using fallback', {
      err: e?.message,
      context: 'supabase',
      ...masked,
    });
    client = createNoopClient(masked);
  }
  return client;
}

export default getSupabaseClient;
