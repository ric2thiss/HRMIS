import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dictLogo from '../../asset/DICT logo.svg'

export default function Dashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev)
  }

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev)
  }

  const goToDashboard = () => {
    navigate('/dashboard')
    setMenuOpen(false)
  }

  const goToProfileSettings = () => {
    navigate('/dashboard/profile')
    setMenuOpen(false)
  }

  const handleMyApproval = () => {
    console.log('My Approval clicked')
  }

  const handleUserManual = () => {
    console.log('User Manual clicked')
  }

  const handlePds = () => {
    console.log('PDS clicked')
  }

  const handleDtras = () => {
    console.log('DTRAS clicked')
  }

  const handleLeave = () => {
    console.log('Leave clicked')
  }

  const handleDtr = () => {
    console.log('DTR clicked')
  }

  const handleSettings = () => {
    console.log('Settings clicked')
  }

  const handleServicesRecord = () => {
    console.log('Services Record clicked')
  }

  const handleNotifications = () => {
    console.log('Notifications clicked')
  }

  const handleLogout = () => {
    localStorage.removeItem('isAdmin')
    navigate('/login')
  }

  return (
    <>
      <div className={`hr-dashboard${sidebarOpen ? ' hr-dashboard--sidebar-open' : ''}`}>
        <header className="hr-topbar">
        <button
          className="hr-menu-button"
          aria-label="Toggle navigation"
          type="button"
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className="hr-brand" ><style>
          
        </style>
          <img src={dictLogo} alt="DICT logo" className="brand-logo" />
          <span>HRMIS</span>
        </div>
        <button className="hr-bell" type="button" onClick={handleNotifications} aria-label="Notifications">
          🔔
        </button>
        <button className="button secondary" type="button" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <div className="hr-layout">
        <aside className={`hr-sidebar${sidebarOpen ? ' hr-sidebar--open' : ''}`}>
          <div className="hr-profile">
            <div className="hr-avatar-circle" />
            <div className="hr-profile-name">WELCOME RICHARLES PAQUIBOT</div>
          </div>

          <div className="hr-info-card">
            <div className="hr-info-row">
              <span className="hr-info-label">EMPLOYEE ID:</span>
              <span className="hr-info-value">231564651</span>
            </div>
            <div className="hr-info-row">
              <span className="hr-info-label">EMAIL ADDRESS:</span>
              <span className="hr-info-value">richarlespaquibot@gmail.com</span>
            </div>
            <div className="hr-info-row">
              <span className="hr-info-label">ROLES:</span>
              <span className="hr-info-value">Employee(ILCDB)</span>
            </div>
            <div className="hr-info-row">
              <span className="hr-info-label">OFFICE:</span>
              <span className="hr-info-value">REGION13</span>
            </div>
          </div>

          <nav className="hr-sidebar-nav">
            {/* sidebar items moved into burger dashboard menu */}
          </nav>
        </aside>

        <main className="hr-main">
          <section className="hr-welcome">
            <div className="hr-welcome-left">WELCOME! RICHARLES PAQUIBOT</div>
            <div className="hr-welcome-right">
              <div className="hr-leave-header">LEAVE CREDITS AS OF 11/12/2004</div>
              <div className="hr-leave-columns">
                <div>SICK LEAVE</div>
                <div>VACATION LEAVE</div>
                <div>SPECIAL LEAVE</div>
              </div>
            </div>
          </section>

          <section className="hr-tiles">
            <button className="hr-tile green" type="button" onClick={handleMyApproval}>
              <div className="hr-tile-icon">✔</div>
              <div className="hr-tile-label">MY APPROVAL</div>
            </button>
            <button className="hr-tile" type="button" onClick={handleUserManual}>
              <div className="hr-tile-icon">📘</div>
              <div className="hr-tile-label">USER MANUAL</div>
            </button>
            <button className="hr-tile" type="button" onClick={handlePds}>
              <div className="hr-tile-icon">🎓</div>
              <div className="hr-tile-label">PDS</div>
            </button>
            <button className="hr-tile" type="button" onClick={handleDtras}>
              <div className="hr-tile-icon">🗓</div>
              <div className="hr-tile-label">DTRAS</div>
            </button>
            <button className="hr-tile" type="button" onClick={handleLeave}>
              <div className="hr-tile-icon">🚪</div>
              <div className="hr-tile-label">LEAVE</div>
            </button>
            <button className="hr-tile" type="button" onClick={handleDtr}>
              <div className="hr-tile-icon">⏱</div>
              <div className="hr-tile-label">DTR</div>
            </button>
            <button className="hr-tile" type="button" onClick={handleSettings}>
              <div className="hr-tile-icon">⚙</div>
              <div className="hr-tile-label">SETTINGS</div>
            </button>
            <button className="hr-tile" type="button" onClick={handleServicesRecord}>
              <div className="hr-tile-icon">📋</div>
              <div className="hr-tile-label">SERVICES RECORD</div>
            </button>
            <button className="hr-tile" type="button" onClick={handleMyApproval}>
              <div className="hr-tile-icon">👍</div>
              <div className="hr-tile-label">MY APPROVAL</div>
            </button>
          </section>
        </main>
      </div>

        {menuOpen && (
          <aside className="hr-menu-drawer">
            <nav className="hr-sidebar-nav">
              <button className="hr-nav-item" type="button" onClick={goToDashboard}>DASHBOARD</button>
              <button className="hr-nav-item" type="button" onClick={goToProfileSettings}>MY APPLICATION</button>
              <div className="hr-nav-select" onClick={goToProfileSettings}>
                <span>Profile Settings</span>
                <span className="hr-nav-caret">▾</span>
              </div>
            </nav>
          </aside>
        )}
      </div>

      <footer className="footer">
        <div className="container footer-inner">
          <small> {new Date().getFullYear()} HRMIS. All rights reserved.</small>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </>
  )
}
