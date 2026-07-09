import { useEffect, useState } from 'react'
import { Lock, Mail, User, X } from 'lucide-react'
import { useSocial } from '../social/SocialContext'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './AuthModal.css'

function AuthModal({ onClose }) {
  const { login, signup, authError, isSignedIn } = useSocial()
  const { t } = useTranslation()
  const [mode, setMode] = useState('signup')
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    newsletterOptIn: false,
  })
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const updateForm = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  useEffect(() => { if (isSignedIn) onClose() }, [isSignedIn, onClose])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setSubmitError('')
    let success = false
    try {
      success = mode === 'signup'
        ? await signup(form)
        : await login({ email: form.email, password: form.password })
    } catch (error) {
      setSubmitError(error?.message || t.auth.signInFailed || 'Sign-in request failed.')
    } finally {
      setBusy(false)
    }
    if (success) onClose()
  }

  return (
    <div className="auth-backdrop" role="presentation">
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="auth-close" type="button" onClick={onClose} aria-label={t.auth.closeSignIn}>
          <X size={18} />
        </button>

        <div className="auth-copy">
          <span className="auth-kicker">{t.auth.communityAccess}</span>
          <h2 id="auth-title">{mode === 'signup' ? t.auth.createProfile : t.auth.welcomeBack}</h2>
          <p>{t.auth.description}</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label={t.auth.communityAccess}>
          <button className={mode === 'signup' ? 'active' : ''} type="button" onClick={() => setMode('signup')}>
            {t.auth.signUp}
          </button>
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
            {t.auth.login}
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              <span>{t.auth.username}</span>
              <div className="auth-field">
                <User size={16} />
                <input value={form.username} onChange={(e) => updateForm('username', e.target.value)} placeholder={t.auth.usernamePlaceholder} autoComplete="username" />
              </div>
            </label>
          )}

          <label>
            <span>{t.auth.email}</span>
            <div className="auth-field">
              <Mail size={16} />
              <input type="text" inputMode="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder={t.auth.emailPlaceholder} autoComplete="email" />
            </div>
          </label>

          <label>
            <span>{t.auth.password}</span>
            <div className="auth-field">
              <Lock size={16} />
              <input type="password" value={form.password} onChange={(e) => updateForm('password', e.target.value)} placeholder={t.auth.passwordPlaceholder} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            </div>
          </label>

          {mode === 'signup' && (
            <label className="auth-newsletter">
              <input
                type="checkbox"
                checked={form.newsletterOptIn}
                onChange={(event) => updateForm('newsletterOptIn', event.target.checked)}
              />
              <span>{t.auth.newsletterOptIn}</span>
            </label>
          )}

          {(authError || submitError) && <p className="auth-error">{authError || submitError}</p>}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? t.auth.checking : mode === 'signup' ? t.auth.createAccount : t.auth.login}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthModal
