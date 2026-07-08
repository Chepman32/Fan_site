import { useEffect, useState } from 'react'
import { Loader, AlertCircle, ChevronDown, Monitor, Users, Globe, Sparkles } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './GameInfo.css'

// Languages where the Wikipedia article exists under the standard title.
// 'hi' is intentionally absent — falls back to English automatically.
const WIKI_LANGS = { en: 'en', zh: 'zh', ru: 'ru', it: 'it', id: 'id', pl: 'pl', ms: 'ms' }
const WIKI_TITLE = 'Grand_Theft_Auto_VI'
const FALLBACK_EXTRACT = `Grand Theft Auto VI is Rockstar Games' next open-world action-adventure game set in the fictional state of Leonida.
==Setting==
Leonida brings Vice City, coastlines, wetlands, highways, small towns, and social-media-driven local culture into the center of GTA VI coverage.
==Main characters==
The public reveal material centers Lucia Caminos and Jason Duval, with supporting characters connected to crime, music, business, and local communities.
==Platforms and release==
The announced launch platforms are PlayStation 5 and Xbox Series X/S, with the official release date currently set for November 19, 2026.
==Fan guide context==
Leonida Loot separates official information from estimates and speculation so readers can track confirmed details, map clues, vehicles, weapons, and creator assets clearly.`
const ACCORDION_LAYOUT_SPRING = { type: 'spring', stiffness: 460, damping: 38, mass: 0.78 }
const ACCORDION_OPEN_SPRING = { type: 'spring', stiffness: 430, damping: 34, mass: 0.78, velocity: 6 }
const ACCORDION_CLOSE_SPRING = { type: 'spring', stiffness: 520, damping: 40, mass: 0.72, velocity: -6 }
const ACCORDION_CONTENT_SPRING = { type: 'spring', stiffness: 650, damping: 36, mass: 0.6, velocity: 8 }

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

function fallbackWikiData(lang = 'en') {
  return {
    requestLang: lang,
    title: 'Grand Theft Auto VI',
    description: 'Open-world action-adventure game',
    extract: FALLBACK_EXTRACT,
    thumbnail: '',
  }
}

function GameInfo() {
  const { t, lang } = useTranslation()
  const reduceMotion = useReducedMotion()
  const [wikiData, setWikiData] = useState(() => fallbackWikiData(lang))
  const [wikiError, setWikiError] = useState(null)
  const [openSection, setOpenSection] = useState(0)

  const activeWikiData = wikiData?.requestLang === lang ? wikiData : fallbackWikiData(lang)
  const activeError = wikiError?.requestLang === lang ? wikiError.message : null
  const loading = false

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
          setOpenSection(0)
          setWikiData({
            requestLang: lang,
            title: summary.title,
            description: summary.description,
            extract: fullExtract,
            thumbnail: summary.thumbnail?.source,
          })
          setWikiError(null)
          return
        } catch {
          // try next language
        }
      }
      if (!cancelled) {
        setWikiData(fallbackWikiData(lang))
        setWikiError(null)
      }
    }

    fetchWikiData()
    return () => {
      cancelled = true
    }
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
  const accordionSections = sections.slice(0, 4).map((section) => ({
    ...section,
    title: section.title || activeWikiData?.description || t.gameInfo.title,
  }))

  return (
    <section id="game-info" className="section-padding game-info">
      <div className="container">
        <div className="section-header">
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
                  <img src={activeWikiData.thumbnail} alt="Grand Theft Auto VI cover art" loading="lazy" decoding="async" />
                  <div className="image-glow"></div>
                </div>
              )}

              <div className="info-text">
                <div className="game-info-accordion">
                  {accordionSections.map((section, index) => {
                    const isOpen = openSection === index
                    const buttonId = `game-info-trigger-${index}`
                    const panelId = `game-info-panel-${index}`

                    return (
                      <motion.article
                        key={`${section.title}-${index}`}
                        className={`game-info-accordion-item${isOpen ? ' is-open' : ''}`}
                        layout={!reduceMotion}
                        transition={reduceMotion ? { duration: 0 } : { layout: ACCORDION_LAYOUT_SPRING }}
                      >
                        <h3>
                          <motion.button
                            id={buttonId}
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            onClick={() => setOpenSection(isOpen ? null : index)}
                            whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                            transition={reduceMotion ? { duration: 0 } : ACCORDION_CONTENT_SPRING}
                          >
                            <span className="game-info-accordion-index">{String(index + 1).padStart(2, '0')}</span>
                            <span>{section.title}</span>
                            <motion.span
                              className="game-info-accordion-chevron"
                              aria-hidden="true"
                              animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.08 : 1 }}
                              transition={reduceMotion ? { duration: 0 } : ACCORDION_CONTENT_SPRING}
                            >
                              <ChevronDown size={20} />
                            </motion.span>
                          </motion.button>
                        </h3>
                        <AnimatePresence initial={false}>
                          {isOpen && section.content && (
                            <motion.div
                              id={panelId}
                              className="game-info-accordion-panel"
                              role="region"
                              aria-labelledby={buttonId}
                              initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                              animate={{
                                height: 'auto',
                                opacity: 1,
                                transition: reduceMotion
                                  ? { duration: 0 }
                                  : { height: ACCORDION_OPEN_SPRING, opacity: { duration: 0.18, delay: 0.04 } },
                              }}
                              exit={{
                                height: 0,
                                opacity: 0,
                                transition: reduceMotion
                                  ? { duration: 0 }
                                  : { height: ACCORDION_CLOSE_SPRING, opacity: { duration: 0.12 } },
                              }}
                            >
                              <motion.div
                                className="game-info-accordion-panel-inner"
                                initial={reduceMotion ? false : { y: -10, scale: 0.985 }}
                                animate={{ y: 0, scale: 1 }}
                                exit={reduceMotion ? undefined : { y: -7, scale: 0.99 }}
                                transition={reduceMotion ? { duration: 0 } : ACCORDION_CONTENT_SPRING}
                              >
                                <p>{section.content}</p>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.article>
                    )
                  })}
                </div>
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
