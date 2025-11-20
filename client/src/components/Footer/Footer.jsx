import React from 'react'

function Footer() {
  return (
    <>
    <footer className="bg-gray-800 text-gray-400 text-sm py-6">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="mb-3 sm:mb-0">&copy; {new Date().getFullYear()} HRMIS. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Footer