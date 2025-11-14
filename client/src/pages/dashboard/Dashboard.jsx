import React, { useState } from 'react'

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev)
  }

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev)
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

  return (
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
        <div className="hr-brand">HRMIS</div>
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
            <button className="hr-nav-item active">HOME</button>
            <div className="hr-nav-select">
              <span>MY APPLICATION</span>
              <span className="hr-nav-caret">▾</span>
            </div>
          </nav>
        </aside>

        <main className="hr-main">
          <section className="hr-welcome">
            <div className="hr-welcome-left">WELCOME RICHARLES PAQUIBOT</div>
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
          {/* empty menu sidebar */}
        </aside>
      )}
    </div>
  )
}
