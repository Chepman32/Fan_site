import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { getTrustPage } from '../data/trustPages'
import './TrustPage.css'

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.altKey && !event.ctrlKey && !event.shiftKey
}

function navigateInternally(event, href, onNavigate) {
  if (!onNavigate || !isPlainLeftClick(event)) return
  event.preventDefault()
  onNavigate(href)
}

function TrustPage({ slug, onNavigate }) {
  const page = getTrustPage(slug)

  if (!page) {
    return (
      <section className="trust-page section-padding">
        <div className="container trust-shell">
          <nav className="trust-breadcrumbs" aria-label="Breadcrumb">
            <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>Home</a>
          </nav>
          <div className="trust-empty">
            <h1>Page not found</h1>
            <p>This policy page is not available.</p>
            <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>
              Back home
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
        <nav className="trust-breadcrumbs" aria-label="Breadcrumb">
          <a href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>Home</a>
          <span>{page.title}</span>
        </nav>

        <a className="trust-back" href="/" onClick={(event) => navigateInternally(event, '/', onNavigate)}>
          <ArrowLeft size={16} />
          Back home
        </a>

        <header className="trust-hero">
          <span><ShieldCheck size={16} /> Leonida Loot trust center</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </header>

        <div className="trust-sections">
          {page.sections.map((section) => (
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
