import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { logger } from '../lib/logger';
import { getSupabaseClient } from '../config/supabaseClient';
import { getConfig } from '../lib/config';
import { useUI } from './UIContext';

/**
 * AuthContext provides user session state, Supabase session sync, and helpers.
 * It supports email/password sign in/up, password reset, email verification,
 * and basic role-based authorization via user metadata.
 */
export const AuthContext = createContext({
  user: null,
  session: null,
  loading: false,
  roles: [],
  // PUBLIC_INTERFACE
  signIn: async (_email, _password) => {},
  // PUBLIC_INTERFACE
  signUp: async (_email, _password) => {},
  // PUBLIC_INTERFACE
  signOut: async () => {},
  // PUBLIC_INTERFACE
  requestPasswordReset: async (_email) => {},
  // PUBLIC_INTERFACE
  refreshSession: async () => {},
  // PUBLIC_INTERFACE
  hasRole: (_role) => false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useUI();

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Initial session fetch
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        logger.error('supabase.getSession failed', { err: error.message });
      }
      setSession(data?.session || null);
      setUser(data?.session?.user || null);
      setLoading(false);
    });

    // Subscribe to auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      logger.info('Auth state changed', { event });
      setSession(sess);
      setUser(sess?.user || null);
    });

    return () => {
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        logger.warn('Sign in failed', { err: error.message });
        addToast({ title: 'Sign in failed', message: 'Please check your credentials and try again.' });
        return { error };
      }
      setSession(data?.session || null);
      setUser(data?.user || data?.session?.user || null);
      addToast({ title: 'Welcome back', message: 'You are now signed in.' });
      return { data };
    } catch (e) {
      logger.error('Unexpected sign in error', { err: e?.message });
      addToast({ title: 'Error', message: 'Unable to sign in right now.' });
      return { error: e };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password) => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const cfg = getConfig();
      const redirectTo = (cfg.frontendUrl || window.location.origin) + '/verify-email';
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) {
        logger.warn('Sign up failed', { err: error.message });
        addToast({ title: 'Sign up failed', message: error.message || 'Please try again.' });
        return { error };
      }
      // On sign up, Supabase may or may not sign the user in depending on config.
      setSession(data?.session || null);
      setUser(data?.user || data?.session?.user || null);
      addToast({
        title: 'Verify your email',
        message: 'We sent a verification link. Please check your inbox.',
      });
      return { data };
    } catch (e) {
      logger.error('Unexpected sign up error', { err: e?.message });
      addToast({ title: 'Error', message: 'Unable to sign up right now.' });
      return { error: e };
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email) => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const cfg = getConfig();
      const redirectTo = (cfg.frontendUrl || window.location.origin) + '/signin';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) {
        logger.warn('Password reset request failed', { err: error.message });
        addToast({ title: 'Request failed', message: 'Could not send reset link. Try again.' });
        return { error };
      }
      addToast({
        title: 'Reset link sent',
        message: 'Check your email for instructions to reset your password.',
      });
      return { ok: true };
    } catch (e) {
      logger.error('Unexpected password reset error', { err: e?.message });
      addToast({ title: 'Error', message: 'Unable to request password reset.' });
      return { error: e };
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        logger.warn('Refresh session failed', { err: error.message });
        return { error };
      }
      setSession(data?.session || null);
      setUser(data?.session?.user || null);
      return { data };
    } catch (e) {
      logger.error('Unexpected refresh session error', { err: e?.message });
      return { error: e };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.warn('Sign out error', { err: error.message });
        addToast({ title: 'Sign out failed', message: 'Please try again.' });
        return { error };
      }
      setSession(null);
      setUser(null);
      addToast({ title: 'Signed out', message: 'You have been signed out.' });
      return { ok: true };
    } catch (e) {
      logger.error('Unexpected sign out error', { err: e?.message });
      addToast({ title: 'Error', message: 'Unable to sign out right now.' });
      return { error: e };
    } finally {
      setLoading(false);
    }
  };

  const roles = useMemo(() => {
    const meta = user?.user_metadata || user?.app_metadata || {};
    const r = meta?.roles || meta?.role || [];
    if (Array.isArray(r)) return r;
    if (typeof r === 'string') return [r];
    return [];
  }, [user]);

  const hasRole = (role) => roles.includes(role);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      roles,
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      refreshSession,
      hasRole,
    }),
    [user, session, loading, roles]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access AuthContext */
  return useContext(AuthContext);
}
