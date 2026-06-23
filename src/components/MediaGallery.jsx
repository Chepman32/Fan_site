import { useState } from 'react'
import { Play } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './MediaGallery.css'

function MediaGallery() {
  const { t } = useTranslation()
  const [activeVideo, setActiveVideo] = useState('QdBZY2fkU-0')
  const [failedScreenshotUrls, setFailedScreenshotUrls] = useState([])

  const videos = [
    { id: 'QdBZY2fkU-0', title: t.media.videos.trailer1.title, duration: '1:31', description: t.media.videos.trailer1.description },
    { id: 'VQRLujxTm3c', title: t.media.videos.trailer2.title, duration: '2:16', description: t.media.videos.trailer2.description },
  ]

  const screenshots = [
    { url: 'https://upload.wikimedia.org/wikipedia/en/4/46/Grand_Theft_Auto_VI.png', caption: t.media.screenshots.boxArt },
    { url: 'https://www.rockstargames.com/VI/_next/static/media/Vice_City_01.332891cf.jpg', caption: t.media.screenshots.inGame },
  ]
  const visibleScreenshots = screenshots.filter((shot) => !failedScreenshotUrls.includes(shot.url))

  const hideFailedScreenshot = (url) => {
    setFailedScreenshotUrls((urls) => (urls.includes(url) ? urls : [...urls, url]))
  }

  return (
    <section id="media" className="section-padding media-gallery">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            {t.media.title} <span className="gradient-text">{t.media.titleHighlight}</span>
          </h2>
        </div>

        <div className="media-content">
          {/* Main Video Player */}
          <div className="video-player">
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?rel=0`}
              title={videos.find((video) => video.id === activeVideo)?.title || 'GTA VI trailer'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>

          {/* Video List */}
          <div className="video-list">
            {videos.map((video) => (
              <button
                key={video.id}
                className={`video-item ${activeVideo === video.id ? 'active' : ''}`}
                onClick={() => setActiveVideo(video.id)}
              >
                <div className="video-thumb">
                  <img 
                    src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`} 
                    alt={video.title}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="play-overlay">
                    <Play size={20} />
                  </div>
                  <span className="video-duration">{video.duration}</span>
                </div>
                <div className="video-meta">
                  <h4>{video.title}</h4>
                  <p>{video.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Screenshots */}
        {visibleScreenshots.length > 0 && (
          <div className="screenshots-section">
            <h3 className="screenshots-title">
              {t.media.officialScreenshots}
            </h3>
            <div className="screenshots-grid">
              {visibleScreenshots.map((shot) => (
                <div key={shot.url} className="screenshot-card">
                  <img
                    src={shot.url}
                    alt={shot.caption}
                    loading="lazy"
                    decoding="async"
                    onError={() => hideFailedScreenshot(shot.url)}
                  />
                  <div className="screenshot-caption">
                    <span>{shot.caption}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default MediaGallery
