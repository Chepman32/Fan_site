import { useEffect, useMemo, useState } from 'react'

const CACHE_PREFIX = 'gtavi:ign-translation'
const CACHE_VERSION = 'v1'
const MAX_CACHE_ENTRIES = 48
const MAX_BATCH_ITEMS = 80
const MAX_BATCH_CHARS = 24000

const TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY?.trim() || ''

const GOOGLE_TARGET_LANGUAGES = {
  zh: 'zh-CN',
}

function googleTargetLanguage(lang) {
  return GOOGLE_TARGET_LANGUAGES[lang] || lang
}

function shouldTranslate(lang) {
  return Boolean(lang && lang !== 'en')
}

function textValue(value) {
  return String(value ?? '').trim()
}

function uniqueTexts(texts) {
  const seen = new Set()

  return texts
    .map(textValue)
    .filter(Boolean)
    .filter((text) => {
      if (seen.has(text)) return false
      seen.add(text)
      return true
    })
}

function hashString(value) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}

function sourceHash(source) {
  return hashString(JSON.stringify(source))
}

function cacheKey(scope, lang, source) {
  return `${CACHE_PREFIX}:${CACHE_VERSION}:${scope}:${lang}:${sourceHash(source)}`
}

function readCachedContent(key) {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const parsed = JSON.parse(cached)
    return parsed?.data || null
  } catch {
    return null
  }
}

function removeOldCacheEntries() {
  try {
    const entries = []

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index)
      if (!key?.startsWith(`${CACHE_PREFIX}:`)) continue

      try {
        const value = JSON.parse(localStorage.getItem(key) || '{}')
        entries.push({ key, createdAt: value.createdAt || 0 })
      } catch {
        entries.push({ key, createdAt: 0 })
      }
    }

    entries
      .sort((entryA, entryB) => entryB.createdAt - entryA.createdAt)
      .slice(MAX_CACHE_ENTRIES)
      .forEach((entry) => localStorage.removeItem(entry.key))
  } catch {
    // localStorage can be unavailable in private browsing or constrained webviews.
  }
}

function writeCachedContent(key, data) {
  try {
    removeOldCacheEntries()
    localStorage.setItem(key, JSON.stringify({
      createdAt: Date.now(),
      data,
    }))
  } catch {
    // If quota is full, translation still works for the current page render.
  }
}

function translationBatches(texts) {
  const batches = []
  let currentBatch = []
  let currentChars = 0

  texts.forEach((text) => {
    const nextChars = currentChars + text.length
    const exceedsItems = currentBatch.length >= MAX_BATCH_ITEMS
    const exceedsChars = currentBatch.length > 0 && nextChars > MAX_BATCH_CHARS

    if (exceedsItems || exceedsChars) {
      batches.push(currentBatch)
      currentBatch = []
      currentChars = 0
    }

    currentBatch.push(text)
    currentChars += text.length
  })

  if (currentBatch.length) batches.push(currentBatch)

  return batches
}

function decodeHtmlEntities(value) {
  if (typeof document === 'undefined') return value

  const element = document.createElement('textarea')
  element.innerHTML = value
  return element.value
}

async function translateTextBatch(texts, lang) {
  const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(TRANSLATE_API_KEY)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      q: texts,
      source: 'en',
      target: googleTargetLanguage(lang),
      format: 'text',
    }),
  })

  if (!response.ok) {
    throw new Error(`Google Translate failed with ${response.status}`)
  }

  const payload = await response.json()
  const translations = payload?.data?.translations || []

  return texts.map((text, index) => {
    const translatedText = translations[index]?.translatedText
    return translatedText ? decodeHtmlEntities(translatedText) : text
  })
}

async function translateTextMap(texts, lang) {
  const sourceTexts = uniqueTexts(texts)
  if (!sourceTexts.length) return new Map()
  if (!TRANSLATE_API_KEY) {
    throw new Error('Missing VITE_GOOGLE_TRANSLATE_API_KEY')
  }

  const translatedTexts = []

  for (const batch of translationBatches(sourceTexts)) {
    translatedTexts.push(...await translateTextBatch(batch, lang))
  }

  return new Map(sourceTexts.map((text, index) => [text, translatedTexts[index] || text]))
}

function translated(map, value) {
  const text = textValue(value)
  return text ? map.get(text) || text : value
}

export function charactersTranslationSource(data) {
  return {
    intro: data.intro,
    characters: data.characters.map((character) => ({
      id: character.id,
      bio: character.bio,
    })),
  }
}

export async function translateCharactersData(data, lang) {
  const map = await translateTextMap([
    ...data.intro,
    ...data.characters.map((character) => character.bio),
  ], lang)

  return {
    ...data,
    intro: data.intro.map((paragraph) => translated(map, paragraph)),
    characters: data.characters.map((character) => ({
      ...character,
      bio: translated(map, character.bio),
    })),
  }
}

export function guideTranslationSource(data) {
  return {
    intro: data.intro,
    collections: data.collections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      items: collection.items.map((item) => ({
        id: item.id,
        description: item.description,
      })),
    })),
  }
}

export async function translateGuideData(data, lang) {
  const map = await translateTextMap([
    ...data.intro,
    ...data.collections.map((collection) => collection.title),
    ...data.collections.flatMap((collection) => collection.items.map((item) => item.description)),
  ], lang)

  return {
    ...data,
    intro: data.intro.map((paragraph) => translated(map, paragraph)),
    collections: data.collections.map((collection) => ({
      ...collection,
      title: translated(map, collection.title),
      items: collection.items.map((item) => ({
        ...item,
        description: translated(map, item.description),
      })),
    })),
  }
}

export function vehiclesTranslationSource(data) {
  return {
    intro: data.intro,
    categories: data.categories.map((category) => ({
      id: category.id,
      intro: category.intro,
      collections: category.collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        items: collection.items.map((item) => ({
          id: item.id,
          description: item.description,
        })),
      })),
    })),
  }
}

export async function translateVehiclesData(data, lang) {
  const map = await translateTextMap([
    ...data.intro,
    ...data.categories.flatMap((category) => category.intro),
    ...data.categories.flatMap((category) => category.collections.map((collection) => collection.title)),
    ...data.categories.flatMap((category) => (
      category.collections.flatMap((collection) => collection.items.map((item) => item.description))
    )),
  ], lang)

  return {
    ...data,
    intro: data.intro.map((paragraph) => translated(map, paragraph)),
    categories: data.categories.map((category) => ({
      ...category,
      intro: category.intro.map((paragraph) => translated(map, paragraph)),
      collections: category.collections.map((collection) => ({
        ...collection,
        title: translated(map, collection.title),
        items: collection.items.map((item) => ({
          ...item,
          description: translated(map, item.description),
        })),
      })),
    })),
  }
}

export function leonidaTranslationSource(data) {
  return {
    intro: data.intro,
  }
}

export async function translateLeonidaData(data, lang) {
  const map = await translateTextMap(data.intro, lang)

  return {
    ...data,
    intro: data.intro.map((paragraph) => translated(map, paragraph)),
  }
}

export function locationPageTranslationSource(page) {
  return {
    description: page.description,
    intro: page.intro,
    sections: page.sections.map((section) => ({
      id: section.id,
      title: section.title,
      paragraphs: section.paragraphs,
    })),
  }
}

export async function translateLocationPageData(page, lang) {
  const map = await translateTextMap([
    page.description,
    ...page.intro,
    ...page.sections.map((section) => section.title),
    ...page.sections.flatMap((section) => section.paragraphs),
  ], lang)

  return {
    ...page,
    description: translated(map, page.description),
    intro: page.intro.map((paragraph) => translated(map, paragraph)),
    sections: page.sections.map((section) => ({
      ...section,
      title: translated(map, section.title),
      paragraphs: section.paragraphs.map((paragraph) => translated(map, paragraph)),
    })),
  }
}

export function newsTranslationSource(articles) {
  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    summary: article.summary,
    type: article.type,
  }))
}

export async function translateNewsArticles(articles, lang) {
  const map = await translateTextMap([
    ...articles.map((article) => article.title),
    ...articles.map((article) => article.summary),
    ...articles.map((article) => article.type),
  ], lang)

  return articles.map((article) => ({
    ...article,
    title: translated(map, article.title),
    summary: translated(map, article.summary),
    type: translated(map, article.type),
  }))
}

export function useTranslatedIgnContent(data, {
  enabled = true,
  lang,
  scope,
  source,
  translate,
}) {
  const [state, setState] = useState({
    key: '',
    data: null,
  })

  const key = useMemo(() => {
    if (!enabled || !data || !source || !shouldTranslate(lang)) return ''
    return cacheKey(scope, lang, source)
  }, [data, enabled, lang, scope, source])

  useEffect(() => {
    if (!key) {
      return undefined
    }

    let canceled = false
    const cached = readCachedContent(key)

    if (cached) {
      Promise.resolve().then(() => {
        if (!canceled) setState({ key, data: cached })
      })

      return () => {
        canceled = true
      }
    }

    if (!TRANSLATE_API_KEY) {
      console.info('IGN translation skipped: VITE_GOOGLE_TRANSLATE_API_KEY is not set.')
      return undefined
    }

    translate(data, lang)
      .then((translatedData) => {
        if (canceled) return
        writeCachedContent(key, translatedData)
        setState({ key, data: translatedData })
      })
      .catch((error) => {
        console.log('IGN translation failed, showing English source:', error)
      })

    return () => {
      canceled = true
    }
  }, [data, key, lang, translate])

  const hasTranslatedData = state.key === key && state.data

  return {
    data: hasTranslatedData ? state.data : data,
    translating: Boolean(key && state.key !== key),
  }
}
