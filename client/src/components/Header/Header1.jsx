import React from 'react'
import dictLogo from '../../asset/DICT logo.svg' // adjust path as needed
import { Link } from 'react-router-dom'

function Header({ toggleMenu, user, handleNotifications, logout }) {
  return (
    <header className="hr-topbar">
      <button
        className="hr-menu-button"
        aria-label="Toggle navigation"
        type="button"
        onClick={toggleMenu}
      >
        <span></span><span></span><span></span>
      </button>

      <div className="hr-brand">
        <img src={dictLogo} alt="DICT logo" className="brand-logo" />
        <span>HRMIS</span>
      </div>
      <button
        className="hr-bell"
        type="button"
        onClick={handleNotifications}
        aria-label="Notifications"
      >
        🔔
      </button>
      {user ? (
        <div>
          
          <button
            className="button secondary"
            type="button"
            onClick={logout}
          >
              Log out
          </button>
        </div>
      ) : (
        <Link className="button secondary" to="/login">
          Login
        </Link>
      )}
      
    </header>
  )
}

export default Header
