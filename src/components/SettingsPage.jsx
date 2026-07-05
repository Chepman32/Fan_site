import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  BellRing,
  Car,
  Check,
  Clock3,
  Database,
  Download,
  EyeOff,
  FileWarning,
  Gauge,
  KeyRound,
  Languages,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  Shield,
  ShieldCheck,
  Store,
  Sun,
  Trash2,
  Video,
  WalletCards,
} from 'lucide-react'
import {
  changePassword,
  deleteAccount,
  downloadAccountData,
  sendPasswordReset,
  sendVerificationEmail,
  signOutEverywhere,
} from '../account/accountClient'
import { LANGUAGE_NAMES } from '../i18n/translations'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { usePreferences } from '../preferences/AppPreferences.jsx'
import { SOCIAL_TOPICS } from '../social/socialData'
import { useSocial } from '../social/SocialContext'
import './SettingsPage.css'

const TRON_ADDRESS_PATTERN = /^T[1-9A-HJ-NP-Za-km-z]{33}$/

function getSettingsSections(t) {
  return [
    { id: 'account-security', label: t.settings?.sections?.accountSecurity || 'Account & security' },
    { id: 'privacy-safety', label: t.settings?.sections?.privacySafety || 'Privacy & safety' },
    { id: 'seller-settings', label: t.settings?.sections?.sellerSettings || 'P2P seller' },
    { id: 'personalization', label: t.settings?.sections?.personalization || 'Personalization' },
  ]
}

function SectionHeading({ icon: Icon, title, description }) {
  return (
    <div className="settings-panel-heading">
      <span><Icon size={20} aria-hidden="true" /></span>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
  )
}

function PreferenceSwitch({ checked, description, icon: Icon, label, onChange }) {
  return (
    <div className="settings-switch-row">
      <div className="settings-row-copy">
        <span className="settings-row-icon" aria-hidden="true"><Icon size={18} /></span>
        <div>
          <h3>{label}</h3>
          <p>{description}</p>
        </div>
      </div>
      <button
        type="button"
        className={`settings-switch ${checked ? 'on' : ''}`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  )
}

function ChoiceGroup({ label, value, options, onChange }) {
  return (
    <fieldset className="settings-choice-field">
      <legend>{label}</legend>
      <div className="settings-choice-grid">
        {options.map((option) => {
          const Icon = option.icon
          return (
            <button
              key={option.value}
              type="button"
              className={value === option.value ? 'active' : ''}
              aria-pressed={value === option.value}
              onClick={() => onChange(option.value)}
            >
              {Icon && <Icon size={17} aria-hidden="true" />}
              <span>{option.label}</span>
              {option.description && <small>{option.description}</small>}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function UserListSetting({ currentUserId, ids, label, onChange, users, t }) {
  const [selectedId, setSelectedId] = useState('')
  const availableUsers = users.filter((user) => user.id !== currentUserId && !ids.includes(user.id))

  const addUser = () => {
    if (!selectedId) return
    onChange([...ids, selectedId])
    setSelectedId('')
  }

  return (
    <div className="settings-user-list">
      <h3>{label}</h3>
      <div className="settings-user-add">
        <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
          <option value="">{t?.settings?.privacySafety?.selectUser || 'Select a community member'}</option>
          {availableUsers.map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}
        </select>
        <button type="button" onClick={addUser} disabled={!selectedId}>{t?.settings?.privacySafety?.add || 'Add'}</button>
      </div>
      <div className="settings-user-chips">
        {ids.map((id) => {
          const user = users.find((candidate) => candidate.id === id)
          const username = user?.username || (t?.settings?.privacySafety?.unknownUser || 'Unknown user')
          return (
            <span key={id}>
              {username}
              <button type="button" onClick={() => onChange(ids.filter((userId) => userId !== id))} aria-label={t?.settings?.privacySafety?.removeUser?.(username) || `Remove ${username}`}>×</button>
            </span>
          )
        })}
        {!ids.length && <small>{t?.settings?.privacySafety?.noUsers || 'No users added.'}</small>}
      </div>
    </div>
  )
}

function SettingsPage({ onNavigate, onOpenAuth }) {
  const {
    accountSettings,
    accountSettingsLoading,
    authAccount,
    currentProfile,
    isSignedIn,
    publicUsers,
    refreshAuthAccount,
    reportHistory,
    saveAccountSettings,
  } = useSocial()
  const { t, lang, setLang } = useTranslation()
  const {
    autoplayVideos,
    contentDensity,
    dateTimeFormat,
    defaultCommunityFeed,
    hideSpoilers,
    reducedMotion,
    setAutoplayVideos,
    setContentDensity,
    setDateTimeFormat,
    setDefaultCommunityFeed,
    setHideSpoilers,
    setReducedMotion,
    setTheme,
    setTranslateVehicleNames,
    theme,
    translateVehicleNames,
  } = usePreferences()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busyAction, setBusyAction] = useState('')
  const [activeSection, setActiveSection] = useState('account-security')
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [walletDraft, setWalletDraft] = useState(null)
  const [mutedTopicDraft, setMutedTopicDraft] = useState('')

  const settingsTitle = t.settings?.title || t.nav.settings || 'Settings'
  const SETTINGS_SECTIONS = useMemo(() => getSettingsSections(t), [t])
  const sortedReports = useMemo(
    () => [...reportHistory].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [reportHistory],
  )
  const dateTimePreview = useMemo(() => {
    const locale = dateTimeFormat === 'mdy' ? 'en-US' : dateTimeFormat === 'dmy' ? 'en-GB' : lang
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(2026, 10, 19, 18, 30))
  }, [dateTimeFormat, lang])

  useEffect(() => {
    let frameId = 0
    const updateActiveSection = () => {
      frameId = 0
      const activationLine = 190
      let nextSection = SETTINGS_SECTIONS[0].id

      SETTINGS_SECTIONS.forEach(({ id }) => {
        const section = document.getElementById(id)
        if (section?.getBoundingClientRect().top <= activationLine) nextSection = id
      })

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
        nextSection = SETTINGS_SECTIONS.at(-1).id
      }

      setActiveSection((currentSection) => currentSection === nextSection ? currentSection : nextSection)
    }
    const scheduleUpdate = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updateActiveSection)
    }

    updateActiveSection()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [SETTINGS_SECTIONS])

  useEffect(() => {
    if (!notice || error || busyAction) return undefined

    const removeTimer = window.setTimeout(() => setNotice(''), 1000)

    return () => window.clearTimeout(removeTimer)
  }, [busyAction, error, notice])

  const runAction = async (name, action, successMessage) => {
    setBusyAction(name)
    setError('')
    setNotice('')
    try {
      const result = await action()
      if (result === false) throw new Error(t.settings?.notices?.actionFailed || 'The action could not be completed.')
      if (successMessage) setNotice(successMessage)
      return true
    } catch (actionError) {
      setError(actionError.message || (t.settings?.notices?.actionFailed || 'The action could not be completed.'))
      return false
    } finally {
      setBusyAction('')
    }
  }

  const updateSetting = async (key, value, applyLocal) => {
    setError('')
    setNotice('')
    applyLocal?.(value)
    const saved = await saveAccountSettings({ [key]: value })
    if (saved) {
      setError('')
      setNotice(t.settings?.notices?.settingSaved || 'Setting saved.')
    } else if (applyLocal) {
      setError('')
      setNotice(t.settings?.notices?.savedLocal || 'Saved on this device. Account sync is currently unavailable.')
    } else {
      setError(t.settings?.notices?.saveFailed || 'The setting could not be saved.')
    }
    return saved
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()
    if (passwordForm.next.length < 6) {
      setError(t.settings?.accountSecurity?.passwordTooShort || 'The new password must contain at least 6 characters.')
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setError(t.settings?.accountSecurity?.passwordMismatch || 'The new passwords do not match.')
      return
    }
    const changed = await runAction(
      'password',
      () => changePassword(passwordForm.current, passwordForm.next),
      t.settings?.accountSecurity?.passwordChanged || 'Password changed successfully.',
    )
    if (changed) setPasswordForm({ current: '', next: '', confirm: '' })
  }

  const handleDownload = () => runAction('download', async () => {
    const data = await downloadAccountData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leonida-loot-account-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, t.settings?.accountSecurity?.dataDownloaded || 'Account data downloaded.')

  const handleDelete = async (event) => {
    event.preventDefault()
    if (deleteConfirmation !== 'DELETE') {
      setError(t.settings?.accountSecurity?.deleteConfirmError || 'Type DELETE to confirm permanent account deletion.')
      return
    }
    const deleted = await runAction('delete', () => deleteAccount(deletePassword), '')
    if (deleted) onNavigate?.('/')
  }

  const saveWallet = async () => {
    const cleanWallet = (walletDraft ?? accountSettings.defaultTronPayoutAddress).trim()
    if (cleanWallet && !TRON_ADDRESS_PATTERN.test(cleanWallet)) {
      setError(t.settings?.sellerSettings?.invalidAddress || 'Enter a valid TRON address beginning with T, or leave the field empty.')
      return
    }
    const saved = await updateSetting('defaultTronPayoutAddress', cleanWallet)
    if (saved) {
      setWalletDraft(null)
      setNotice(t.settings?.sellerSettings?.addressSaved || 'Default payout address saved.')
    }
  }

  const toggleMutedTopic = (topic) => {
    const currentTopics = accountSettings.mutedTopics
    const nextTopics = currentTopics.includes(topic)
      ? currentTopics.filter((item) => item !== topic)
      : [...currentTopics, topic]
    updateSetting('mutedTopics', nextTopics)
  }

  const addMutedTopic = () => {
    const topic = mutedTopicDraft.trim()
    if (!topic || accountSettings.mutedTopics.includes(topic)) return
    updateSetting('mutedTopics', [...accountSettings.mutedTopics, topic])
    setMutedTopicDraft('')
  }

  if (!isSignedIn) {
    return (
      <section className="settings-page section-padding">
        <div className="container settings-guest">
          <Shield size={30} />
          <span>{settingsTitle}</span>
          <h1>{t.settings?.guestState?.heading || 'Sign in to manage account settings.'}</h1>
          <p>{t.settings?.guestState?.description || 'Security, privacy, seller defaults, and synced personalization are available to authenticated users.'}</p>
          <button type="button" onClick={onOpenAuth}>{t.settings?.guestState?.signIn || 'Sign in'}</button>
        </div>
      </section>
    )
  }

  return (
    <section className="settings-page section-padding">
      <div className="container settings-layout">
        <header className="settings-heading">
          <span>{t.settings?.header?.kicker || 'Account control center'}</span>
          <h1>{settingsTitle}</h1>
          <p>{t.settings?.header?.description || 'Manage security, privacy, marketplace defaults, and how Leonida Loot behaves across your devices.'}</p>
          {accountSettingsLoading && <small>{t.settings?.header?.loading || 'Loading synced settings…'}</small>}
        </header>

        {(busyAction || notice || error) && (
          <div className={`settings-notice ${error ? 'error' : busyAction ? 'pending' : 'success'}`} role={error ? 'alert' : 'status'} aria-live="polite">
            {error ? <AlertTriangle size={17} /> : busyAction ? <Loader2 className="settings-spinner" size={17} /> : <Check size={17} />}
            <span>{error || (busyAction ? (t.settings?.notices?.working || 'Working on your account request…') : notice)}</span>
          </div>
        )}

        <nav className="settings-jump-nav" aria-label="Settings sections">
          {SETTINGS_SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              className={activeSection === id ? 'active' : ''}
              href={`#${id}`}
              aria-current={activeSection === id ? 'true' : undefined}
              onClick={() => setActiveSection(id)}
            >
              {label}
            </a>
          ))}
        </nav>

        <article className="settings-panel" id="account-security">
          <SectionHeading icon={LockKeyhole} title={t.settings?.accountSecurity?.title || 'Account & security'} description={t.settings?.accountSecurity?.description || 'Manage your sign-in identity, sessions, and account data.'} />

          <div className="settings-account-email">
            <span className="settings-row-icon"><Mail size={18} /></span>
            <div>
              <small>{t.settings?.accountSecurity?.email || 'Email address'}</small>
              <strong>{authAccount?.email || (t.settings?.accountSecurity?.noEmail || 'No email address')}</strong>
            </div>
            <span className={`settings-status-badge ${authAccount?.emailVerified ? 'verified' : 'pending'}`}>
              {authAccount?.emailVerified ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
              {authAccount?.emailVerified ? (t.settings?.accountSecurity?.verified || 'Verified') : (t.settings?.accountSecurity?.notVerified || 'Not verified')}
            </span>
            {!authAccount?.emailVerified && (
              <div className="settings-inline-actions">
                <button type="button" disabled={Boolean(busyAction)} onClick={() => runAction('verify', sendVerificationEmail, t.settings?.accountSecurity?.verificationSent || 'Verification email sent.')}>{t.settings?.accountSecurity?.sendVerification || 'Send verification email'}</button>
                <button type="button" disabled={Boolean(busyAction)} onClick={() => runAction('refresh-account', refreshAuthAccount, t.settings?.accountSecurity?.statusRefreshed || 'Verification status refreshed.')}><RefreshCw size={14} /> {t.settings?.accountSecurity?.refreshStatus || 'Refresh status'}</button>
              </div>
            )}
          </div>

          <form className="settings-password-form" onSubmit={handleChangePassword}>
            <h3><KeyRound size={17} /> {t.settings?.accountSecurity?.changePassword || 'Change password'}</h3>
            <div>
              <label>{t.settings?.accountSecurity?.currentPassword || 'Current password'}<input type="password" autoComplete="current-password" value={passwordForm.current} onChange={(event) => setPasswordForm((form) => ({ ...form, current: event.target.value }))} required /></label>
              <label>{t.settings?.accountSecurity?.newPassword || 'New password'}<input type="password" autoComplete="new-password" minLength="6" value={passwordForm.next} onChange={(event) => setPasswordForm((form) => ({ ...form, next: event.target.value }))} required /></label>
              <label>{t.settings?.accountSecurity?.confirmPassword || 'Confirm new password'}<input type="password" autoComplete="new-password" minLength="6" value={passwordForm.confirm} onChange={(event) => setPasswordForm((form) => ({ ...form, confirm: event.target.value }))} required /></label>
            </div>
            <div className="settings-inline-actions">
              <button className="primary" type="submit" disabled={Boolean(busyAction)}>{t.settings?.accountSecurity?.changePasswordButton || 'Change password'}</button>
              <button type="button" disabled={Boolean(busyAction)} onClick={() => runAction('reset', sendPasswordReset, t.settings?.accountSecurity?.resetSent || 'Password reset email sent.')}>{t.settings?.accountSecurity?.resetLink || 'Email me a reset link'}</button>
            </div>
          </form>

          <div className="settings-account-actions">
            <button type="button" disabled={Boolean(busyAction)} onClick={() => runAction('sessions', signOutEverywhere, '')}>
              {busyAction === 'sessions' ? <Loader2 className="settings-spinner" size={17} /> : <LogOut size={17} />}
              <span><b>{busyAction === 'sessions' ? (t.settings?.accountSecurity?.signingOut || 'Signing out…') : (t.settings?.accountSecurity?.signOutAll || 'Sign out from all devices')}</b><small>{t.settings?.accountSecurity?.signOutDescription || 'Revokes refresh tokens and signs out this browser.'}</small></span>
            </button>
            <button type="button" disabled={Boolean(busyAction)} onClick={handleDownload}>
              {busyAction === 'download' ? <Loader2 className="settings-spinner" size={17} /> : <Download size={17} />}
              <span><b>{busyAction === 'download' ? (t.settings?.accountSecurity?.preparingExport || 'Preparing export…') : (t.settings?.accountSecurity?.downloadData || 'Download account data')}</b><small>{t.settings?.accountSecurity?.downloadDescription || 'Exports your profile, content, messages, settings, reports, and P2P records as JSON.'}</small></span>
            </button>
          </div>

          <details className="settings-danger-zone">
            <summary><Trash2 size={17} /> {t.settings?.accountSecurity?.deleteAccount || 'Delete account'}</summary>
            <p>{t.settings?.accountSecurity?.deleteWarning || 'This permanently removes your account and user-created content. Financial P2P audit records are retained. A payout in progress blocks deletion.'}</p>
            <form onSubmit={handleDelete}>
              <label>{t.settings?.accountSecurity?.currentPassword || 'Current password'}<input type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required /></label>
              <label>{t.settings?.accountSecurity?.typeDelete || 'Type DELETE'}<input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} required /></label>
              <button type="submit" disabled={Boolean(busyAction)}><Trash2 size={16} /> {t.settings?.accountSecurity?.deleteButton || 'Permanently delete account'}</button>
            </form>
          </details>
        </article>

        <article className="settings-panel" id="privacy-safety">
          <SectionHeading icon={Shield} title={t.settings?.privacySafety?.title || 'Privacy & safety'} description={t.settings?.privacySafety?.description || 'Control who can reach you and which community content appears.'} />
          <ChoiceGroup
            label={t.settings?.privacySafety?.messagePermission || 'Who can message me'}
            value={accountSettings.messagePermission}
            onChange={(value) => updateSetting('messagePermission', value)}
            options={[
              { value: 'everyone', label: t.settings?.privacySafety?.everyone || 'Everyone', description: t.settings?.privacySafety?.everyoneDesc || 'All signed-in community members' },
              { value: 'registered', label: t.settings?.privacySafety?.registered || 'Registered users', description: t.settings?.privacySafety?.registeredDesc || 'Verified site accounts' },
              { value: 'nobody', label: t.settings?.privacySafety?.nobody || 'Nobody', description: t.settings?.privacySafety?.nobodyDesc || 'Stop new direct messages' },
            ]}
          />
          <PreferenceSwitch checked={accountSettings.showActivityStatus} icon={Activity} label={t.settings?.privacySafety?.showActivityStatus || 'Show activity status'} description={t.settings?.privacySafety?.activityStatusDesc || 'Allow other members to see when your account is active.'} onChange={(value) => updateSetting('showActivityStatus', value)} />

          <div className="settings-two-column">
            <UserListSetting currentUserId={currentProfile?.id} ids={accountSettings.blockedUserIds} label={t.settings?.privacySafety?.blockedUsers || 'Blocked users'} users={publicUsers} onChange={(value) => updateSetting('blockedUserIds', value)} t={t} />
            <UserListSetting currentUserId={currentProfile?.id} ids={accountSettings.mutedUserIds} label={t.settings?.privacySafety?.mutedUsers || 'Muted users'} users={publicUsers} onChange={(value) => updateSetting('mutedUserIds', value)} t={t} />
          </div>

          <div className="settings-muted-topics">
            <h3>{t.settings?.privacySafety?.mutedTopics || 'Muted topics and tags'}</h3>
            <p>{t.settings?.privacySafety?.mutedTopicsDesc || 'Posts and community sections matching these topics are removed from your feed.'}</p>
            <div className="settings-topic-grid">
              {SOCIAL_TOPICS.map((topic) => <button type="button" key={topic} className={accountSettings.mutedTopics.includes(topic) ? 'active' : ''} onClick={() => toggleMutedTopic(topic)}>{topic}</button>)}
            </div>
            <div className="settings-user-add">
              <input value={mutedTopicDraft} onChange={(event) => setMutedTopicDraft(event.target.value)} placeholder={t.settings?.privacySafety?.customTag || 'Custom tag'} maxLength="60" />
              <button type="button" onClick={addMutedTopic} disabled={!mutedTopicDraft.trim() || accountSettings.mutedTopics.includes(mutedTopicDraft.trim())}>{t.settings?.privacySafety?.add || 'Add'}</button>
            </div>
          </div>

          <PreferenceSwitch checked={hideSpoilers} icon={EyeOff} label="Hide spoilers by default" description="Cover posts tagged “spoiler” until you choose to reveal them." onChange={(value) => updateSetting('hideSpoilers', value, setHideSpoilers)} />
          <PreferenceSwitch checked={autoplayVideos} icon={Video} label="Autoplay attached videos" description="Play community video attachments automatically without sound." onChange={(value) => updateSetting('autoplayVideos', value, setAutoplayVideos)} />

          <div className="settings-report-history">
            <h3><FileWarning size={17} /> Report history and status</h3>
            {sortedReports.length ? sortedReports.map((report) => (
              <div key={report.id}>
                <span><b>{report.targetType || 'Content'} report</b><small>{report.reason}</small></span>
                <em>{report.status || 'submitted'}</em>
              </div>
            )) : <p>No reports submitted from this account.</p>}
          </div>
        </article>

        <article className="settings-panel" id="seller-settings">
          <SectionHeading icon={Store} title="P2P seller settings" description="Set safe defaults for new marketplace listings." />
          <div className="settings-wallet-field">
            <span className="settings-row-icon"><WalletCards size={18} /></span>
            <label>
              <b>Default TRON payout address</b>
              <small>Public wallet address only. Never enter a private key or seed phrase.</small>
              <input value={walletDraft ?? accountSettings.defaultTronPayoutAddress} onChange={(event) => setWalletDraft(event.target.value)} placeholder="T…" maxLength="128" />
            </label>
            <button type="button" onClick={saveWallet}>Save address</button>
          </div>
          <PreferenceSwitch checked={accountSettings.salePayoutAlerts} icon={BellRing} label="Sale and payout alerts" description="Receive account alerts when a sale or automatic payout changes status." onChange={(value) => updateSetting('salePayoutAlerts', value)} />
          <PreferenceSwitch checked={accountSettings.confirmWalletBeforeListing} icon={ShieldCheck} label="Confirm wallet before each listing" description="Require a final payout-address confirmation before publishing a P2P listing." onChange={(value) => updateSetting('confirmWalletBeforeListing', value)} />
        </article>

        <article className="settings-panel" id="personalization">
          <SectionHeading icon={Palette} title="Personalization" description="These preferences are synced to your account and applied on sign-in." />
          <ChoiceGroup label="Theme" value={theme} onChange={(value) => updateSetting('theme', value, setTheme)} options={[
            { value: 'system', label: 'System', icon: Monitor },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'light', label: 'Light', icon: Sun },
          ]} />
          <PreferenceSwitch checked={reducedMotion} icon={Gauge} label="Reduced motion" description="Minimize transitions, animated movement, and smooth scrolling." onChange={(value) => updateSetting('reducedMotion', value, setReducedMotion)} />
          <ChoiceGroup label="Content density" value={contentDensity} onChange={(value) => updateSetting('contentDensity', value, setContentDensity)} options={[
            { value: 'comfortable', label: 'Comfortable', description: 'More space between cards and controls' },
            { value: 'compact', label: 'Compact', description: 'Fit more content on screen' },
          ]} />

          <div className="settings-select-grid">
            <label><Languages size={17} /><span>Preferred language</span><select value={lang} onChange={(event) => { setLang(event.target.value); updateSetting('preferredLanguage', event.target.value) }}>{Object.entries(LANGUAGE_NAMES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
            <label>
              <Clock3 size={17} />
              <span>Date and time format</span>
              <select value={dateTimeFormat} onChange={(event) => updateSetting('dateTimeFormat', event.target.value, setDateTimeFormat)}>
                <option value="locale">Use language default</option>
                <option value="mdy">Month / day / year</option>
                <option value="dmy">Day / month / year</option>
              </select>
              <small className="settings-format-preview">Preview: {dateTimePreview}</small>
            </label>
          </div>
          <PreferenceSwitch checked={translateVehicleNames} icon={Car} label="Translate vehicle names" description="Translate vehicle model names when a non-English language is active." onChange={(value) => updateSetting('translateVehicleNames', value, setTranslateVehicleNames)} />
          <ChoiceGroup label="Default community feed" value={defaultCommunityFeed} onChange={(value) => updateSetting('defaultCommunityFeed', value, setDefaultCommunityFeed)} options={[
            { value: 'latest', label: 'Latest', description: 'Newest posts first' },
            { value: 'trending', label: 'Trending', description: 'Posts with the most reactions' },
            { value: 'followed', label: 'Followed topics', description: 'Only topics you follow' },
          ]} />
        </article>

        <footer className="settings-data-note"><Database size={16} /> Private settings are stored in an owner-only Firestore document.</footer>
      </div>
    </section>
  )
}

export default SettingsPage
