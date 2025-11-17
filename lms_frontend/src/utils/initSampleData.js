"use strict";

import { getSupabaseClient } from '../config/supabaseClient';
import { logger } from '../lib/logger';

/**
 * PUBLIC_INTERFACE
 * seedSampleCategories
 * Seeds a minimal set of course categories if the 'categories' table exists.
 * - Safe to run multiple times (checks existing rows).
 * - If the table does not exist or RLS denies, logs a warning and no-ops.
 * - This is intended for local development onboarding only.
 *
 * Note:
 * - No credentials are hardcoded. Ensure your .env has:
 *   REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY (or REACT_APP_SUPABASE_KEY)
 */
export async function seedSampleCategories() {
  const supabase = getSupabaseClient();

  // If running with fallback client, simply warn and exit.
  if (supabase.__noop__) {
    logger.warn('seedSampleCategories skipped: Supabase not configured');
    return { skipped: true, reason: 'supabase not configured' };
  }

  try {
    // Check if categories table is present by attempting a tiny select.
    const probe = await supabase.from('categories').select('id,name').limit(1);
    if (probe && probe.error) {
      logger.warn('Sample data probe failed (likely missing table or denied by RLS)', {
        err: probe.error.message,
      });
      return { skipped: true, reason: 'missing table or denied by RLS' };
    }

    // Ensure we don't duplicate seeds
    const { data: existing, error: listErr } = await supabase
      .from('categories')
      .select('name');

    if (listErr) {
      logger.warn('Unable to list categories; skipping seed', { err: listErr.message });
      return { skipped: true, reason: 'list failed' };
    }

    const have = new Set((existing || []).map((r) => (r.name || '').toLowerCase()));
    const seeds = ['Development', 'Design', 'Data', 'Marketing', 'Business', 'AI/ML']
      .filter((n) => !have.has(n.toLowerCase()))
      .map((name) => ({ name }));

    if (seeds.length === 0) {
      logger.info('Sample categories already present');
      return { ok: true, created: 0 };
    }

    const { data, error } = await supabase.from('categories').insert(seeds).select('id,name');
    if (error) {
      logger.warn('Failed to seed categories', { err: error.message });
      return { skipped: true, reason: 'insert failed' };
    }

    logger.info('Seeded sample categories', { count: data?.length || 0 });
    return { ok: true, created: data?.length || 0 };
  } catch (e) {
    logger.error('seedSampleCategories unexpected error', { err: e?.message });
    return { skipped: true, reason: 'unexpected', error: e?.message };
  }
}

export default seedSampleCategories;
