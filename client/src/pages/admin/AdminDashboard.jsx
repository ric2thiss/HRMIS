import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dictLogo from '../../asset/DICT logo.svg'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      navigate('/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('isAdmin')
    navigate('/login')
  }

  const handleNotifications = () => {
    console.log('Admin notifications clicked')
  }

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev)
  }

  const goToAdminDashboard = () => {
    navigate('/admin/dashboard')
    setMenuOpen(false)
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
        <div className="hr-brand">
          <img src={dictLogo} alt="DICT logo" className="brand-logo" />
          <span>HRMIS Admin</span>
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
            <div className="hr-profile-name">WELCOME ADMIN</div>
          </div>

          <div className="hr-info-card">
            <div className="hr-info-row">
              <span className="hr-info-label">ROLE:</span>
              <span className="hr-info-value">System Administrator</span>
            </div>
            <div className="hr-info-row">
              <span className="hr-info-label">ACCESS:</span>
              <span className="hr-info-value">Full control</span>
            </div>
          </div>

          <nav className="hr-sidebar-nav">
            {/* reserved for future admin sidebar items */}
          </nav>
        </aside>

        <main className="hr-main">
          <section className="hr-welcome">
            <div className="hr-welcome-left">WELCOME ADMIN</div>
            <div className="hr-welcome-right">
              <div className="hr-leave-header">ADMIN PANEL OVERVIEW</div>
              <div className="hr-leave-columns">
                <div>USERS</div>
                <div>REQUESTS</div>
                <div>SETTINGS</div>
              </div>
            </div>
          </section>

          <section className="hr-tiles">
            <button className="hr-tile" type="button">
              <div className="hr-tile-icon">👥</div>
              <div className="hr-tile-label">MANAGE USERS</div>
            </button>
            <button className="hr-tile" type="button">
              <div className="hr-tile-icon">✅</div>
              <div className="hr-tile-label">APPROVALS</div>
            </button>
            <button className="hr-tile" type="button">
              <div className="hr-tile-icon">⚙</div>
              <div className="hr-tile-label">SYSTEM SETTINGS</div>
            </button>
            <button className="hr-tile" type="button">
              <div className="hr-tile-icon">📊</div>
              <div className="hr-tile-label">REPORTS</div>
            </button>
          </section>
        </main>
      </div>

        {menuOpen && (
          <aside className="hr-menu-drawer">
            <nav className="hr-sidebar-nav">
              <button className="hr-nav-item" type="button" onClick={goToAdminDashboard}>DASHBOARD</button>
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
