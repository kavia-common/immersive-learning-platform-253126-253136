import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../lib/config';
import { logger } from '../lib/logger';

/**
 * Minimal no-op supabase-like facade to prevent crashes when envs are missing.
 */
function createNoopClient(maskedStatus) {
  const noop = async () => ({ data: null, error: new Error('Supabase not configured') });
  const noopSync = () => ({ data: null, error: new Error('Supabase not configured') });

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

function maskEnvPresence(cfg) {
  return {
    urlPresent: Boolean(cfg.supabase?.url),
    anonKeyPresent: Boolean(cfg.supabase?.anonKey),
    env: cfg.env,
  };
}

/**
 * SupabaseManager provides a singleton client with enhanced diagnostics and a safe fallback.
 * It preserves:
 *  - PKCE flow
 *  - autoRefreshToken
 *  - persistSession
 *  - detectSessionInUrl
 */
// PUBLIC_INTERFACE
export class SupabaseManager {
  /** Manager for creating and accessing the Supabase client with diagnostics and fallbacks. */
  static #instance = null;
  static #client = null;
  static #masked = null;

  static getInstance() {
    if (!SupabaseManager.#instance) {
      SupabaseManager.#instance = new SupabaseManager();
    }
    return SupabaseManager.#instance;
  }

  constructor() {
    const cfg = getConfig();
    SupabaseManager.#masked = maskEnvPresence(cfg);

    const missing = cfg._validation?.missing || [];
    if (missing.length > 0) {
      logger.warn('Supabase env missing; creating fallback client', { context: 'supabase', missing, ...SupabaseManager.#masked });
      SupabaseManager.#client = createNoopClient(SupabaseManager.#masked);
      return;
    }

    try {
      SupabaseManager.#client = createClient(cfg.supabase.url, cfg.supabase.anonKey, {
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
      logger.info('Supabase client initialized (manager)', { context: 'supabase', ...SupabaseManager.#masked });
    } catch (e) {
      logger.error('Supabase client init failed; using fallback', { context: 'supabase', err: e?.message, ...SupabaseManager.#masked });
      SupabaseManager.#client = createNoopClient(SupabaseManager.#masked);
    }
  }

  // PUBLIC_INTERFACE
  getClient() {
    /** Get the current supabase client (real or fallback). */
    return SupabaseManager.#client;
  }

  // PUBLIC_INTERFACE
  getMaskedStatus() {
    /** Get masked environment presence for safe diagnostics logging. */
    return SupabaseManager.#masked;
  }
}

// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** Compatibility method to retrieve the client from SupabaseManager. */
  return SupabaseManager.getInstance().getClient();
}

export default getSupabaseClient;
