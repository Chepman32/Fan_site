import { useId, useState } from 'react'
import { Star, Wallet } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { useSocial } from '../social/SocialContext'
import { starsCopy } from '../shop/starsCopy'
import CryptoCheckoutPanel from './CryptoCheckoutPanel'
import StarsCheckoutPanel from './StarsCheckoutPanel'
import './ShopCheckoutPanel.css'

export default function ShopCheckoutPanel({ onOpenAuth, ...props }) {
  const [method, setMethod] = useState('usdt')
  const { currentUser } = useSocial()
  const { lang } = useTranslation()
  const copy = starsCopy(lang)
  const id = useId()
  const changeTabWithKey = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 'usdt' : event.key === 'End' ? 'stars' : method === 'usdt' ? 'stars' : 'usdt'
    setMethod(next)
    document.getElementById(`${id}-${next}`)?.focus()
  }
  return (
    <div className={`shop-payment-options ${props.compact ? 'compact' : ''}`}>
      <div className="shop-payment-methods" role="tablist" aria-label={copy.method}>
        {[['usdt', copy.usdt, Wallet], ['stars', copy.stars, Star]].map(([value, label, Icon]) => (
          <button key={value} type="button" id={`${id}-${value}`} role="tab" aria-selected={method === value}
            aria-controls={`${id}-panel`} tabIndex={method === value ? 0 : -1}
            onKeyDown={changeTabWithKey} onClick={() => setMethod(value)}>
            <Icon size={16} aria-hidden="true" />{label}
          </button>
        ))}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${method}`} tabIndex={0}>
        {method === 'usdt' ? <CryptoCheckoutPanel {...props} /> : <StarsCheckoutPanel key={currentUser?.id || 'guest'} cartItems={props.cartItems} onOpenAuth={onOpenAuth} />}
      </div>
    </div>
  )
}
