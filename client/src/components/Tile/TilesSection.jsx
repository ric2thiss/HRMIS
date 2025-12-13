import React, { useState, useEffect } from "react";
import Tile from "./Tile";
import { tilesConfig } from "./tilesConfig";
import { hasSystemSettingsAccess } from "../../utils/userHelpers";
import { checkIfApprover } from "../../api/master-lists/approvalNames";

function TilesSection({ role, user }) {
  const [isApprover, setIsApprover] = useState(false);
  const [loadingApprover, setLoadingApprover] = useState(true);

  useEffect(() => {
    const checkApproverStatus = async () => {
      try {
        const approverStatus = await checkIfApprover();
        setIsApprover(approverStatus);
      } catch (err) {
        console.error('Error checking approver status:', err);
        setIsApprover(false);
      } finally {
        setLoadingApprover(false);
      }
    };

    if (user) {
      checkApproverStatus();
    }
  }, [user]);

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
