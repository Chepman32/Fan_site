export const LANGUAGE_NAMES = {
  en: 'English',
  zh: '中文',
  ru: 'Русский',
  it: 'Italiano',
  id: 'Indonesia',
  pl: 'Polski',
  hi: 'हिन्दी',
  ms: 'Melayu',
}

export const SUPPORTED_LANGS = Object.keys(LANGUAGE_NAMES)

export function detectBrowserLanguage() {
  if (typeof navigator === 'undefined') return 'en'

  const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const lang of langs) {
    const code = lang.split('-')[0].toLowerCase()
    if (SUPPORTED_LANGS.includes(code)) return code
  }
  return 'en'
}
