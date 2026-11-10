import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { gameOverview } from '../content/gameOverview'
import { rockstarPromoMedia } from '../data/rockstarPromoMedia'
import { plainContentTranslationSource, translatePlainContent, useTranslatedIgnContent } from '../i18n/ignContentTranslation'
import './GameInfo.css'

const ACCORDION_LAYOUT_SPRING = { type: 'spring', stiffness: 460, damping: 38, mass: 0.78 }
const ACCORDION_OPEN_SPRING = { type: 'spring', stiffness: 430, damping: 34, mass: 0.78, velocity: 6 }
const ACCORDION_CLOSE_SPRING = { type: 'spring', stiffness: 520, damping: 40, mass: 0.72, velocity: -6 }
const ACCORDION_CONTENT_SPRING = { type: 'spring', stiffness: 650, damping: 36, mass: 0.6, velocity: 8 }

const overviewTranslation = { onlyKeys: ['title', 'description', 'sourceLabel'] }
const translationSource = plainContentTranslationSource(gameOverview, overviewTranslation)
const translateOverview = (data, lang) => translatePlainContent(data, lang, overviewTranslation)
const coverArt = rockstarPromoMedia.collections.artwork.find((image) => image.id === 'artwork-official-cover-art')

function GameInfo() {
  const { t, lang } = useTranslation()
  const reduceMotion = useReducedMotion()
  const [openSection, setOpenSection] = useState('story')
  const { data: sections } = useTranslatedIgnContent(gameOverview, {
    lang,
    scope: 'game-overview',
    source: translationSource,
    translate: translateOverview,
  })

  return (
    <section id="game-info" className="section-padding game-info">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t.gameInfo.title} <span className="gradient-text">{t.gameInfo.titleHighlight}</span></h2>
        </div>

        <div className="game-info-content">
          <div className="info-main">
            <div className="info-image">
              <img
                src={`${coverArt.src}?akim=1&imdensity=1&imwidth=640`}
                alt={coverArt.title}
                width={coverArt.width}
                height={coverArt.height}
                loading="lazy"
                decoding="async"
              />
              <div className="image-glow" />
            </div>

            <div className="info-text">
              <div className="game-info-accordion">
                {sections.map((section, index) => {
                  const isOpen = openSection === section.id
                  const buttonId = `game-info-trigger-${index}`
                  const panelId = `game-info-panel-${index}`

                  return (
                    <motion.article
                      key={section.id}
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
                          onClick={() => setOpenSection(isOpen ? null : section.id)}
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
                        {isOpen && (
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
                              <p>{section.description}</p>
                              <a href={section.source}>{section.sourceLabel}</a>
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
        </div>
      </div>
    </section>
  )
}

export default GameInfo
