import { useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { logger } from '../lib/logger';

/**
 * PUBLIC_INTERFACE
 * useAnalytics
 * A lightweight analytics hook that emits structured events to the console and (optionally) a stub HTTP endpoint.
 *
 * Events supported:
 * - page_view
 * - course_enroll
 * - lesson_complete
 *
 * Usage:
 * const { trackEvent, trackPageView } = useAnalytics();
 * trackPageView({ page: '/dashboard' });
 * trackEvent('course_enroll', { courseId: 'abc123' });
 */
export function useAnalytics() {
  const { user } = useAuth();

  // Read endpoint from env configuration (optional)
  const endpoint = process.env.REACT_APP_API_BASE
    ? `${process.env.REACT_APP_API_BASE}/analytics/events`
    : null;

  // Helper to safely remove PII from payload
  const sanitize = (payload = {}) => {
    const clone = { ...payload };
    // NEVER log tokens, emails, or secrets
    delete clone.token;
    delete clone.password;
    delete clone.secret;
    delete clone.accessToken;
    return clone;
  };

  // Emit to console with consistent structure
  const emitConsole = (eventName, payload) => {
    const event = {
      timestamp: new Date().toISOString(),
      userId: user?.id || null,
      event: eventName,
      metadata: sanitize(payload),
    };
    // Use project logger if available, else console.log
    try {
      if (logger && typeof logger.info === 'function') {
        logger.info('[analytics_event]', event);
      } else {
        // eslint-disable-next-line no-console
        console.log('[analytics_event]', event);
      }
    } catch {
      // eslint-disable-next-line no-console
      console.log('[analytics_event]', event);
    }
  };

  // Optional network emission (stubbed)
  const emitNetwork = async (eventName, payload) => {
    if (!endpoint) return; // skip network if no endpoint configured
    const body = {
      timestamp: new Date().toISOString(),
      userId: user?.id || null,
      event: eventName,
      metadata: sanitize(payload),
    };
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Do not include credentials or tokens here to avoid leaking secrets
        body: JSON.stringify(body),
        keepalive: true, // allow send on unload
      });
    } catch (e) {
      // Best-effort: do not throw; log internally for debugging
      try {
        if (logger && typeof logger.warn === 'function') {
          logger.warn('Analytics network emit failed', { error: String(e) });
        } else {
          // eslint-disable-next-line no-console
          console.warn('Analytics network emit failed', e);
        }
      } catch {
        // ignore
      }
    }
  };

  const trackEvent = useMemo(
    () =>
      /**
       * PUBLIC_INTERFACE
       * trackEvent
       * Emit an analytics event with optional payload metadata.
       * @param {('page_view'|'course_enroll'|'lesson_complete'|string)} eventName
       * @param {Object} payload
       */
      (eventName, payload = {}) => {
        emitConsole(eventName, payload);
        // Fire-and-forget network
        emitNetwork(eventName, payload);
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, endpoint]
  );

  // PUBLIC_INTERFACE
  // trackPageView: convenience wrapper to send page_view with common metadata
  const trackPageView = (payload = {}) => {
    trackEvent('page_view', payload);
  };

  // Example: can auto-fire route changes from outside using useEffect if needed
  useEffect(() => {
    // No-op: page components can call trackPageView explicitly for clarity.
  }, []);

  return { trackEvent, trackPageView };
}

export default useAnalytics;
