import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../lib/config';
import { logger } from '../lib/logger';

let client;

/**
 * Ensure required env vars exist and return sanitized values.
 * Does not log secrets. Throws with clear guidance when missing.
 */
function validateEnv() {
  const cfg = getConfig();
  const missing = cfg._validation?.missing || [];
  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error('[Supabase] ' + msg, { context: 'supabase' });
    throw new Error(msg);
  }
  return cfg;
}

/**
 * Configure Supabase auth settings:
 * - PKCE: enabled for OAuth flows
 * - autoRefreshToken: refreshes session tokens in the background
 * - persistSession: stores session in local storage
 * - detectSessionInUrl: parses OAuth callback URLs
 * - flowType: 'pkce'
 */
// PUBLIC_INTERFACE
export function getSupabaseClient() {
  /** Returns a singleton Supabase client instance configured with best practices. */
  if (client) return client;

  const cfg = validateEnv();

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
      urlPresent: Boolean(cfg.supabase.url),
      anonKeyPresent: Boolean(cfg.supabase.anonKey),
    });
  } catch (e) {
    logger.error('Failed to initialize Supabase client', {
      err: e?.message,
      context: 'supabase',
    });
    throw e;
  }
  return client;
}

export default getSupabaseClient;
