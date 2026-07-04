import { useEffect } from 'react'
import { Car, Languages, Moon, Settings, Sun, X } from 'lucide-react'
import { LANGUAGE_NAMES } from '../i18n/translations'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { usePreferences } from '../preferences/AppPreferences.jsx'
import './SettingsPage.css'

function ThemeOption({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      className={`settings-theme-option ${active ? 'active' : ''}`}
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
    <div className="settings-switch-row">
      <div className="settings-row-copy">
        <span className="settings-row-icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <div>
          <h2>{label}</h2>
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

function SettingsPage({ onClose }) {
  const { t, lang } = useTranslation()
  const {
    setTheme,
    setTranslateVehicleNames,
    theme,
    translateVehicleNames,
  } = usePreferences()
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

  return (
    <div
      className="settings-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <section
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <button
          className="settings-close"
          type="button"
          onClick={onClose}
          aria-label={settingsCopy.close || 'Close settings'}
          autoFocus
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="settings-layout">
          <div className="settings-heading">
            <span>{settingsCopy.kicker || settingsTitle}</span>
            <h2 id="settings-title">{settingsTitle}</h2>
            <p>{settingsCopy.description || 'Personalize Leonida Loot for this browser.'}</p>
          </div>

          <div className="settings-panel">
            <div className="settings-panel-heading">
              <Settings size={20} aria-hidden="true" />
              <h2>{settingsCopy.appearance || 'Appearance'}</h2>
            </div>
            <div className="settings-theme-grid" aria-label={settingsCopy.themeLabel || 'Theme'}>
              <ThemeOption
                active={theme === 'dark'}
                icon={Moon}
                label={settingsCopy.darkTheme || 'Dark'}
                onClick={() => setTheme('dark')}
              />
              <ThemeOption
                active={theme === 'light'}
                icon={Sun}
                label={settingsCopy.lightTheme || 'Light'}
                onClick={() => setTheme('light')}
              />
            </div>
          </div>

          {isNonEnglish ? (
            <div className="settings-panel">
              <div className="settings-panel-heading">
                <Languages size={20} aria-hidden="true" />
                <h2>{settingsCopy.translation || 'Translation'}</h2>
              </div>
              <PreferenceSwitch
                checked={translateVehicleNames}
                description={vehicleNameDescription}
                icon={Car}
                label={settingsCopy.translateVehicleNames || 'Translate vehicle names'}
                onChange={setTranslateVehicleNames}
              />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default SettingsPage
