import { useEffect, useRef } from 'react'

const SITE_NAME = 'Leonida Loot'

function upsertMeta(attribute, key, content) {
  if (!content) return

  const selector = `meta[${attribute}="${key}"]`
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

function upsertLink(rel, href) {
  if (!href) return

  let element = document.head.querySelector(`link[rel="${rel}"]`)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

function upsertJsonLd(metadata, createJsonLd) {
  const id = 'structured-data'
  let element = document.getElementById(id)

  if (!element) {
    element = document.createElement('script')
    element.id = id
    element.type = 'application/ld+json'
    document.head.appendChild(element)
  }

  element.textContent = JSON.stringify(createJsonLd(metadata))
}

function applyMetadata(metadata, createJsonLd) {
  document.title = metadata.title

  upsertMeta('name', 'description', metadata.description)
  upsertMeta('name', 'robots', metadata.robots)
  upsertMeta('name', 'author', SITE_NAME)
  upsertMeta('name', 'application-name', SITE_NAME)

  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:title', metadata.title)
  upsertMeta('property', 'og:description', metadata.description)
  upsertMeta('property', 'og:type', metadata.type)
  upsertMeta('property', 'og:url', metadata.canonicalUrl)
  upsertMeta('property', 'og:image', metadata.image)
  upsertMeta('property', 'og:image:alt', metadata.imageAlt)

  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', metadata.title)
  upsertMeta('name', 'twitter:description', metadata.description)
  upsertMeta('name', 'twitter:image', metadata.image)
  upsertMeta('name', 'twitter:image:alt', metadata.imageAlt)

  upsertLink('canonical', metadata.canonicalUrl)
  upsertJsonLd(metadata, createJsonLd)
}

function SeoHead({ metadata, route = '/', state, currentProfile, lang = 'en' }) {
  const initialRouteRef = useRef(route)
  const hasNavigatedRef = useRef(false)

  useEffect(() => {
    document.documentElement.lang = lang || 'en'
  }, [lang])

  useEffect(() => {
    if (!metadata && route !== initialRouteRef.current) {
      hasNavigatedRef.current = true
    }

    if (!metadata && !hasNavigatedRef.current) return undefined

    let canceled = false

    import('./seoConfig').then(({ createJsonLd, createSeoMetadata }) => {
      if (canceled) return

      const nextMetadata = metadata || createSeoMetadata({ route, state, currentProfile })
      applyMetadata(nextMetadata, createJsonLd)
    })

    return () => {
      canceled = true
    }
  }, [currentProfile, metadata, route, state])

  return null
}

export default SeoHead
