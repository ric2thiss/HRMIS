import React from 'react'
import { Link } from 'react-router-dom'
import dictLogo from '../../asset/DICT logo.svg'

export default function Signup() {
  return (
    <section className="auth">
      <div className="auth-card">
        <div className="auth-left">
          <div className="auth-left-inner">
            <div className="auth-badge">
              <img src={dictLogo} alt="DICT logo" />
              <span>DICT HRMIS</span>
            </div>
            <div className="auth-caption">Create your account to get started.</div>
          </div>
        </div>

        <div className="auth-right">
          <h1 className="auth-title">Create an account</h1>
          <div className="auth-subtle">Already have an account? <Link to="/login">Log in</Link></div>

          <form className="auth-actions" onSubmit={(e)=>e.preventDefault()}>
            <div className="auth-row two">
              <div className="field">
                <label htmlFor="firstName">First name</label>
                <input id="firstName" type="text" className="input" placeholder="Juan" />
              </div>
              <div className="field">
                <label htmlFor="lastName">Last name</label>
                <input id="lastName" type="text" className="input" placeholder="Dela Cruz" />
              </div>
            </div>

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

            <label className="checkbox" htmlFor="terms">
              <input id="terms" type="checkbox" />
              <span>I agree to the <a href="#">Terms & Conditions</a></span>
            </label>

            <button className="button" type="submit">Create account</button>

            <div className="divider">Or register with</div>
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
