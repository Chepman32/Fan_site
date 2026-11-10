import { useState } from 'react'
import { Download, LoaderCircle } from 'lucide-react'
import { starsDownload } from '../shop/starsClient'

export default function StarsDownloadButton({ orderId, productId, copy }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const download = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    const popup = window.open('about:blank', '_blank')
    if (popup) popup.opener = null
    try {
      const url = await starsDownload(orderId, productId)
      if (popup && !popup.closed) popup.location.replace(url)
      else window.location.assign(url)
    } catch (failure) {
      popup?.close()
      setError(failure.message || copy.failed)
    } finally { setBusy(false) }
  }
  return (
    <span className="stars-download-control">
      <button type="button" className="stars-button" onClick={download} disabled={busy}>
        {busy ? <LoaderCircle size={15} className="stars-spinner" aria-hidden="true" /> : <Download size={15} aria-hidden="true" />}
        {busy ? copy.downloading : copy.download}
      </button>
      {error && <span className="stars-error" role="alert">{error}</span>}
    </span>
  )
}
