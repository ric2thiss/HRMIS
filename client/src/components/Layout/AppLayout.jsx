import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Hero from "../Hero/Hero";
import LoadingScreen from "../Loading/LoadingScreen";
import BackButton from "../ui/BackButton/BackButton";

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
  
  if (loading) {
    return <LoadingScreen />;
  }

  const role = user?.roles?.[0]?.name;
  const isDashboard = location.pathname === '/dashboard';
  // Show back button on all pages except dashboard
  const shouldShowBack = showBackButton && !isDashboard;

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
          <section className="flex-1 p-6 space-y-6 overflow-y-auto">
            <Hero user={user} />
            {shouldShowBack && <BackButton />}
            {children}
          </section>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;

