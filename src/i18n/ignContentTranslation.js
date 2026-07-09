import { useEffect, useMemo, useState } from 'react'

const CACHE_PREFIX = 'gtavi:ign-translation'
const CACHE_VERSION = 'v2'
const MAX_CACHE_ENTRIES = 48
const MAX_BATCH_ITEMS = 80
const MAX_BATCH_CHARS = 24000

const TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY?.trim() || ''

const GOOGLE_TARGET_LANGUAGES = {
  zh: 'zh-CN',
}

const DEFAULT_TRANSLATABLE_KEYS = new Set([
  'answer',
  'alt',
  'body',
  'caption',
  'categoryLabel',
  'description',
  'galleryAlt',
  'heading',
  'key',
  'label',
  'license',
  'longDescription',
  'name',
  'question',
  'seoDescription',
  'shortDescription',
  'shortTitle',
  'subtitle',
  'summary',
  'text',
  'title',
  'value',
])

const DEFAULT_TRANSLATABLE_ARRAY_KEYS = new Set([
  'points',
  'included',
  'intro',
  'longCopy',
  'paragraphs',
])

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
      name: character.name,
      bio: character.bio,
    })),
  }
}

export async function translateCharactersData(data, lang) {
  const map = await translateTextMap([
    ...data.intro,
    ...data.characters.map((character) => character.name),
    ...data.characters.map((character) => character.bio),
    ...data.characters.map((character) => character.imageTitle),
  ], lang)

  return {
    ...data,
    intro: data.intro.map((paragraph) => translated(map, paragraph)),
    characters: data.characters.map((character) => ({
      ...character,
      name: translated(map, character.name),
      bio: translated(map, character.bio),
      imageTitle: translated(map, character.imageTitle),
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
        name: item.name,
        description: item.description,
      })),
    })),
    extraImages: data.extraImages.map((image) => ({
      id: image.id,
      title: image.title,
    })),
  }
}

export async function translateGuideData(data, lang) {
  const map = await translateTextMap([
    ...data.intro,
    ...data.collections.map((collection) => collection.title),
    ...data.collections.flatMap((collection) => collection.items.map((item) => item.name)),
    ...data.collections.flatMap((collection) => collection.items.map((item) => item.description)),
    ...data.collections.flatMap((collection) => collection.items.map((item) => item.imageTitle)),
    ...data.extraImages.map((image) => image.title),
  ], lang)

  return {
    ...data,
    intro: data.intro.map((paragraph) => translated(map, paragraph)),
    collections: data.collections.map((collection) => ({
      ...collection,
      title: translated(map, collection.title),
      items: collection.items.map((item) => ({
        ...item,
        name: translated(map, item.name),
        description: translated(map, item.description),
        imageTitle: translated(map, item.imageTitle),
      })),
    })),
    extraImages: data.extraImages.map((image) => ({
      ...image,
      title: translated(map, image.title),
    })),
  }
}

export function vehiclesTranslationSource(data, { translateNames = true } = {}) {
  return {
    translateNames,
    intro: data.intro,
    categories: data.categories.map((category) => ({
      id: category.id,
      intro: category.intro,
      collections: category.collections.map((collection) => ({
        id: collection.id,
        title: collection.title,
        items: collection.items.map((item) => {
          const source = {
            id: item.id,
            description: item.description,
          }

          if (translateNames) {
            source.name = item.name
            source.imageTitle = item.imageTitle
          }

          return source
        }),
      })),
      extraImages: category.extraImages.map((image) => ({
        id: image.id,
        title: image.title,
      })),
    })),
    images: data.images.map((image) => ({
      id: image.id,
      title: image.title,
    })),
  }
}

export async function translateVehiclesData(data, lang, { translateNames = true } = {}) {
  const vehicleNameTexts = translateNames
    ? data.categories.flatMap((category) => (
      category.collections.flatMap((collection) => collection.items.map((item) => item.name))
    ))
    : []
  const vehicleImageTitleTexts = translateNames
    ? data.categories.flatMap((category) => (
      category.collections.flatMap((collection) => collection.items.map((item) => item.imageTitle))
    ))
    : []

  const map = await translateTextMap([
    ...data.intro,
    ...data.categories.flatMap((category) => category.intro),
    ...data.categories.flatMap((category) => category.collections.map((collection) => collection.title)),
    ...vehicleNameTexts,
    ...data.categories.flatMap((category) => (
      category.collections.flatMap((collection) => collection.items.map((item) => item.description))
    )),
    ...vehicleImageTitleTexts,
    ...data.images.map((image) => image.title),
    ...data.categories.flatMap((category) => category.extraImages.map((image) => image.title)),
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
          name: translateNames ? translated(map, item.name) : item.name,
          description: translated(map, item.description),
          imageTitle: translateNames ? translated(map, item.imageTitle) : item.imageTitle,
        })),
      })),
      extraImages: category.extraImages.map((image) => ({
        ...image,
        title: translated(map, image.title),
      })),
    })),
    images: data.images.map((image) => ({
      ...image,
      title: translated(map, image.title),
    })),
  }
}

export function leonidaTranslationSource(data) {
  return {
    intro: data.intro,
    majorLocations: data.majorLocations.map((location) => ({
      id: location.id,
      name: location.name,
    })),
    otherLocations: data.otherLocations,
    businesses: data.businesses,
    images: data.images.map((image) => ({
      id: image.id,
      title: image.title,
    })),
  }
}

export async function translateLeonidaData(data, lang) {
  const map = await translateTextMap([
    ...data.intro,
    ...data.majorLocations.map((location) => location.name),
    ...data.otherLocations,
    ...data.businesses,
    ...data.images.map((image) => image.title),
  ], lang)

  return {
    ...data,
    intro: data.intro.map((paragraph) => translated(map, paragraph)),
    majorLocations: data.majorLocations.map((location) => ({
      ...location,
      name: translated(map, location.name),
    })),
    otherLocations: data.otherLocations.map((location) => translated(map, location)),
    businesses: data.businesses.map((business) => translated(map, business)),
    images: data.images.map((image) => ({
      ...image,
      title: translated(map, image.title),
    })),
  }
}

export function locationPageTranslationSource(page) {
  return {
    title: page.title,
    description: page.description,
    intro: page.intro,
    sections: page.sections.map((section) => ({
      id: section.id,
      title: section.title,
      paragraphs: section.paragraphs,
      links: section.links.map((link) => ({
        id: link.id,
        name: link.name,
      })),
    })),
    relatedLinks: page.relatedLinks.map((link) => ({
      id: link.id,
      name: link.name,
    })),
    images: page.images.map((image) => ({
      id: image.id,
      title: image.title,
    })),
  }
}

export async function translateLocationPageData(page, lang) {
  const map = await translateTextMap([
    page.title,
    page.description,
    ...page.intro,
    ...page.sections.map((section) => section.title),
    ...page.sections.flatMap((section) => section.paragraphs),
    ...page.sections.flatMap((section) => section.links.map((link) => link.name)),
    ...page.relatedLinks.map((link) => link.name),
    ...page.images.map((image) => image.title),
  ], lang)

  return {
    ...page,
    title: translated(map, page.title),
    description: translated(map, page.description),
    intro: page.intro.map((paragraph) => translated(map, paragraph)),
    sections: page.sections.map((section) => ({
      ...section,
      title: translated(map, section.title),
      paragraphs: section.paragraphs.map((paragraph) => translated(map, paragraph)),
      links: section.links.map((link) => ({
        ...link,
        name: translated(map, link.name),
      })),
    })),
    relatedLinks: page.relatedLinks.map((link) => ({
      ...link,
      name: translated(map, link.name),
    })),
    images: page.images.map((image) => ({
      ...image,
      title: translated(map, image.title),
    })),
  }
}

export function newsTranslationSource(articles) {
  return articles.map((article) => ({
    id: article.id,
    title: article.title,
    description: article.description,
    summary: article.summary,
    type: article.type,
    categoryLabel: article.categoryLabel,
  }))
}

export async function translateNewsArticles(articles, lang) {
  const map = await translateTextMap([
    ...articles.map((article) => article.title),
    ...articles.map((article) => article.description),
    ...articles.map((article) => article.summary),
    ...articles.map((article) => article.type),
    ...articles.map((article) => article.categoryLabel),
  ], lang)

  return articles.map((article) => ({
    ...article,
    title: translated(map, article.title),
    description: translated(map, article.description),
    summary: translated(map, article.summary),
    type: translated(map, article.type),
    categoryLabel: translated(map, article.categoryLabel),
  }))
}

export function newsArticleTranslationSource(article) {
  return {
    id: article.id,
    title: article.title,
    description: article.description,
    blocks: (article.blocks || []).map((block) => ({
      type: block.type,
      text: block.text,
      title: block.title,
      caption: block.caption,
      alt: block.alt,
      sources: (block.sources || []).map((source) => ({
        label: source.label,
      })),
      segments: (block.segments || []).map((segment) => ({
        type: segment.type,
        text: segment.text,
      })),
    })),
  }
}

export async function translateNewsArticle(article, lang) {
  const blocks = article.blocks || []
  const map = await translateTextMap([
    article.title,
    article.description,
    ...blocks.flatMap((block) => [
      block.text,
      block.title,
      block.caption,
      block.alt,
      ...(block.sources || []).map((source) => source.label),
      ...(block.segments || []).map((segment) => segment.text),
    ]),
  ], lang)

  return {
    ...article,
    title: translated(map, article.title),
    description: translated(map, article.description),
    blocks: blocks.map((block) => ({
      ...block,
      text: translated(map, block.text),
      title: translated(map, block.title),
      caption: translated(map, block.caption),
      alt: translated(map, block.alt),
      sources: (block.sources || []).map((source) => ({
        ...source,
        label: translated(map, source.label),
      })),
      segments: (block.segments || []).map((segment) => ({
        ...segment,
        text: translated(map, segment.text),
      })),
    })),
  }
}

function translatableKeySet(keys) {
  const nextKeys = new Set(DEFAULT_TRANSLATABLE_KEYS)
  if (Array.isArray(keys)) {
    keys.forEach((key) => nextKeys.add(key))
  }
  return nextKeys
}

function translatableOptionsKeySet({ keys, onlyKeys, excludeKeys } = {}) {
  const nextKeys = Array.isArray(onlyKeys)
    ? new Set(onlyKeys)
    : new Set(translatableKeySet(keys))

  if (Array.isArray(excludeKeys)) {
    excludeKeys.forEach((key) => nextKeys.delete(key))
  }

  return nextKeys
}

function translatableArrayKeySet(arrayKeys) {
  const nextKeys = new Set(DEFAULT_TRANSLATABLE_ARRAY_KEYS)
  if (Array.isArray(arrayKeys)) {
    arrayKeys.forEach((key) => nextKeys.add(key))
  }
  return nextKeys
}

function translatableOptionsArrayKeySet({ arrayKeys, onlyArrayKeys, excludeArrayKeys } = {}) {
  const nextKeys = Array.isArray(onlyArrayKeys)
    ? new Set(onlyArrayKeys)
    : new Set(translatableArrayKeySet(arrayKeys))

  if (Array.isArray(excludeArrayKeys)) {
    excludeArrayKeys.forEach((key) => nextKeys.delete(key))
  }

  return nextKeys
}

function isTranslatableStringKey(key, options = {}) {
  return translatableOptionsKeySet(options).has(key)
}

function isTranslatableStringArrayKey(key, options = {}) {
  return translatableOptionsArrayKeySet(options).has(key)
}

function collectPlainContentTexts(value, options = {}, parentKey = '') {
  if (typeof value === 'string') {
    return isTranslatableStringArrayKey(parentKey, options) ? [value] : []
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectPlainContentTexts(item, options, parentKey))
  }

  if (!value || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([key, item]) => {
    if (typeof item === 'string') {
      return isTranslatableStringKey(key, options) ? [item] : []
    }

    return collectPlainContentTexts(item, options, key)
  })
}

function plainContentSource(value, options = {}, parentKey = '') {
  if (typeof value === 'string') {
    return isTranslatableStringArrayKey(parentKey, options) ? value : undefined
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => plainContentSource(item, options, parentKey))
      .filter((item) => item !== undefined)

    return items.length ? items : undefined
  }

  if (!value || typeof value !== 'object') return undefined

  const entries = Object.entries(value)
    .map(([key, item]) => {
      if (typeof item === 'string') {
        return isTranslatableStringKey(key, options) ? [key, item] : null
      }

      const nested = plainContentSource(item, options, key)
      return nested === undefined ? null : [key, nested]
    })
    .filter(Boolean)

  return entries.length ? Object.fromEntries(entries) : undefined
}

function translatePlainContentValue(value, map, options = {}, parentKey = '') {
  if (typeof value === 'string') {
    return isTranslatableStringArrayKey(parentKey, options) ? translated(map, value) : value
  }

  if (Array.isArray(value)) {
    return value.map((item) => translatePlainContentValue(item, map, options, parentKey))
  }

  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => {
      if (typeof item === 'string' && isTranslatableStringKey(key, options)) {
        return [key, translated(map, item)]
      }

      return [key, translatePlainContentValue(item, map, options, key)]
    }),
  )
}

export function plainContentTranslationSource(data, options = {}) {
  return plainContentSource(data, options) || null
}

export async function translatePlainContent(data, lang, options = {}) {
  const map = await translateTextMap(collectPlainContentTexts(data, options), lang)
  return translatePlainContentValue(data, map, options)
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
    translated: Boolean(hasTranslatedData),
  }
}
