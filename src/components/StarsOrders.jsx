import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { listStarsOrders, safeStarsCheckoutUrl } from '../shop/starsClient'
import { starsCopy } from '../shop/starsCopy'
import StarsDownloadButton from './StarsDownloadButton'
import './ShopCheckoutPanel.css'

export default function StarsOrders() {
  const { lang } = useTranslation()
  const copy = starsCopy(lang)
  const [page, setPage] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    listStarsOrders(null, controller.signal).then(setPage).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    })
    return () => controller.abort()
  }, [])
  const load = async (cursor) => {
    setBusy(true)
    setError('')
    try {
      const result = await listStarsOrders(cursor)
      setPage((previous) => ({ ...result, orders: cursor ? [...(previous?.orders || []), ...result.orders] : result.orders }))
    } catch (failure) { setError(failure.message || copy.failed) }
    finally { setBusy(false) }
  }
  return (
    <section id="stars-orders" className="profile-bookmarks-panel stars-orders">
      <div className="profile-panel-heading"><Star size={17} aria-hidden="true" /><h2>{copy.history}</h2></div>
      <p>{copy.historyNote}</p>
      <button type="button" className="stars-button" disabled={busy} onClick={() => load(null)}>{copy.refresh}</button>
      {!page && !error && <p role="status">{copy.loading}</p>}
      {page?.orders.length === 0 && <p>{copy.empty}</p>}
      {page?.orders.map((order) => (
        <article key={order.id} className="stars-history-order">
          <div className="stars-total"><strong>{order.totalStars.toLocaleString(lang)} ★</strong><span>{copy[order.status] || copy.status}</span></div>
          <p>{new Date(order.createdAt).toLocaleDateString(lang)} · <code>{order.id}</code></p>
          {order.items.map((item) => (
            <div key={item.productId} className="stars-download-row"><span>{item.title}</span>
              {order.status === 'paid' && <StarsDownloadButton orderId={order.id} productId={item.productId} copy={copy} />}
            </div>
          ))}
          {order.status === 'pending' && safeStarsCheckoutUrl(order.checkoutUrl) && (
            <a className="stars-button" href={safeStarsCheckoutUrl(order.checkoutUrl)} target="_blank" rel="noreferrer">{copy.open}</a>
          )}
        </article>
      ))}
      {page?.nextCursor && <button type="button" className="stars-button" disabled={busy} onClick={() => load(page.nextCursor)}>{copy.more}</button>}
      {error && <p className="stars-error" role="alert">{error}</p>}
    </section>
  )
}
