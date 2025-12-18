import { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGlobalPrefetch } from '../hooks/useGlobalPrefetch';

/**
 * GlobalPrefetch component
 * Automatically prefetches all data after user logs in
 * Runs in the background without blocking UI
 */
function GlobalPrefetch() {
  const { user } = useAuth();
  const { prefetchAllData } = useGlobalPrefetch();
  const hasPrefetched = useRef(false);

  useEffect(() => {
    // Only prefetch once per session when user is logged in
    if (user && !hasPrefetched.current) {
      console.log('🔄 Initiating background data prefetch...');
      hasPrefetched.current = true;
      
      // Run prefetch in background (non-blocking)
      setTimeout(() => {
        prefetchAllData(user);
      }, 1000); // Small delay to not interfere with initial page load
    }

    // Reset flag when user logs out
    if (!user && hasPrefetched.current) {
      hasPrefetched.current = false;
      console.log('🔄 Prefetch flag reset (user logged out)');
    }
  }, [user, prefetchAllData]);

  // This component doesn't render anything
  return null;
}

export default GlobalPrefetch;

