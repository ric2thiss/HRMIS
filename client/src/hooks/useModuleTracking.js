import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { logModuleAccess } from '../api/modules/moduleAccess';

// Map routes to module names
const routeToModuleMap = {
    '/my-leave': 'Leave',
    '/manage-leave': 'Leave',
    '/my-dtr': 'DTRAS',
    '/import-attendance': 'DTRAS',
    '/my-pds': 'PDS',
    '/manage-pds': 'PDS',
    '/my-approval': 'Approval',
    '/manage-employees': 'Manage Employees',
    '/manage-accounts': 'Manage Accounts',
    '/system-settings': 'System Settings',
    '/master-lists': 'Master Lists',
    '/profile': 'Profile',
    '/dashboard': 'Dashboard',
    '/hr/dashboard': 'HR Dashboard',
    '/admin/dashboard': 'Admin Dashboard',
};

/**
 * Hook to track module access when user navigates to different routes
 */
export const useModuleTracking = () => {
    const location = useLocation();
    const { user } = useAuth();
    const trackedRoutes = useRef(new Map());
    const lastTrackedRoute = useRef(null);

    useEffect(() => {
        // Only track if user is logged in
        if (!user) {
            return;
        }

        const pathname = location.pathname;
        const moduleName = routeToModuleMap[pathname];

        // Only track if:
        // 1. This route is in our module map
        // 2. We haven't tracked this route yet (or it's been more than a minute since last track)
        // 3. It's different from the last tracked route
        if (moduleName && pathname !== lastTrackedRoute.current) {
            // Check if we should track this access (avoid duplicate tracking)
            const now = Date.now();
            const lastTrackedTime = trackedRoutes.current.get(pathname);
            
            // Track if:
            // - First time accessing this route, OR
            // - Last tracked more than 5 minutes ago (to allow multiple tracking per day)
            if (!lastTrackedTime || (now - lastTrackedTime) > 5 * 60 * 1000) {
                // Log module access (fire and forget - don't block UI)
                logModuleAccess(moduleName, pathname).catch(err => {
                    // Silently fail - don't show errors to user for tracking
                    console.debug('Failed to log module access:', err);
                });

                // Update tracking info
                trackedRoutes.current.set(pathname, now);
                lastTrackedRoute.current = pathname;
            }
        }
    }, [location.pathname, user]);
};

