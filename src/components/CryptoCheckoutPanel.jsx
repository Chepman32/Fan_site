import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Check, Copy, ShieldCheck } from 'lucide-react'
import { PAYMENT_ADDRESS, PAYMENT_NETWORK } from '../shop/shopData'
import './CryptoCheckoutPanel.css'

function CryptoCheckoutPanel({ cartItems, cartTotal, onRemoveItem, compact = false }) {
  const [copiedField, setCopiedField] = useState('')
  const [txHash, setTxHash] = useState('')
  const [submittedCartKey, setSubmittedCartKey] = useState('')
  const [qrSrc, setQrSrc] = useState('')
  const paymentAmount = cartTotal.toFixed(2)
  const cartKey = `${cartItems.map((item) => item.id).join(',')}:${paymentAmount}`
  const paymentSubmitted = submittedCartKey === cartKey && Boolean(txHash.trim())

  useEffect(() => {
    let canceled = false

    QRCode.toDataURL(PAYMENT_ADDRESS, {
      width: compact ? 128 : 164,
      margin: 1,
      color: {
        dark: '#0a0a0f',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => {
        if (!canceled) setQrSrc(dataUrl)
      })
      .catch((error) => {
        console.log('Could not generate checkout QR:', error)
      })

    return () => {
      canceled = true
    }
  }, [compact])

  const copyPaymentValue = async (value, field) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField(''), 1400)
    } catch (error) {
      console.log('Could not copy payment value:', error)
    }
  }

  const submitPaymentProof = () => {
    if (!txHash.trim()) return
    setSubmittedCartKey(cartKey)
  }

  return (
    <div className={`crypto-checkout-panel ${compact ? 'compact' : ''}`}>
      <div className="crypto-checkout-heading">
        <ShieldCheck size={18} />
        <div>
          <h3>Crypto checkout</h3>
          <span>{PAYMENT_NETWORK} only</span>
        </div>
      </div>

      {cartItems.length > 0 && (
        <div className="crypto-checkout-items">
          {cartItems.map((item) => (
            <div key={item.id} className="crypto-checkout-item">
              <img src={item.image} alt="" aria-hidden="true" />
              <div>
                <strong>{item.title}</strong>
                <span>${item.price}</span>
              </div>
              {onRemoveItem && (
                <button type="button" onClick={() => onRemoveItem(item.id)}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="crypto-checkout-total">
        <span>Total</span>
        <strong>${cartTotal}</strong>
      </div>

      <div className="crypto-qr-row">
        <div className="crypto-qr-box">
          {qrSrc ? <img src={qrSrc} alt={`${PAYMENT_NETWORK} address QR`} /> : <span>QR</span>}
        </div>
        <p>QR encodes the receiving address. Send the exact USDT amount shown.</p>
      </div>

      <div className="crypto-payment-amount">
        <span>Send exactly</span>
        <strong>{paymentAmount} USDT</strong>
        <button type="button" onClick={() => copyPaymentValue(paymentAmount, 'amount')}>
          <Copy size={14} />
          {copiedField === 'amount' ? 'Copied' : 'Copy amount'}
        </button>
      </div>

      <div className="crypto-payment-address">
        <span>Receiving address</span>
        <code>{PAYMENT_ADDRESS}</code>
        <button type="button" onClick={() => copyPaymentValue(PAYMENT_ADDRESS, 'address')}>
          <Copy size={14} />
          {copiedField === 'address' ? 'Copied' : 'Copy address'}
        </button>
      </div>

      <p className="crypto-payment-warning">
        Send USDT on the TRON/TRC20 network only. Transfers from other networks may be unrecoverable.
      </p>

      <label className="crypto-tx-field">
        <span>Transaction hash</span>
        <input
          type="text"
          value={txHash}
          onChange={(event) => {
            setTxHash(event.target.value)
            setSubmittedCartKey('')
          }}
          placeholder="Paste your TRC20 transaction hash"
        />
      </label>

      <button type="button" className="crypto-submit-payment" disabled={!txHash.trim()} onClick={submitPaymentProof}>
        Submit payment proof
      </button>

      {paymentSubmitted && (
        <div className="crypto-payment-success">
          <Check size={16} />
          Payment proof saved for manual confirmation.
        </div>
      )}
    </div>
  )
}

export default CryptoCheckoutPanel
