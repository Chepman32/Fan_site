import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, BookOpenText, CalendarDays } from 'lucide-react'
import { SEO_GUIDES, getSeoGuide } from '../data/guideContent'
import { plainContentTranslationSource, translatePlainContent, useTranslatedIgnContent } from '../i18n/ignContentTranslation'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './GuidePage.css'

const GUIDE_CHROME = {
  breadcrumbLabel: 'Breadcrumb',
  home: 'Home',
  guides: 'Guides',
  libraryBadge: 'GTA VI guide library',
  libraryTitle: 'GTA VI Guides: Release Date, Map, Characters, Vehicles and Weapons',
  libraryDescription: 'Evergreen GTA VI explainers for confirmed details, official source context, Leonida map clues, trailer analysis, and creator-marketplace discovery.',
  updated: 'Updated',
  readGuide: 'Read guide',
  backToGuides: 'Back to guides',
  lastUpdated: 'Last updated',
  relatedTitle: 'Related GTA VI hubs',
  relatedLinks: [
    { href: '/news', label: 'Latest GTA VI news' },
    { href: '/locations', label: 'Leonida locations' },
    { href: '/characters', label: 'Characters' },
    { href: '/vehicles', label: 'Vehicles' },
    { href: '/shop', label: 'Creator shop' },
    { href: '/p2p', label: 'P2P marketplace' },
  ],
  notFoundTitle: 'Guide not found',
  notFoundDescription: 'This GTA VI guide is not available yet. Browse the current release, map, character, vehicle, and weapon guides.',
  browseGuides: 'Browse guides',
}
const GUIDE_CHROME_TRANSLATION_OPTIONS = {
  keys: [
    'backToGuides',
    'breadcrumbLabel',
    'browseGuides',
    'guides',
    'home',
    'lastUpdated',
    'libraryBadge',
    'libraryDescription',
    'libraryTitle',
    'notFoundDescription',
    'notFoundTitle',
    'readGuide',
    'relatedTitle',
    'updated',
  ],
}

function translateGuideChrome(data, lang) {
  return translatePlainContent(data, lang, GUIDE_CHROME_TRANSLATION_OPTIONS)
}

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function navigateInternally(event, href, onNavigate) {
  if (!onNavigate || !isPlainLeftClick(event)) return
  event.preventDefault()
  onNavigate(href)
}

function GuideBreadcrumbs({ guide, onNavigate, copy }) {
  return (
    <nav className="guide-breadcrumbs" aria-label={copy.breadcrumbLabel}>
      <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>{copy.home}</a>
      <a href="/guides" onClick={(event) => navigateInternally(event, '/guides', onNavigate)}>{copy.guides}</a>
      {guide && <span>{guide.title}</span>}
    </nav>
  )
}

function GuidesHub({ onNavigate, guides, copy }) {
  return (
    <section className="guide-page section-padding">
      <div className="container guide-shell">
        <GuideBreadcrumbs onNavigate={onNavigate} copy={copy} />
        <header className="guide-hero">
          <span><BookOpenText size={16} /> {copy.libraryBadge}</span>
          <h1>{copy.libraryTitle}</h1>
          <p>{copy.libraryDescription}</p>
        </header>

        <div className="guide-grid">
          {guides.map((guide) => (
            <a
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="guide-card"
              onClick={(event) => navigateInternally(event, `/guides/${guide.slug}`, onNavigate)}
            >
              <span>
                <CalendarDays size={14} />
                {copy.updated} {guide.updatedAt}
              </span>
              <h2>{guide.title}</h2>
              <p>{guide.summary}</p>
              <strong>
                {copy.readGuide}
                <ArrowRight size={16} />
              </strong>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function GuideArticle({ guide, onNavigate, copy }) {
  return (
    <article className="guide-page section-padding">
      <div className="container guide-shell">
        <GuideBreadcrumbs guide={guide} onNavigate={onNavigate} copy={copy} />
        <a className="guide-back" href="/guides" onClick={(event) => navigateInternally(event, '/guides', onNavigate)}>
          <ArrowLeft size={16} />
          {copy.backToGuides}
        </a>
        <header className="guide-hero guide-article-hero">
          <span><CalendarDays size={16} /> {copy.lastUpdated} {guide.updatedAt}</span>
          <h1>{guide.title}</h1>
          <p>{guide.summary}</p>
        </header>

        <div className="guide-article-body">
          {guide.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        <aside className="guide-related">
          <h2>{copy.relatedTitle}</h2>
          <div>
            {copy.relatedLinks.map(({ href, label }) => (
              <a key={href} href={href} onClick={(event) => navigateInternally(event, href, onNavigate)}>
                {label}
                <ArrowRight size={14} />
              </a>
            ))}
          </div>
        </aside>
      </div>
    </article>
  )
}

function GuidePage({ slug = '', onNavigate }) {
  const { lang } = useTranslation()
  const guideSource = useMemo(() => plainContentTranslationSource(SEO_GUIDES), [])
  const chromeSource = useMemo(() => plainContentTranslationSource(GUIDE_CHROME, GUIDE_CHROME_TRANSLATION_OPTIONS), [])
  const { data: displayGuides } = useTranslatedIgnContent(SEO_GUIDES, {
    lang,
    scope: 'seo-guides',
    source: guideSource,
    translate: translatePlainContent,
  })
  const { data: copy } = useTranslatedIgnContent(GUIDE_CHROME, {
    lang,
    scope: 'guide-page-chrome',
    source: chromeSource,
    translate: translateGuideChrome,
  })

  if (!slug) return <GuidesHub onNavigate={onNavigate} guides={displayGuides} copy={copy} />

  const guide = displayGuides.find((item) => item.slug === slug) || getSeoGuide(slug)

  if (!guide) {
    return (
      <section className="guide-page section-padding">
        <div className="container guide-shell">
          <GuideBreadcrumbs onNavigate={onNavigate} copy={copy} />
          <div className="guide-empty">
            <h1>{copy.notFoundTitle}</h1>
            <p>{copy.notFoundDescription}</p>
            <a href="/guides" onClick={(event) => navigateInternally(event, '/guides', onNavigate)}>
              {copy.browseGuides}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    )
  }

  return <GuideArticle guide={guide} onNavigate={onNavigate} copy={copy} />
}

export default GuidePage
