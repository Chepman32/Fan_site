import { useMemo } from 'react'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { getTrustPage } from '../data/trustPages'
import { plainContentTranslationSource, translatePlainContent, useTranslatedIgnContent } from '../i18n/ignContentTranslation'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './TrustPage.css'

const TRUST_CHROME = {
  breadcrumbLabel: 'Breadcrumb',
  home: 'Home',
  pageNotFound: 'Page not found',
  pageUnavailable: 'This policy page is not available.',
  backHome: 'Back home',
  trustCenter: 'Leonida Loot trust center',
}
const TRUST_CHROME_TRANSLATION_OPTIONS = {
  keys: ['backHome', 'breadcrumbLabel', 'home', 'pageNotFound', 'pageUnavailable', 'trustCenter'],
}

function translateTrustChrome(data, lang) {
  return translatePlainContent(data, lang, TRUST_CHROME_TRANSLATION_OPTIONS)
}

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function navigateInternally(event, href, onNavigate) {
  if (!onNavigate || !isPlainLeftClick(event)) return
  event.preventDefault()
  onNavigate(href)
}

function TrustPage({ slug, onNavigate }) {
  const { lang } = useTranslation()
  const page = getTrustPage(slug)
  const pageSource = useMemo(() => (page ? plainContentTranslationSource(page) : null), [page])
  const chromeSource = useMemo(() => plainContentTranslationSource(TRUST_CHROME, TRUST_CHROME_TRANSLATION_OPTIONS), [])
  const { data: displayPage } = useTranslatedIgnContent(page, {
    enabled: Boolean(page),
    lang,
    scope: `trust-page-${slug}`,
    source: pageSource,
    translate: translatePlainContent,
  })
  const { data: copy } = useTranslatedIgnContent(TRUST_CHROME, {
    lang,
    scope: 'trust-page-chrome',
    source: chromeSource,
    translate: translateTrustChrome,
  })

  if (!page) {
    return (
      <section className="trust-page section-padding">
        <div className="container trust-shell">
          <nav className="trust-breadcrumbs" aria-label={copy.breadcrumbLabel}>
            <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>{copy.home}</a>
          </nav>
          <div className="trust-empty">
            <h1>{copy.pageNotFound}</h1>
            <p>{copy.pageUnavailable}</p>
            <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>
              {copy.backHome}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    )
  }

  return (
    <article className="trust-page section-padding">
      <div className="container trust-shell">
        <nav className="trust-breadcrumbs" aria-label={copy.breadcrumbLabel}>
          <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>{copy.home}</a>
          <span>{displayPage.title}</span>
        </nav>

        <a className="trust-back" href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>
          <ArrowLeft size={16} />
          {copy.backHome}
        </a>

        <header className="trust-hero">
          <span><ShieldCheck size={16} /> {copy.trustCenter}</span>
          <h1>{displayPage.title}</h1>
          <p>{displayPage.description}</p>
        </header>

        <div className="trust-sections">
          {displayPage.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </article>
  )
}

export default TrustPage
