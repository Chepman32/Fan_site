import { useEffect, useState } from 'react'
import { Info, Loader, AlertCircle, Monitor, Users, Globe, Sparkles } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './GameInfo.css'

function GameInfo() {
  const { t } = useTranslation()
  const [wikiData, setWikiData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchWikiData = async () => {
      try {
        // Fetch summary
        const summaryRes = await fetch(
          'https://en.wikipedia.org/api/rest_v1/page/summary/Grand_Theft_Auto_VI'
        )
        const summary = await summaryRes.json()

        // Fetch full extract
        const extractRes = await fetch(
          'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext&titles=Grand_Theft_Auto_VI&format=json&origin=*'
        )
        const extractData = await extractRes.json()
        const pages = extractData.query.pages
        const page = Object.values(pages)[0]
        const fullExtract = page.extract || summary.extract

        setWikiData({
          title: summary.title,
          description: summary.description,
          extract: fullExtract,
          thumbnail: summary.thumbnail?.source,
          wikiUrl: summary.content_urls?.desktop?.page,
        })
      } catch (err) {
        setError('Failed to load game information')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchWikiData()
  }, [])

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

  const formatExtract = (text) => {
    if (!text) return []
    // Split by section headers (== Section ==)
    const sections = text.split(/\n== /).map(s => s.replace(/ ==\n?/g, '').trim()).filter(Boolean)
    return sections
  }

  const sections = wikiData ? formatExtract(wikiData.extract) : []

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

        {error && (
          <div className="error-state">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && wikiData && (
          <div className="game-info-content">
            <div className="info-main">
              {wikiData.thumbnail && (
                <div className="info-image">
                  <img src={wikiData.thumbnail} alt="GTA VI Cover" />
                  <div className="image-glow"></div>
                </div>
              )}

              <div className="info-text">
                <p className="info-description">{wikiData.description}</p>
                <div className="info-extract">
                  {sections.slice(0, 4).map((section, index) => {
                    const lines = section.split('\n').filter(l => l.trim())
                    const title = lines[0]
                    const content = lines.slice(1).join(' ')
                    return (
                      <div key={index} className="extract-section">
                        <h4>{title}</h4>
                        <p>{content}</p>
                      </div>
                    )
                  })}
                </div>
                <a 
                  href={wikiData.wikiUrl} 
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
