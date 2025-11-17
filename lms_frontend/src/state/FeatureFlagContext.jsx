import React, { createContext, useMemo, useState } from 'react';
import { getFeatureFlags, setFeatureFlags } from '../lib/featureFlags';

export const FeatureFlagContext = createContext({
  flags: {},
  // PUBLIC_INTERFACE
  updateFlags: () => {},
});

export function FeatureFlagProvider({ children }) {
  const [flags, setFlags] = useState(getFeatureFlags());

  const updateFlags = (next) => {
    const merged = setFeatureFlags(next);
    setFlags(merged);
  };

  const value = useMemo(() => ({ flags, updateFlags }), [flags]);
  return <FeatureFlagContext.Provider value={value}>{children}</FeatureFlagContext.Provider>;
}
