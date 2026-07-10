/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { englishTranslation } from './englishTranslation'
import { detectBrowserLanguage } from './languages'

const STORAGE_KEY = 'gtavi_lang'
const ENGLISH_TRANSLATIONS = { en: englishTranslation }
let fullTranslationsPromise

const LanguageContext = createContext(null)

function loadFullTranslations() {
  if (!fullTranslationsPromise) {
    fullTranslationsPromise = import('./translations').then((module) => module.translations)
  }

  return fullTranslationsPromise
}

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
  const [loadedTranslations, setLoadedTranslations] = useState(ENGLISH_TRANSLATIONS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const nextLang = preferredLanguage(initialLang)
      setLangState(nextLang)
      if (nextLang !== 'en') {
        void loadFullTranslations().then(setLoadedTranslations)
      }
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
    if (code !== 'en') {
      void loadFullTranslations().then(setLoadedTranslations)
    }
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang, translations: loadedTranslations }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useTranslation must be used inside LanguageProvider')
  const t = ctx.translations[ctx.lang] ?? englishTranslation
  return { t, lang: ctx.lang, setLang: ctx.setLang }
}
