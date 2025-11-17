import { useContext, useMemo } from 'react';
import { FeatureFlagContext } from '../state/FeatureFlagContext';

// PUBLIC_INTERFACE
export function useFeatureFlag(flagName) {
  /** Returns boolean for a given feature flag name using FeatureFlagContext. */
  const { flags } = useContext(FeatureFlagContext);
  return useMemo(() => !!flags[flagName], [flags, flagName]);
}

export default useFeatureFlag;
