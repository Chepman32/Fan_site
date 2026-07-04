/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const THEME_STORAGE_KEY = 'gtavi_theme'
const VEHICLE_NAMES_STORAGE_KEY = 'gtavi_translate_vehicle_names'
const REDUCED_MOTION_STORAGE_KEY = 'gtavi_reduced_motion'
const CONTENT_DENSITY_STORAGE_KEY = 'gtavi_content_density'
const AUTOPLAY_VIDEOS_STORAGE_KEY = 'gtavi_autoplay_videos'
const HIDE_SPOILERS_STORAGE_KEY = 'gtavi_hide_spoilers'
const DATE_TIME_FORMAT_STORAGE_KEY = 'gtavi_date_time_format'
const DEFAULT_FEED_STORAGE_KEY = 'gtavi_default_community_feed'
const THEMES = new Set(['system', 'dark', 'light'])
const CONTENT_DENSITIES = new Set(['comfortable', 'compact'])
const DATE_TIME_FORMATS = new Set(['locale', 'mdy', 'dmy'])
const COMMUNITY_FEEDS = new Set(['latest', 'trending', 'followed'])

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

function initialBoolean(key, fallback = false) {
  const storedValue = readStoredValue(key)
  if (storedValue === null) return fallback
  return storedValue === 'true'
}

function initialEnum(key, values, fallback) {
  const storedValue = readStoredValue(key)
  return values.has(storedValue) ? storedValue : fallback
}

const PreferencesContext = createContext(null)

export function PreferencesProvider({ children }) {
  const [theme, setThemeState] = useState(initialTheme)
  const [systemTheme, setSystemTheme] = useState('dark')
  const [translateVehicleNames, setTranslateVehicleNamesState] = useState(() => initialBoolean(VEHICLE_NAMES_STORAGE_KEY))
  const [reducedMotion, setReducedMotionState] = useState(() => initialBoolean(REDUCED_MOTION_STORAGE_KEY))
  const [contentDensity, setContentDensityState] = useState(() => initialEnum(CONTENT_DENSITY_STORAGE_KEY, CONTENT_DENSITIES, 'comfortable'))
  const [autoplayVideos, setAutoplayVideosState] = useState(() => initialBoolean(AUTOPLAY_VIDEOS_STORAGE_KEY))
  const [hideSpoilers, setHideSpoilersState] = useState(() => initialBoolean(HIDE_SPOILERS_STORAGE_KEY, true))
  const [dateTimeFormat, setDateTimeFormatState] = useState(() => initialEnum(DATE_TIME_FORMAT_STORAGE_KEY, DATE_TIME_FORMATS, 'locale'))
  const [defaultCommunityFeed, setDefaultCommunityFeedState] = useState(() => initialEnum(DEFAULT_FEED_STORAGE_KEY, COMMUNITY_FEEDS, 'latest'))

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const syncSystemTheme = () => setSystemTheme(media.matches ? 'light' : 'dark')
    syncSystemTheme()
    media.addEventListener?.('change', syncSystemTheme)
    return () => media.removeEventListener?.('change', syncSystemTheme)
  }, [])

  useEffect(() => {
    const resolvedTheme = theme === 'system' ? systemTheme : theme
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.dataset.themePreference = theme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [systemTheme, theme])

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion)
    document.documentElement.dataset.density = contentDensity
  }, [contentDensity, reducedMotion])

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

  const setReducedMotion = useCallback((enabled) => {
    const nextValue = Boolean(enabled)
    writeStoredValue(REDUCED_MOTION_STORAGE_KEY, String(nextValue))
    setReducedMotionState(nextValue)
  }, [])

  const setContentDensity = useCallback((value) => {
    if (!CONTENT_DENSITIES.has(value)) return
    writeStoredValue(CONTENT_DENSITY_STORAGE_KEY, value)
    setContentDensityState(value)
  }, [])

  const setAutoplayVideos = useCallback((enabled) => {
    const nextValue = Boolean(enabled)
    writeStoredValue(AUTOPLAY_VIDEOS_STORAGE_KEY, String(nextValue))
    setAutoplayVideosState(nextValue)
  }, [])

  const setHideSpoilers = useCallback((enabled) => {
    const nextValue = Boolean(enabled)
    writeStoredValue(HIDE_SPOILERS_STORAGE_KEY, String(nextValue))
    setHideSpoilersState(nextValue)
  }, [])

  const setDateTimeFormat = useCallback((value) => {
    if (!DATE_TIME_FORMATS.has(value)) return
    writeStoredValue(DATE_TIME_FORMAT_STORAGE_KEY, value)
    setDateTimeFormatState(value)
  }, [])

  const setDefaultCommunityFeed = useCallback((value) => {
    if (!COMMUNITY_FEEDS.has(value)) return
    writeStoredValue(DEFAULT_FEED_STORAGE_KEY, value)
    setDefaultCommunityFeedState(value)
  }, [])

  const applyAccountPreferences = useCallback((settings = {}) => {
    if (THEMES.has(settings.theme)) {
      writeStoredValue(THEME_STORAGE_KEY, settings.theme)
      setThemeState(settings.theme)
    }
    if (typeof settings.translateVehicleNames === 'boolean') {
      writeStoredValue(VEHICLE_NAMES_STORAGE_KEY, String(settings.translateVehicleNames))
      setTranslateVehicleNamesState(settings.translateVehicleNames)
    }
    if (typeof settings.reducedMotion === 'boolean') {
      writeStoredValue(REDUCED_MOTION_STORAGE_KEY, String(settings.reducedMotion))
      setReducedMotionState(settings.reducedMotion)
    }
    if (CONTENT_DENSITIES.has(settings.contentDensity)) {
      writeStoredValue(CONTENT_DENSITY_STORAGE_KEY, settings.contentDensity)
      setContentDensityState(settings.contentDensity)
    }
    if (typeof settings.autoplayVideos === 'boolean') {
      writeStoredValue(AUTOPLAY_VIDEOS_STORAGE_KEY, String(settings.autoplayVideos))
      setAutoplayVideosState(settings.autoplayVideos)
    }
    if (typeof settings.hideSpoilers === 'boolean') {
      writeStoredValue(HIDE_SPOILERS_STORAGE_KEY, String(settings.hideSpoilers))
      setHideSpoilersState(settings.hideSpoilers)
    }
    if (DATE_TIME_FORMATS.has(settings.dateTimeFormat)) {
      writeStoredValue(DATE_TIME_FORMAT_STORAGE_KEY, settings.dateTimeFormat)
      setDateTimeFormatState(settings.dateTimeFormat)
    }
    if (COMMUNITY_FEEDS.has(settings.defaultCommunityFeed)) {
      writeStoredValue(DEFAULT_FEED_STORAGE_KEY, settings.defaultCommunityFeed)
      setDefaultCommunityFeedState(settings.defaultCommunityFeed)
    }
  }, [])

  const value = useMemo(() => ({
    applyAccountPreferences,
    autoplayVideos,
    contentDensity,
    dateTimeFormat,
    defaultCommunityFeed,
    hideSpoilers,
    reducedMotion,
    theme,
    setAutoplayVideos,
    setContentDensity,
    setDateTimeFormat,
    setDefaultCommunityFeed,
    setHideSpoilers,
    setReducedMotion,
    setTheme,
    translateVehicleNames,
    setTranslateVehicleNames,
  }), [
    applyAccountPreferences,
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
  ])

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
