import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import dictLogo from '../asset/DICT logo.svg'

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev)
  }

  return (
    <div>
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
        <button className="hr-bell" type="button" aria-label="Notifications">
          🔔
        </button>
        <Link className="button secondary" to="/login">
          Login
        </Link>
      </header>

      {menuOpen && (
        <aside className="hr-menu-drawer">
          <nav className="hr-sidebar-nav">
            <a className="hr-nav-item" href="/#features">Features</a>
            <a className="hr-nav-item" href="/#about">About</a>
            <a className="hr-nav-item" href="/#contact">Contact</a>
            <Link className="hr-nav-item" to="/login">Login</Link>
          </nav>
        </aside>
      )}

      <main>
        <section className="hero container">
          <div className="kicker">Human Resource Management System</div>
          <h1 className="hero-title">Modern HRMIS to streamline your workforce operations</h1>
          <p className="hero-subtitle">Centralize employee data, automate workflows, and gain insights with a fast, intuitive interface.</p>
          <div className="hero-actions">
            <Link className="button" to="/login">Launch App</Link>
          </div>
          <div className="badges">
            <span className="badge">No setup required</span>
            <span className="badge">Fast & responsive</span>
            <span className="badge">Secure by default</span>
          </div>
        </section>

        <section id="features" className="section container">
          <div className="card-grid">
            <div className="card">
              <div className="icon">👥</div>
              <h3>Employee Directory</h3>
              <p>Searchable profiles with roles, departments, and contact details.</p>
            </div>
            <div className="card">
              <div className="icon">🗓️</div>
              <h3>Leave & Attendance</h3>
              <p>Track leave requests, approvals, and real-time attendance.</p>
            </div>
            <div className="card">
              <div className="icon">📈</div>
              <h3>Analytics</h3>
              <p>Understand trends in headcount, attrition, and performance.</p>
            </div>
          </div>

          <div id="get-started" className="cta">
            <div>
              <h3>Ready to get started?</h3>
              <p className="hero-subtitle" style={{ margin: 0 }}>Jump into the app or customize this landing page content.</p>
            </div>
            <div>
              <Link className="button" to="/login">Open Dashboard</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <small>© {new Date().getFullYear()} HRMIS. All rights reserved.</small>
          <div style={{ display: 'flex', gap: 12 }}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
