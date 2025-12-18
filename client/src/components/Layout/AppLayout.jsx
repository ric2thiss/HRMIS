import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Hero from "../Hero/Hero";
import LoadingScreen from "../Loading/LoadingScreen";
import BackButton from "../ui/BackButton/BackButton";
import AnnouncementBanner from "../Announcement/AnnouncementBanner";
import { getUserRole } from "../../utils/userHelpers";
import { useModuleTracking } from "../../hooks/useModuleTracking";

/**
 * Shared layout component for authenticated pages
 * @param {Object} props
 * @param {Object} props.user - Current user object
 * @param {Function} props.logout - Logout function
 * @param {boolean} props.loading - Loading state
 * @param {string} props.title - Page title
 * @param {React.ReactNode} props.children - Page content
 * @param {boolean} props.showBackButton - Whether to show back button (default: true, hidden on dashboard)
 */
function AppLayout({ user, logout, loading, title, children, showBackButton = true }) {
  const location = useLocation();
  
  // Track module access
  useModuleTracking();
  
  if (loading) {
    return <LoadingScreen />;
  }

  const role = getUserRole(user);
  const isDashboard = location.pathname === '/dashboard';
  const isHrDashboard = location.pathname === '/hr/dashboard';
  const isAdminDashboard = location.pathname === '/admin/dashboard';
  // Show back button on all pages except dashboard
  const shouldShowBack = showBackButton && !isDashboard && !isHrDashboard && !isAdminDashboard;

  // const isDashboardForHR = location.pathname !== "/hr/dashboard" && location.pathname !== "/admin/dashboard";
  

  return (
    <div className="bg-gray-100 font-sans">
      <Helmet>
        <title>{title ? `HRMIS - ${title}` : 'HRMIS'}</title>
      </Helmet>

      <input type="checkbox" id="menu-toggle" className="hidden" />

      <div className="flex flex-col h-screen" id="app-container">
        <Header logout={logout} user={user} />

        <main className="flex flex-1 overflow-hidden">
          <Sidebar user={user} role={role} />
          <section className={`flex-1 p-6 overflow-y-auto ${isAdminDashboard || isHrDashboard ? '' : 'space-y-6'}`}>
            {isDashboard && (
              <>
                <AnnouncementBanner />
                <Hero user={user} />
              </>
            )}
            {/* <Hero user={user} /> */}
            {shouldShowBack && (
              <div className={isAdminDashboard ? 'mb-0' : ''}>
                <BackButton />
              </div>
            )}
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;

