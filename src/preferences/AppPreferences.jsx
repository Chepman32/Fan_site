/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const THEME_STORAGE_KEY = 'gtavi_theme'
const VEHICLE_NAMES_STORAGE_KEY = 'gtavi_translate_vehicle_names'
const THEMES = new Set(['dark', 'light'])

function readStoredValue(key) {
  if (typeof window === 'undefined' || !window.localStorage) return null

  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStoredValue(key, value) {
  if (typeof window === 'undefined' || !window.localStorage) return

  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Preferences should keep working even when storage is unavailable.
  }
}

function initialTheme() {
  const storedTheme = readStoredValue(THEME_STORAGE_KEY)
  return THEMES.has(storedTheme) ? storedTheme : 'dark'
}

function initialVehicleNamePreference() {
  return readStoredValue(VEHICLE_NAMES_STORAGE_KEY) === 'true'
}

const PreferencesContext = createContext(null)

export function PreferencesProvider({ children }) {
  const [theme, setThemeState] = useState(initialTheme)
  const [translateVehicleNames, setTranslateVehicleNamesState] = useState(initialVehicleNamePreference)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const setTheme = useCallback((nextTheme) => {
    if (!THEMES.has(nextTheme)) return

    writeStoredValue(THEME_STORAGE_KEY, nextTheme)
    setThemeState(nextTheme)
  }, [])

  const setTranslateVehicleNames = useCallback((enabled) => {
    const nextValue = Boolean(enabled)
    writeStoredValue(VEHICLE_NAMES_STORAGE_KEY, String(nextValue))
    setTranslateVehicleNamesState(nextValue)
  }, [])

  const value = useMemo(() => ({
    theme,
    setTheme,
    translateVehicleNames,
    setTranslateVehicleNames,
  }), [setTheme, setTranslateVehicleNames, theme, translateVehicleNames])

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used inside PreferencesProvider')
  return ctx
}
