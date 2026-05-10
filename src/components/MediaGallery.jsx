import { useState } from 'react'
import { Play, Film, ExternalLink } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './MediaGallery.css'

function MediaGallery() {
  const { t } = useTranslation()
  const [activeVideo, setActiveVideo] = useState('QdBZY2fkU-0')

  const videos = [
    { id: 'QdBZY2fkU-0', title: t.media.videos.trailer1.title, duration: '1:31', description: t.media.videos.trailer1.description },
    { id: 'VQRLujxTm3c', title: t.media.videos.trailer2.title, duration: '2:16', description: t.media.videos.trailer2.description },
  ]

  const screenshots = [
    { url: 'https://upload.wikimedia.org/wikipedia/en/4/46/Grand_Theft_Auto_VI.png', caption: t.media.screenshots.boxArt },
    { url: 'https://upload.wikimedia.org/wikipedia/en/c/c5/Grand_Theft_Auto_VI_screenshot.png', caption: t.media.screenshots.inGame },
  ]

  return (
    <section id="media" className="section-padding media-gallery">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <Film size={14} />
            <span>{t.media.badge}</span>
          </div>
          <h2 className="section-title">
            {t.media.title} <span className="gradient-text">{t.media.titleHighlight}</span>
          </h2>
        </div>

        <div className="media-content">
          {/* Main Video Player */}
          <div className="video-player">
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?rel=0`}
              title="GTA VI Trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
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
        <div className="screenshots-section">
          <h3 className="screenshots-title">
            <ExternalLink size={16} />
            {t.media.officialScreenshots}
          </h3>
          <div className="screenshots-grid">
            {screenshots.map((shot, index) => (
              <div key={index} className="screenshot-card">
                <img src={shot.url} alt={shot.caption} />
                <div className="screenshot-caption">
                  <span>{shot.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MediaGallery
