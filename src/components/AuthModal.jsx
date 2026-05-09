import { useState } from 'react'
import { Lock, Mail, User, X } from 'lucide-react'
import { useSocial } from '../social/SocialContext'
import './AuthModal.css'

function AuthModal({ onClose }) {
  const { login, signup, authError } = useSocial()
  const [mode, setMode] = useState('signup')
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [busy, setBusy] = useState(false)

  const updateForm = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)

    const success = mode === 'signup'
      ? await signup(form)
      : await login({ email: form.email, password: form.password })

    setBusy(false)
    if (success) onClose()
  }

  return (
    <div className="auth-backdrop" role="presentation">
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" type="button" onClick={onClose} aria-label="Close sign in">
          <X size={18} />
        </button>

        <div className="auth-copy">
          <span className="auth-kicker">Community access</span>
          <h2 id="auth-title">{mode === 'signup' ? 'Create your hub profile' : 'Welcome back'}</h2>
          <p>
            Signed-in fans can post, vote, follow topics, submit sources, and message other members.
          </p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button
            className={mode === 'signup' ? 'active' : ''}
            type="button"
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
          <button
            className={mode === 'login' ? 'active' : ''}
            type="button"
            onClick={() => setMode('login')}
          >
            Login
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              <span>Username</span>
              <div className="auth-field">
                <User size={16} />
                <input
                  value={form.username}
                  onChange={(event) => updateForm('username', event.target.value)}
                  placeholder="ViceCityFan"
                  autoComplete="username"
                />
              </div>
            </label>
          )}

          <label>
            <span>Email</span>
            <div className="auth-field">
              <Mail size={16} />
              <input
                type="text"
                inputMode="email"
                value={form.email}
                onChange={(event) => updateForm('email', event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="auth-field">
              <Lock size={16} />
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateForm('password', event.target.value)}
                placeholder="6+ characters"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
          </label>

          {authError && <p className="auth-error">{authError}</p>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Checking...' : mode === 'signup' ? 'Create account' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthModal
