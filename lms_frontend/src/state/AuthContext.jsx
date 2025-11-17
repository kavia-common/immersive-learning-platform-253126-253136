import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { logger } from '../lib/logger';

/**
 * AuthContext provides user session state.
 * Placeholder implementation; will integrate Supabase auth later.
 */
export const AuthContext = createContext({
  user: null,
  loading: false,
  // PUBLIC_INTERFACE
  signIn: async () => {},
  // PUBLIC_INTERFACE
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logger.debug('AuthProvider mounted');
  }, []);

  const signIn = async () => {
    setLoading(true);
    try {
      // placeholder sign-in
      setUser({ id: 'demo-user', email: 'user@example.com' });
      logger.info('Signed in (placeholder)', { userId: 'demo-user' });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      setUser(null);
      logger.info('Signed out (placeholder)');
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({ user, loading, signIn, signOut }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access AuthContext */
  return useContext(AuthContext);
}
