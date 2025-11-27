import React from "react";
import Tile from "./Tile";
import { tilesConfig } from "./tilesConfig";

function TilesSection({ role }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tilesConfig
        .filter(tile => tile.roles.includes(role))
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
