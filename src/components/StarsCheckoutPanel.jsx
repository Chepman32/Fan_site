import { useEffect, useRef, useState } from 'react'
import { Check, ExternalLink, LoaderCircle, Star } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { useSocial } from '../social/SocialContext'
import { starsCopy } from '../shop/starsCopy'
import { createStarsOrder, getStarsOrder, rememberStarsOrder, safeStarsCheckoutUrl, savedStarsOrder, starsConfig } from '../shop/starsClient'
import StarsDownloadButton from './StarsDownloadButton'

export default function StarsCheckoutPanel({ cartItems, onOpenAuth }) {
  const { currentUser, isSignedIn } = useSocial()
  const { lang } = useTranslation()
  const copy = starsCopy(lang)
  const uid = currentUser?.id
  const [config, setConfig] = useState(null)
  const [order, setOrder] = useState(null)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [restoring, setRestoring] = useState(Boolean(uid && savedStarsOrder(uid)))
  const [error, setError] = useState('')
  const requestId = useRef(null)
  const orderId = order?.id
  const orderStatus = order?.status

  useEffect(() => {
    const controller = new AbortController()
    starsConfig(controller.signal).then(setConfig).catch(() => {
      if (!controller.signal.aborted) setConfig({ enabled: false })
    })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!uid) return undefined
    const controller = new AbortController()
    const savedId = savedStarsOrder(uid)
    if (savedId) {
      getStarsOrder(savedId, controller.signal).then(setOrder).catch((failure) => {
        if (!controller.signal.aborted) {
          if (failure.status === 404) rememberStarsOrder(uid, null)
          else setError(failure.message)
        }
      }).finally(() => { if (!controller.signal.aborted) setRestoring(false) })
    }
    return () => controller.abort()
  }, [uid])

  useEffect(() => {
    if (!orderId || orderStatus !== 'pending') return undefined
    const controller = new AbortController()
    let timer
    const poll = async () => {
      if (document.visibilityState === 'hidden') { timer = window.setTimeout(poll, 5000); return }
      try {
        const updated = await getStarsOrder(orderId, controller.signal)
        if (controller.signal.aborted) return
        setOrder(updated)
        setError('')
        if (updated.status !== 'pending') return
      } catch (failure) {
        if (controller.signal.aborted) return
        setError(failure.message || copy.failed)
      }
      timer = window.setTimeout(poll, 5000)
    }
    timer = window.setTimeout(poll, 3000)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [orderId, orderStatus, copy.failed])

  const missingProduct = config && cartItems.some((item) => !Number.isSafeInteger(config.prices?.[item.id]))
  const total = order?.totalStars ?? cartItems.reduce((sum, item) => sum + (config?.prices?.[item.id] || 0), 0)
  const checkoutUrl = safeStarsCheckoutUrl(order?.checkoutUrl)
  const start = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    requestId.current ||= window.crypto.randomUUID()
    try {
      const created = await createStarsOrder(cartItems.map((item) => item.id), requestId.current)
      rememberStarsOrder(uid, created.id)
      setOrder(created)
    } catch (failure) { setError(failure.message || copy.failed) }
    finally { setBusy(false) }
  }
  const refresh = async () => {
    setChecking(true)
    setError('')
    try { setOrder(await getStarsOrder(order.id)) }
    catch (failure) { setError(failure.message || copy.failed) }
    finally { setChecking(false) }
  }
  const restart = () => {
    rememberStarsOrder(uid, null)
    requestId.current = null
    setOrder(null)
    setError('')
  }

  return (
    <section className="stars-checkout" aria-label={copy.title}>
      <h3><Star size={19} aria-hidden="true" />{copy.title}</h3>
      {config?.testMode && <p className="stars-note">{copy.test}</p>}
      {!isSignedIn ? (
        <><p>{copy.signInNote}</p><button type="button" className="stars-button primary" onClick={onOpenAuth}>{copy.signIn}</button></>
      ) : !config || restoring ? (
        <p role="status"><LoaderCircle size={16} className="stars-spinner" aria-hidden="true" /> {copy.loading}</p>
      ) : (
        <>
          {!order && !config.enabled && <p className="stars-note">{copy.unavailable}</p>}
          {!order && config.enabled && missingProduct && <p className="stars-note">{copy.cartUnavailable}</p>}
          {(order || (config.enabled && !missingProduct)) && (
            <>
              <ul className="stars-order-items">
                {(order?.items || cartItems.map((item) => ({ productId: item.id, title: item.title, priceStars: config.prices[item.id] }))).map((item) => (
                  <li key={item.productId}><span>{item.title}</span><strong>{item.priceStars.toLocaleString(lang)} ★</strong></li>
                ))}
              </ul>
              <div className="stars-total"><span>{copy.total}</span><strong>{total.toLocaleString(lang)} ★</strong></div>
            </>
          )}
          {!order && config.enabled && !missingProduct && (
            <><p>{copy.note}</p><button type="button" className="stars-button primary" onClick={start} disabled={busy || !cartItems.length}>
              {busy ? <LoaderCircle size={16} className="stars-spinner" aria-hidden="true" /> : <Star size={16} aria-hidden="true" />}
              {busy ? copy.creating : copy.pay}
            </button></>
          )}
          {order && (
            <>
              <p className={`stars-status ${order.status}`} role="status">
                {order.status === 'paid' && <Check size={17} aria-hidden="true" />}
                {copy[order.status] || copy.status}
              </p>
              <p className="stars-order-reference">{copy.order}: <code>{order.id}</code></p>
              {order.status === 'pending' && (
                <>
                  <p>{copy.note}</p>
                  {checkoutUrl && <a className="stars-button primary" href={checkoutUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" />{copy.open}</a>}
                  <button type="button" className="stars-button" onClick={refresh} disabled={checking}>{checking ? copy.checking : copy.check}</button>
                </>
              )}
              {order.status === 'paid' && order.items.map((item) => (
                <div key={item.productId} className="stars-download-row"><span>{item.title}</span><StarsDownloadButton orderId={order.id} productId={item.productId} copy={copy} /></div>
              ))}
              <a className="stars-history-link" href="/profile#stars-orders">{copy.historyLink}</a>
              <button type="button" className="stars-button" onClick={restart}>{copy.restart}</button>
            </>
          )}
        </>
      )}
      {error && <p className="stars-error" role="alert">{error}</p>}
      <a className="stars-history-link" href="/contact">{copy.support}</a>
    </section>
  )
}
