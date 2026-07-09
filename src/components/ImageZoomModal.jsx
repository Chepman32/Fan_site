import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './ImageZoomModal.css'

function ImageZoomModal({ src, alt, onClose }) {
  const { t } = useTranslation()
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setClosing(true)
        setTimeout(onClose, 200)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 200)
  }

  return (
    <div className={`zoom-backdrop${closing ? ' closing' : ''}`} onClick={handleClose}>
      <button className="zoom-close" type="button" onClick={handleClose} aria-label={t.settings?.actions?.close || t.auth.closeSignIn || 'Close'}>
        <X size={22} />
      </button>
      <div className="zoom-modal" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={alt} className="zoom-image" decoding="async" />
        <div className="zoom-footer">
          <span>{alt}</span>
        </div>
      </div>
    </div>
  )
}

export default ImageZoomModal
