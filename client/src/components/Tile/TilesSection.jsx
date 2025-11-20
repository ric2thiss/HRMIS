import React from 'react'
import Tile from "./Tile";

function TilesSection({role}) {
  return (
    // UPDATED: Changed from flex to responsive grid layout (1, 2, or 3 columns)
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> 
      
      {/* My Approval (HR only) - Note: Fixed SVG attributes to camelCase */}
      {role === "hr" ? (
        <Tile
        title = "My Approval" 
        icon = {<svg 
                      className="w-10 h-10 text-blue-600" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2.5" // Corrected attribute name
                    >
                      <path d="M5 13l4 4L19 7"></path>
                  </svg>}
        link = "/my-approval"
      />
      ) : null}

      {/* Manage Employee (HR only) */}
      {role === "hr" ? (
        <Tile
          title = "Manage Employee" 
          icon = {<svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-10 h-10 text-blue-600"
                  >
                    {/* The main/primary person icon */}
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    {/* The secondary/group person icon (shifted to the right/back) */}
                    <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  }
          link = "/manage-employees"
        />
      ) : null}
      

      {/* My PDS */}
      <Tile
        title = "My PDS" 
        icon = {<svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-10 h-10 text-blue-600"
                >
                  <path d="M22 10L12 5 2 10l10 5 10-5z" />
                  <path d="M6 12v5c0 .8.6 1.5 1.4 1.8 1.5.5 3.1.7 4.6.7s3.1-.2 4.6-.7c.8-.3 1.4-1 1.4-1.8v-5" />
                </svg>}
        link = "/my-pds"
      />

      {/* My DTR */}
      <Tile
        title = "My DTR" 
        icon = {<svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-10 h-10 text-blue-600"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="7" y1="8" x2="17" y2="8" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="7" y1="16" x2="13" y2="16" />
                </svg>
                }
        link = "/my-dtr"
      />

      {/* Import Attendance (HR only) */}
      {role === "hr" ? (
        <Tile
          title = "Import Attendance" 
          icon = {<svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-10 h-10 text-blue-600"
                  >
                    {/* 1. Box / Tray (The ground for the file to be uploaded from) */}
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    {/* 2. Arrow shaft (pointing up) */}
                    <line x1="12" y1="12" x2="12" y2="4" />
                    {/* 3. Arrowhead (wings pointing up) */}
                    <polyline points="8 8 12 4 16 8" />
                  </svg>
                  }
          link = "/import-attendance" // Adjusted link based on title
        />
      ) : null}

      {/* Manage Leave Application (HR only) */}
      {role === "hr" ? (<Tile
        title = "Manage Leave Application " 
        icon = {<svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-10 h-10 text-blue-600"
                >
                  {/* Calendar Base */}
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  
                  {/* Approval Checkmark inside the calendar */}
                  <polyline points="9 16 12 19 18 13" />
                </svg>
                }
        link = "/manage-leave" // Adjusted link based on title
      />) : null}

      {/* My Leave */}
      <Tile
        title = "My Leave " 
        icon = {<svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-10 h-10 text-blue-600"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="M10 15h6" />
                  <path d="M13 12l3 3-3 3" />
                </svg>
                }
        link = "/my-leave"
      />


      {/* Manage Account */}
      {role === "admin" ? (
        <Tile
        title = "Manage Account" 
        icon = {<svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-10 h-10 text-blue-600"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="M10 15h6" />
                  <path d="M13 12l3 3-3 3" />
                </svg>
                }
        link = "/manage-accounts"
      />
      ) : null}
    </div>
  )
}

export default TilesSection