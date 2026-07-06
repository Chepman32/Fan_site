import { useEffect } from 'react'
import { ArrowRight, Car, Languages, Moon, Settings, Sun, UserPlus, X } from 'lucide-react'
import { LANGUAGE_NAMES } from '../i18n/translations'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { usePreferences } from '../preferences/AppPreferences.jsx'
import { useSocial } from '../social/SocialContext'
import './QuickSettingsModal.css'

function ThemeOption({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      className={`quick-settings-theme-option ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}

function PreferenceSwitch({ checked, description, icon: Icon, label, onChange }) {
  return (
    <div className="quick-settings-switch-row">
      <div className="quick-settings-row-copy">
        <span className="quick-settings-row-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <div>
          <h3>{label}</h3>
          <p>{description}</p>
        </div>
      </div>
      <button
        type="button"
        className={`quick-settings-switch ${checked ? 'on' : ''}`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  )
}

function QuickSettingsModal({ onClose, onOpenAuth }) {
  const { t, lang } = useTranslation()
  const {
    setTheme,
    setTranslateVehicleNames,
    theme,
    translateVehicleNames,
  } = usePreferences()
  const { isSignedIn, saveAccountSettings } = useSocial()
  const isNonEnglish = lang !== 'en'
  const languageName = LANGUAGE_NAMES[lang] || lang.toUpperCase()
  const settingsCopy = t.settings || {}
  const settingsTitle = settingsCopy.title || t.nav.settings || 'Settings'
  const vehicleNameDescription = translateVehicleNames
    ? settingsCopy.vehicleNamesOn?.(languageName) || `Vehicle model names will be translated while ${languageName} is active.`
    : settingsCopy.vehicleNamesOff?.(languageName) || `Vehicle model names stay in English while ${languageName} is active.`

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  const updateTheme = (value) => {
    setTheme(value)
    if (isSignedIn) void saveAccountSettings({ theme: value })
  }

  const updateVehicleNamePreference = (value) => {
    setTranslateVehicleNames(value)
    if (isSignedIn) void saveAccountSettings({ translateVehicleNames: value })
  }

  return (
    <div
      className="quick-settings-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <section
        className="quick-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-settings-title"
      >
        <button
          className="quick-settings-close"
          type="button"
          onClick={onClose}
          aria-label={settingsCopy.close || 'Close settings'}
          autoFocus
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="quick-settings-layout">
          <header className="quick-settings-heading">
            <span>{settingsCopy.kicker || settingsTitle}</span>
            <h2 id="quick-settings-title">{settingsTitle}</h2>
            <p>{settingsCopy.description || 'Personalize Leonida Loot for this browser.'}</p>
          </header>

          <div className="quick-settings-panel">
            <div className="quick-settings-panel-heading">
              <Settings size={20} aria-hidden="true" />
              <h3>{settingsCopy.appearance || 'Appearance'}</h3>
            </div>
            <div className="quick-settings-theme-grid" aria-label={settingsCopy.themeLabel || 'Theme'}>
              <ThemeOption
                active={theme === 'dark'}
                icon={Moon}
                label={settingsCopy.darkTheme || 'Dark'}
                onClick={() => updateTheme('dark')}
              />
              <ThemeOption
                active={theme === 'light'}
                icon={Sun}
                label={settingsCopy.lightTheme || 'Light'}
                onClick={() => updateTheme('light')}
              />
            </div>
          </div>

          {isNonEnglish ? (
            <div className="quick-settings-panel">
              <div className="quick-settings-panel-heading">
                <Languages size={20} aria-hidden="true" />
                <h3>{settingsCopy.translation || 'Translation'}</h3>
              </div>
              <PreferenceSwitch
                checked={translateVehicleNames}
                description={vehicleNameDescription}
                icon={Car}
                label={settingsCopy.translateVehicleNames || 'Translate vehicle names'}
                onChange={updateVehicleNamePreference}
              />
            </div>
          ) : null}

          {!isSignedIn ? (
            <button
              type="button"
              className="quick-settings-sign-up-banner"
              onClick={() => {
                onClose?.()
                onOpenAuth?.()
              }}
            >
              <UserPlus size={18} aria-hidden="true" />
              <span>{settingsCopy.guestBanner || 'Sign Up to unlock more settings'}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default QuickSettingsModal
