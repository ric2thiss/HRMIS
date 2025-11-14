import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import dictLogo from '../../asset/DICT logo.svg'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('Benz')
  const [password, setPassword] = useState('12345')
  const [role, setRole] = useState('employee')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (role === 'employee' && email === 'Benz' && password === '12345') {
        console.log('Dummy employee logged in:', { username: email })
        localStorage.removeItem('isAdmin')
        navigate('/dashboard')
      } else if (role === 'admin' && email === 'admin' && password === 'admin123') {
        console.log('Dummy admin logged in:', { username: email })
        localStorage.setItem('isAdmin', 'true')
        navigate('/admin/dashboard')
      } else {
        setError('Login failed. For employee use Benz/12345. For admin use admin/admin123.')
      }
      setLoading(false)
    }, 400)
  }

  return (
    <>
      <header className="navbar">
        <div className="container navbar-inner">
          <div className="brand">
            <Link
              to="/"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <img src={dictLogo} alt="DICT logo" className="brand-logo" />
            </Link>
            <span>DICT HRMIS</span>
          </div>
        </div>
        <div className="nav-cta">
          <Link className="button" to="/">Home</Link>
        </div>
      </header>

      <section className="auth">
        <div className="auth-card">
          <div className="auth-left">
            <div className="auth-left-inner">
              <div className="auth-left-content">
                <img src={dictLogo} alt="DICT logo" className="auth-logo-large" />
                <div className="auth-left-text">
                  <div className="auth-left-title">HUMAN RESOURCE MANAGEMENT SYSTEM</div>
                  <div className="auth-left-subtitle">DICT 13</div>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-right">
            <h1 className="auth-title">Legacy login</h1>
            <div className="auth-subtle">Sign in as employee or admin using dummy credentials.</div>

            <form className="auth-actions" onSubmit={handleSubmit}>
              <div className="auth-row">
                <div className="field">
                  <label htmlFor="role">Login as</label>
                  <select
                    id="role"
                    className="input"
                    value={role}
                    onChange={(e) => {
                      const nextRole = e.target.value
                      setRole(nextRole)
                      if (nextRole === 'admin') {
                        setEmail('admin')
                        setPassword('admin123')
                      } else {
                        setEmail('Benz')
                        setPassword('12345')
                      }
                    }}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="auth-row">
                <div className="field">
                  <label htmlFor="email">Username</label>
                  <input
                    id="email"
                    type="text"
                    className="input"
                    placeholder={role === 'admin' ? 'admin' : 'Benz'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="auth-row">
                <div className="field">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="checkbox">
                <input id="remember" type="checkbox" />
                <label htmlFor="remember">Remember me</label>
              </div>

              <button className="button" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
              {error && <div className="auth-subtle" style={{ color: '#fca5a5' }}>{error}</div>}
              {!error && (
                <div className="auth-subtle" style={{ fontSize: 12 }}>
                  Employee: <strong>Benz / 12345</strong> · Admin: <strong>admin / admin123</strong>
                </div>
              )}
              <div className="auth-subtle">Back to <Link to="/">Landing</Link></div>
            </form>
          </div>
        </div>
      </section>

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

export default Login