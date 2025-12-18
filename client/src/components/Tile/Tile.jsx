import React from 'react'
import './Tile.css'
import { Link } from 'react-router-dom'
import { useGlobalPrefetch } from '../../hooks/useGlobalPrefetch'
import { useAuth } from '../../hooks/useAuth'

function Tile({ title, icon, link }) {
  const { prefetchModule } = useGlobalPrefetch();
  const { user } = useAuth();
  
  const handleMouseEnter = () => {
    // Extract module name from route
    const moduleName = link.replace('/', '');
    
    // Prefetch data for the module
    if (moduleName === 'manage-pds' || moduleName === 'my-approval') {
      prefetchModule(moduleName, user);
    }
  };
  
  return (
    // FIX: Removed fixed dimensions (w-32 h-32) to allow the tile to fill the grid column.
    <Link 
      to={link} 
      className="w-full"
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
    > 
      <div
        className="flex flex-col justify-center items-center 
                  bg-white p-6 rounded-xl shadow-lg border 
                  border-gray-100 transition-all duration-300 
                  hover:shadow-xl w-full h-full min-h-[150px] // Added min-height for better visual size
                  icon-box cursor-pointer"
      >
        <div className="mb-2">
          {icon}
        </div>
        <p className="text-sm font-bold text-gray-700 text-center uppercase tracking-wide">
          {title}
        </p>
      </div>
    </Link>
  )
}

export default Tile