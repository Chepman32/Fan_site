import { useEffect, useState } from 'react'
import { Info, Loader, AlertCircle, Monitor, Users, Globe, Sparkles } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './GameInfo.css'

// Languages where the Wikipedia article exists under the standard title.
// 'hi' is intentionally absent — falls back to English automatically.
const WIKI_LANGS = { en: 'en', zh: 'zh', ru: 'ru', it: 'it', id: 'id', pl: 'pl', ms: 'ms' }
const WIKI_TITLE = 'Grand_Theft_Auto_VI'

function normalizeWikiText(value = '') {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/(^|\n)(={2,}\s*[^=\n]+?\s*={2,})[ \t]*(?=\S)/g, '$1$2\n')
}

function cleanWikiText(value = '') {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function formatExtract(text) {
  if (!text) return []

  const sections = []
  let current = { title: null, lines: [] }

  normalizeWikiText(text).split('\n').forEach((line) => {
    const heading = line.match(/^={2,}\s*(.*?)\s*={2,}$/)

    if (heading) {
      if (current.title || current.lines.length) {
        sections.push(current)
      }
      current = { title: cleanWikiText(heading[1]), lines: [] }
      return
    }

    const cleaned = cleanWikiText(line)
    if (cleaned) {
      current.lines.push(cleaned)
    }
  })

  if (current.title || current.lines.length) {
    sections.push(current)
  }

  return sections
    .map((section) => ({
      title: section.title,
      content: cleanWikiText(section.lines.join(' ')),
    }))
    .filter((section) => section.title || section.content)
}

function GameInfo() {
  const { t, lang } = useTranslation()
  const [wikiData, setWikiData] = useState(null)
  const [wikiError, setWikiError] = useState(null)

  const activeWikiData = wikiData?.requestLang === lang ? wikiData : null
  const activeError = wikiError?.requestLang === lang ? wikiError.message : null
  const loading = !activeWikiData && !activeError

  useEffect(() => {
    const wikiLang = WIKI_LANGS[lang] ?? 'en'
    let cancelled = false

    const fetchWikiData = async () => {
      const langs = wikiLang !== 'en' ? [wikiLang, 'en'] : ['en']

      for (const l of langs) {
        try {
          const summaryRes = await fetch(
            `https://${l}.wikipedia.org/api/rest_v1/page/summary/${WIKI_TITLE}`
          )
          if (!summaryRes.ok) continue
          const summary = await summaryRes.json()
          if (summary.type !== 'standard') continue

          const extractRes = await fetch(
            `https://${l}.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=${WIKI_TITLE}&format=json&origin=*`
          )
          const extractData = await extractRes.json()
          const page = Object.values(extractData.query.pages)[0]
          const fullExtract = page.extract || summary.extract

          if (cancelled) return
          setWikiData({
            requestLang: lang,
            title: summary.title,
            description: summary.description,
            extract: fullExtract,
            thumbnail: summary.thumbnail?.source,
            wikiUrl: summary.content_urls?.desktop?.page,
          })
          setWikiError(null)
          return
        } catch {
          // try next language
        }
      }
      if (!cancelled) {
        setWikiError({ requestLang: lang, message: t.gameInfo.error })
      }
    }

    fetchWikiData()
    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const features = [
    {
      icon: <Globe size={24} />,
      title: t.gameInfo.features.openWorld.title,
      description: t.gameInfo.features.openWorld.description,
    },
    {
      icon: <Users size={24} />,
      title: t.gameInfo.features.dualProtagonists.title,
      description: t.gameInfo.features.dualProtagonists.description,
    },
    {
      icon: <Monitor size={24} />,
      title: t.gameInfo.features.nextGen.title,
      description: t.gameInfo.features.nextGen.description,
    },
    {
      icon: <Sparkles size={24} />,
      title: t.gameInfo.features.rage.title,
      description: t.gameInfo.features.rage.description,
    },
  ]

  const sections = activeWikiData ? formatExtract(activeWikiData.extract) : []

  return (
    <section id="game-info" className="section-padding game-info">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <Info size={14} />
            <span>{t.gameInfo.badge}</span>
          </div>
          <h2 className="section-title">{t.gameInfo.title} <span className="gradient-text">{t.gameInfo.titleHighlight}</span></h2>
        </div>

        {loading && (
          <div className="loading-state">
            <Loader size={32} className="animate-spin" />
            <p>{t.gameInfo.loading}</p>
          </div>
        )}

        {activeError && (
          <div className="error-state">
            <AlertCircle size={24} />
            <p>{activeError}</p>
          </div>
        )}

        {!loading && !activeError && activeWikiData && (
          <div className="game-info-content">
            <div className="info-main">
              {activeWikiData.thumbnail && (
                <div className="info-image">
                  <img src={activeWikiData.thumbnail} alt="GTA VI Cover" />
                  <div className="image-glow"></div>
                </div>
              )}

              <div className="info-text">
                <p className="info-description">{activeWikiData.description}</p>
                <div className="info-extract">
                  {sections.slice(0, 4).map((section, index) => {
                    return (
                      <div key={index} className="extract-section">
                        {section.title && <h4>{section.title}</h4>}
                        {section.content && <p>{section.content}</p>}
                      </div>
                    )
                  })}
                </div>
                <a 
                  href={activeWikiData.wikiUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="wiki-link"
                >
                  {t.gameInfo.readMore}
                </a>
              </div>
            </div>

            <div className="features-grid">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="feature-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="feature-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default GameInfo
