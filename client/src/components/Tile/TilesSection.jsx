import React, { useEffect, useRef } from "react";
import Tile from "./Tile";
import { tilesConfig } from "./tilesConfig";
import { hasSystemSettingsAccess } from "../../utils/userHelpers";
import { useIsApprover, usePrefetchApprovalData } from "../../hooks/useApprovalData";

function TilesSection({ role, user }) {
  // Use React Query hook for approver status (with 5-minute caching)
  const { data: isApprover = false, isLoading: loadingApprover } = useIsApprover(user);
  const { prefetchApprovalData } = usePrefetchApprovalData();
  const hasPrefetched = useRef(false);

  // Reset prefetch flag when user changes (e.g., after logout/login)
  useEffect(() => {
    hasPrefetched.current = false;
  }, [user?.id]);

  // Prefetch approval data on first load after login for approvers
  // This ensures data is cached for the my-approval tile (5-minute cache duration)
  useEffect(() => {
    if (user && !hasPrefetched.current) {
      // For HR/Admin, prefetch immediately
      if (role === 'hr' || role === 'admin') {
        prefetchApprovalData(user);
        hasPrefetched.current = true;
      } 
      // For regular approvers, wait for approver status check to complete
      else if (!loadingApprover && isApprover) {
        prefetchApprovalData(user);
        hasPrefetched.current = true;
      }
    }
  }, [user, isApprover, role, loadingApprover, prefetchApprovalData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-wrap">
      {tilesConfig
        .filter(tile => {
          // For System Settings, check permission instead of just role
          if (tile.title === "System Settings") {
            return hasSystemSettingsAccess(user);
          }
          // For My Approval, show if user is HR or if user is an approver
          if (tile.title === "My Approval") {
            return tile.roles.includes(role) || isApprover;
          }
          return tile.roles.includes(role);
        })
        .map(tile => (
          <Tile 
            key={tile.title}
            title={tile.title}
            icon={tile.icon}
            link={tile.link}
          />
        ))
      }
    </div>
  );
}

export default TilesSection;
