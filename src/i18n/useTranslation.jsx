/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { detectBrowserLanguage, translations } from './translations'

const STORAGE_KEY = 'gtavi_lang'

const LanguageContext = createContext(null)

function storedLanguage(initialLang) {
  if (typeof window === 'undefined' || !window.localStorage) return initialLang

  return window.localStorage.getItem(STORAGE_KEY) || detectBrowserLanguage()
}

export function LanguageProvider({ children, initialLang = 'en' }) {
  const [lang, setLangState] = useState(() => {
    return storedLanguage(initialLang)
  })

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((code) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, code)
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
