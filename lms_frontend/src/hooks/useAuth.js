import { useContext } from 'react';
import { AuthContext } from '../state/AuthContext';

// PUBLIC_INTERFACE
export function useAuth() {
  /** Convenience hook to access the full AuthContext value. */
  return useContext(AuthContext);
}

export default useAuth;
