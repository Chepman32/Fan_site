import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'
import { rockstarPromoMedia } from '../data/rockstarPromoMedia'
import './MediaGallery.css'

const { sources, videos } = rockstarPromoMedia

function posterUrl(src, width) {
  return `${src}?akim=1&imdensity=1&imwidth=${width}`
}

function MediaGallery({ copy }) {
  const [selectedId, setSelectedId] = useState(videos[0].id)
  const [playing, setPlaying] = useState(false)
  const selected = videos.find((video) => video.id === selectedId)

  return (
    <section id="official-videos" className="section-padding media-gallery" aria-labelledby="official-videos-title">
      <div className="container">
        <header className="about-section-heading">
          <div>
            <span>{copy.eyebrow}</span>
            <h2 id="official-videos-title">{copy.videos.title}</h2>
          </div>
          <p>{copy.videos.description}</p>
        </header>

        <div className="media-content">
          <div className="video-player-column">
            <div className="video-player">
              {playing ? (
                <iframe
                  key={selected.id}
                  src={`https://www.youtube-nocookie.com/embed/${selected.youtubeId}?autoplay=1&rel=0`}
                  title={selected.title}
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  allowFullScreen
                />
              ) : (
                <button type="button" className="video-poster" onClick={() => setPlaying(true)} aria-label={`${copy.videos.play}: ${selected.title}`}>
                  <img src={posterUrl(selected.poster, 1280)} alt="" loading="lazy" decoding="async" />
                  <span aria-hidden="true"><Play size={28} fill="currentColor" /></span>
                </button>
              )}
            </div>
            <a href={selected.source} target="_blank" rel="noopener noreferrer">
              {copy.videos.watchSource} <ExternalLink size={14} />
            </a>
          </div>

          <div className="video-list">
            {videos.map((video) => (
              <button
                key={video.id}
                type="button"
                className={`video-item${selectedId === video.id ? ' active' : ''}`}
                aria-pressed={selectedId === video.id}
                onClick={() => {
                  if (selectedId !== video.id) {
                    setSelectedId(video.id)
                    setPlaying(false)
                  }
                }}
              >
                <span className="video-thumb">
                  <img src={posterUrl(video.poster, 320)} alt="" loading="lazy" decoding="async" />
                  <span className="play-overlay" aria-hidden="true"><Play size={20} /></span>
                  <span className="video-duration">{video.duration}</span>
                </span>
                <strong>{video.title}</strong>
              </button>
            ))}
            <a href={sources.videos} target="_blank" rel="noopener noreferrer">
              {copy.videos.viewAll} <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MediaGallery
