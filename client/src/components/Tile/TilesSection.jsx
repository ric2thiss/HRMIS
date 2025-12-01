import React from "react";
import Tile from "./Tile";
import { tilesConfig } from "./tilesConfig";
import { hasSystemSettingsAccess } from "../../utils/userHelpers";

function TilesSection({ role, user }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-wrap">
      {tilesConfig
        .filter(tile => {
          // For System Settings, check permission instead of just role
          if (tile.title === "System Settings") {
            return hasSystemSettingsAccess(user);
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
