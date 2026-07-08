import { ArrowLeft, ArrowRight, BookOpenText, CalendarDays } from 'lucide-react'
import { SEO_GUIDES, getSeoGuide } from '../data/guideContent'
import './GuidePage.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function navigateInternally(event, href, onNavigate) {
  if (!onNavigate || !isPlainLeftClick(event)) return
  event.preventDefault()
  onNavigate(href)
}

function GuideBreadcrumbs({ guide, onNavigate }) {
  return (
    <nav className="guide-breadcrumbs" aria-label="Breadcrumb">
      <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>Home</a>
      <a href="/guides" onClick={(event) => navigateInternally(event, '/guides', onNavigate)}>Guides</a>
      {guide && <span>{guide.title}</span>}
    </nav>
  )
}

function GuidesHub({ onNavigate }) {
  return (
    <section className="guide-page section-padding">
      <div className="container guide-shell">
        <GuideBreadcrumbs onNavigate={onNavigate} />
        <header className="guide-hero">
          <span><BookOpenText size={16} /> GTA VI guide library</span>
          <h1>GTA VI Guides: Release Date, Map, Characters, Vehicles and Weapons</h1>
          <p>
            Evergreen GTA VI explainers for confirmed details, official source context,
            Leonida map clues, trailer analysis, and creator-marketplace discovery.
          </p>
        </header>

        <div className="guide-grid">
          {SEO_GUIDES.map((guide) => (
            <a
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="guide-card"
              onClick={(event) => navigateInternally(event, `/guides/${guide.slug}`, onNavigate)}
            >
              <span>
                <CalendarDays size={14} />
                Updated {guide.updatedAt}
              </span>
              <h2>{guide.title}</h2>
              <p>{guide.summary}</p>
              <strong>
                Read guide
                <ArrowRight size={16} />
              </strong>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function GuideArticle({ guide, onNavigate }) {
  return (
    <article className="guide-page section-padding">
      <div className="container guide-shell">
        <GuideBreadcrumbs guide={guide} onNavigate={onNavigate} />
        <a className="guide-back" href="/guides" onClick={(event) => navigateInternally(event, '/guides', onNavigate)}>
          <ArrowLeft size={16} />
          Back to guides
        </a>
        <header className="guide-hero guide-article-hero">
          <span><CalendarDays size={16} /> Last updated {guide.updatedAt}</span>
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
          <h2>Related GTA VI hubs</h2>
          <div>
            {[
              ['/news', 'Latest GTA VI news'],
              ['/locations', 'Leonida locations'],
              ['/characters', 'Characters'],
              ['/vehicles', 'Vehicles'],
              ['/shop', 'Creator shop'],
              ['/p2p', 'P2P marketplace'],
            ].map(([href, label]) => (
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
  if (!slug) return <GuidesHub onNavigate={onNavigate} />

  const guide = getSeoGuide(slug)

  if (!guide) {
    return (
      <section className="guide-page section-padding">
        <div className="container guide-shell">
          <GuideBreadcrumbs onNavigate={onNavigate} />
          <div className="guide-empty">
            <h1>Guide not found</h1>
            <p>This GTA VI guide is not available yet. Browse the current release, map, character, vehicle, and weapon guides.</p>
            <a href="/guides" onClick={(event) => navigateInternally(event, '/guides', onNavigate)}>
              Browse guides
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>
    )
  }

  return <GuideArticle guide={guide} onNavigate={onNavigate} />
}

export default GuidePage
