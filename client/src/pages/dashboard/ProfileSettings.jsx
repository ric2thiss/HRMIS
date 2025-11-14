import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dictLogo from '../../asset/DICT logo.svg'

export default function ProfileSettings() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [fullName, setFullName] = useState('RICHARLES PAQUIBOT')
  const [email, setEmail] = useState('richarlespaquibot@gmail.com')
  const [office, setOffice] = useState('REGION13')
  const [username, setUsername] = useState('Benz')
  const [password, setPassword] = useState('12345')

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

  const handleNotifications = () => {
    console.log('Notifications clicked')
  }

  const handleLogout = () => {
    localStorage.removeItem('isAdmin')
    navigate('/login')
  }

  const handlePersonalSubmit = (e) => {
    e.preventDefault()
    console.log('Updated personal info:', { fullName, email, office })
  }

  const handleAccountSubmit = (e) => {
    e.preventDefault()
    console.log('Updated account settings:', { username, password })
  }

  return (
    <>
      <div className="hr-dashboard">
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
          <aside className="hr-sidebar">
            <div className="hr-profile">
              <div className="hr-avatar-circle" />
              <div className="hr-profile-name">{fullName}</div>
            </div>
          </aside>

          <main className="hr-main">
          <section className="hr-welcome">
            <div className="hr-welcome-left">PERSONAL INFORMATION</div>
            <div className="hr-welcome-right">
              <div className="hr-leave-header">Update your basic details</div>
            </div>
          </section>

          <section className="hr-tiles">
            <form className="hr-tile" onSubmit={handlePersonalSubmit}>
              <div className="hr-tile-label">Personal details</div>
              <div style={{ width: '100%', display: 'grid', gap: 8 }}>
                <label>
                  Full name
                  <input
                    className="input"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>
                <label>
                  Email address
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label>
                  Office
                  <input
                    className="input"
                    type="text"
                    value={office}
                    onChange={(e) => setOffice(e.target.value)}
                  />
                </label>
                <button className="button" type="submit">Save personal info</button>
              </div>
            </form>

            <form className="hr-tile" onSubmit={handleAccountSubmit}>
              <div className="hr-tile-label">Account settings</div>
              <div style={{ width: '100%', display: 'grid', gap: 8 }}>
                <label>
                  Username
                  <input
                    className="input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </label>
                <label>
                  Password
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <button className="button" type="submit">Save account settings</button>
              </div>
            </form>
          </section>
        </main>
        </div>
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
