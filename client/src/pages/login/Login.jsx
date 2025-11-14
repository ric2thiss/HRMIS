import React from 'react'
import { Link } from 'react-router-dom'
import dictLogo from '../../asset/DICT logo.svg'

function Login() {
  return (
    <section className="auth">
      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-left-inner">
            <div className="auth-badge">
              <img src={dictLogo} alt="DICT logo" />
              <span>DICT HRMIS</span>
            </div>
            <div className="auth-caption">Capturing efficiency, empowering people.</div>
          </div>
        </div>

        <div className="auth-right">
          <h1 className="auth-title">Welcome back</h1>
          <div className="auth-subtle">Don't have an account? <Link to="/signup">Create one</Link></div>

          <form className="auth-actions" onSubmit={(e)=>e.preventDefault()}>
            <div className="auth-row">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" className="input" placeholder="you@company.com" />
              </div>
            </div>
            <div className="auth-row">
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" className="input" placeholder="••••••••" />
              </div>
            </div>

            <div className="checkbox">
              <input id="remember" type="checkbox" />
              <label htmlFor="remember">Remember me</label>
            </div>

            <button className="button" type="submit">Sign in</button>

            <div className="divider">Or continue with</div>
            <div className="providers">
              <button type="button" className="button btn-outline">Google</button>
              <button type="button" className="button btn-outline">Apple</button>
            </div>

            <div className="auth-subtle">Back to <Link to="/">Landing</Link></div>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Login