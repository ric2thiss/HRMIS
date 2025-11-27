import React from 'react'

function ImportAttendance() {
  return (
    <svg
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
  )
}

export default ImportAttendance