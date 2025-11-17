import { supabase } from '../lib/supabaseClient';
import logger from '../lib/logger';

/**
 * PUBLIC_INTERFACE
 * initializeSampleData seeds essential reference data (categories) and a sample course
 * into the Supabase backend for a clean developer/demo environment.
 *
 * Features:
 * - Idempotent: Safe to run multiple times without duplicating entities
 * - Step tracking: Returns detailed step-by-step results with status and messages
 * - Masking: Logs avoid exposing PII or secrets
 * - Safe checks: Validates tables availability and permissions
 * - Uses existing supabase client export pattern from ../lib/supabaseClient
 *
 * Returns:
 *   {
 *     success: boolean,
 *     steps: Array<{
 *       name: string,
 *       status: 'success' | 'skipped' | 'error',
 *       message: string,
 *       meta?: Record<string, any>
 *     }>,
 *     summary: string
 *   }
 */
// PUBLIC_INTERFACE
export async function initializeSampleData() {
  /** Mask helper to avoid leaking PII or large blobs in logs */
  const mask = (val, maxLen = 128) => {
    try {
      if (val == null) return val;
      if (typeof val === 'string') {
        if (val.length <= maxLen) return val;
        return `${val.slice(0, maxLen)}...(${val.length - maxLen} more)`;
      }
      if (Array.isArray(val)) return `[array(${val.length})]`;
      if (typeof val === 'object') return '{object}';
      return val;
    } catch {
      return '{unserializable}';
    }
  };

  const steps = [];
  const addStep = (name, status, message, meta) => {
    const entry = { name, status, message, ...(meta ? { meta } : {}) };
    steps.push(entry);
    // Use structured logging; do not log sensitive values.
    const logPayload = {
      step: name,
      status,
      message,
      meta: meta ? Object.fromEntries(Object.entries(meta).map(([k, v]) => [k, mask(v)])) : undefined
    };
    if (status === 'error') {
      logger.error('initSampleData step failed', logPayload);
    } else if (status === 'skipped') {
      logger.warn('initSampleData step skipped', logPayload);
    } else {
      logger.info('initSampleData step success', logPayload);
    }
  };

  // Basic environment checks
  try {
    if (!supabase) {
      addStep('env:client', 'error', 'Supabase client not initialized');
      return {
        success: false,
        steps,
        summary: 'Initialization failed: Supabase client not available'
      };
    }
    addStep('env:client', 'success', 'Supabase client OK');
  } catch (e) {
    addStep('env:client', 'error', 'Supabase client threw during check', { error: String(e) });
    return { success: false, steps, summary: 'Initialization failed during client check' };
  }

  // Helper to probe a table via a count(*) without fetching all data.
  const tableAvailable = async (table) => {
    try {
      const { error } = await supabase.from(table).select('id', { count: 'exact', head: true }).limit(1);
      if (error) {
        addStep(`probe:${table}`, 'error', `Table probe failed`, { error: error.message });
        return false;
      }
      addStep(`probe:${table}`, 'success', `Table available`);
      return true;
    } catch (e) {
      addStep(`probe:${table}`, 'error', 'Table probe threw', { error: String(e) });
      return false;
    }
  };

  // Probe required tables
  const requiredTables = ['categories', 'courses'];
  for (const t of requiredTables) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await tableAvailable(t);
    if (!ok) {
      return {
        success: false,
        steps,
        summary: `Initialization failed: required table "${t}" not available or no permission`
      };
    }
  }

  // Seed categories (idempotent)
  const categories = [
    { slug: 'web-development', name: 'Web Development' },
    { slug: 'data-science', name: 'Data Science' },
    { slug: 'design', name: 'Design' },
    { slug: 'business', name: 'Business' },
    { slug: 'ai-ml', name: 'AI & Machine Learning' }
  ];

  try {
    // Fetch existing slugs to avoid duplicates
    const { data: existing, error: fetchErr } = await supabase
      .from('categories')
      .select('id, slug');

    if (fetchErr) {
      addStep('categories:fetch', 'error', 'Failed to fetch existing categories', { error: fetchErr.message });
      return { success: false, steps, summary: 'Initialization failed while reading categories' };
    }
    addStep('categories:fetch', 'success', 'Fetched existing categories', { count: existing?.length ?? 0 });

    const existingSlugs = new Set((existing || []).map((c) => c.slug));
    const toInsert = categories.filter((c) => !existingSlugs.has(c.slug));

    if (toInsert.length === 0) {
      addStep('categories:seed', 'skipped', 'All categories already present');
    } else {
      const { data: ins, error: insErr } = await supabase
        .from('categories')
        .insert(toInsert)
        .select('id, slug');

      if (insErr) {
        addStep('categories:seed', 'error', 'Failed to insert categories', { error: insErr.message, pending: toInsert.map(c => c.slug) });
        return { success: false, steps, summary: 'Initialization failed while seeding categories' };
      }
      addStep('categories:seed', 'success', 'Inserted new categories', { inserted: ins?.length ?? 0 });
    }
  } catch (e) {
    addStep('categories:seed', 'error', 'Unexpected error during category seeding', { error: String(e) });
    return { success: false, steps, summary: 'Initialization failed while seeding categories (exception)' };
  }

  // Seed a sample course (idempotent)
  const sampleCourse = {
    slug: 'intro-to-modern-web',
    title: 'Intro to Modern Web',
    description: 'Learn the fundamentals of modern web development with hands-on examples.',
    // Optional fields if your schema supports them:
    // thumbnail_url, level, language, price, published, etc.
  };

  try {
    // Check if course exists
    const { data: existingCourse, error: courseFetchErr } = await supabase
      .from('courses')
      .select('id, slug')
      .eq('slug', sampleCourse.slug)
      .limit(1)
      .maybeSingle();

    if (courseFetchErr) {
      addStep('course:fetch', 'error', 'Failed to fetch existing course by slug', { error: courseFetchErr.message, slug: sampleCourse.slug });
      return { success: false, steps, summary: 'Initialization failed while reading courses' };
    }

    if (existingCourse) {
      addStep('course:seed', 'skipped', 'Sample course already exists', { slug: sampleCourse.slug, id: existingCourse.id });
    } else {
      const { data: inserted, error: courseInsertErr } = await supabase
        .from('courses')
        .insert(sampleCourse)
        .select('id, slug')
        .maybeSingle();

      if (courseInsertErr) {
        addStep('course:seed', 'error', 'Failed to insert sample course', { error: courseInsertErr.message, slug: sampleCourse.slug });
        return { success: false, steps, summary: 'Initialization failed while inserting sample course' };
      }
      addStep('course:seed', 'success', 'Inserted sample course', { slug: sampleCourse.slug, id: inserted?.id });
    }
  } catch (e) {
    addStep('course:seed', 'error', 'Unexpected error during course seeding', { error: String(e) });
    return { success: false, steps, summary: 'Initialization failed while seeding course (exception)' };
  }

  const success = !steps.some((s) => s.status === 'error');
  const summary = success ? 'Initialization completed successfully' : 'Initialization completed with errors';
  return { success, steps, summary };
}

/**
 * PUBLIC_INTERFACE
 * initSampleData is a convenience alias to initializeSampleData for external imports that
 * might already reference the previous utility name.
 */
// PUBLIC_INTERFACE
export const initSampleData = initializeSampleData;

export default initializeSampleData;
