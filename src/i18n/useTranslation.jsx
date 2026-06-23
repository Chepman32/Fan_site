/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { detectBrowserLanguage, translations } from './translations'

const STORAGE_KEY = 'gtavi_lang'

const LanguageContext = createContext(null)

function preferredLanguage(initialLang) {
  if (typeof window === 'undefined' || !window.localStorage) return initialLang

  try {
    return window.localStorage.getItem(STORAGE_KEY) || detectBrowserLanguage()
  } catch {
    return detectBrowserLanguage() || initialLang
  }
}

export function LanguageProvider({ children, initialLang = 'en' }) {
  const [lang, setLangState] = useState(initialLang)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setLangState(preferredLanguage(initialLang))
      setReady(true)
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [initialLang])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    if (ready) document.documentElement.classList.add('app-ready')
  }, [ready])

  const setLang = useCallback((code) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, code)
      } catch {
        // Keep language switching usable even when storage is unavailable.
      }
    }
    setLangState(code)
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useTranslation must be used inside LanguageProvider')
  const t = translations[ctx.lang] ?? translations.en
  return { t, lang: ctx.lang, setLang: ctx.setLang }
}
