import { useEffect } from 'react'
import { ExternalLink, X } from 'lucide-react'
import './ImageZoomModal.css'

function ImageZoomModal({ src, alt, ignUrl, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="zoom-backdrop" onClick={onClose}>
      <div className="zoom-modal" onClick={(e) => e.stopPropagation()}>
        <button className="zoom-close" type="button" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <img src={src} alt={alt} className="zoom-image" />
        <div className="zoom-footer">
          <span>{alt}</span>
          {ignUrl && (
            <a href={ignUrl} target="_blank" rel="noopener noreferrer" className="zoom-ign-link">
              IGN guide <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageZoomModal
