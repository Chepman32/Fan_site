import { Car, Languages, Moon, Settings, Sun } from 'lucide-react'
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

function SettingsPage() {
  const { t, lang } = useTranslation()
  const {
    setTheme,
    setTranslateVehicleNames,
    theme,
    translateVehicleNames,
  } = usePreferences()
  const isNonEnglish = lang !== 'en'
  const languageName = LANGUAGE_NAMES[lang] || lang.toUpperCase()

  return (
    <section className="settings-page section-padding">
      <div className="container settings-layout">
        <div className="settings-heading">
          <span>{t.nav.settings || 'Settings'}</span>
          <h1>{t.nav.settings || 'Settings'}</h1>
          <p>Personalize Leonida Loot for this browser.</p>
        </div>

        <div className="settings-panel">
          <div className="settings-panel-heading">
            <Settings size={20} aria-hidden="true" />
            <h2>Appearance</h2>
          </div>
          <div className="settings-theme-grid" aria-label="Theme">
            <ThemeOption
              active={theme === 'dark'}
              icon={Moon}
              label="Dark"
              onClick={() => setTheme('dark')}
            />
            <ThemeOption
              active={theme === 'light'}
              icon={Sun}
              label="Light"
              onClick={() => setTheme('light')}
            />
          </div>
        </div>

        {isNonEnglish ? (
          <div className="settings-panel">
            <div className="settings-panel-heading">
              <Languages size={20} aria-hidden="true" />
              <h2>Translation</h2>
            </div>
            <PreferenceSwitch
              checked={translateVehicleNames}
              description={translateVehicleNames
                ? `Vehicle model names will be translated while ${languageName} is active.`
                : `Vehicle model names stay in English while ${languageName} is active.`}
              icon={Car}
              label="Translate vehicle names"
              onChange={setTranslateVehicleNames}
            />
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default SettingsPage
