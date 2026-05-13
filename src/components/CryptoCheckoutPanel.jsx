import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { AlertCircle, Check, Copy, LoaderCircle, PlugZap, Send, ShieldCheck } from 'lucide-react'
import { PAYMENT_ADDRESS, PAYMENT_NETWORK } from '../shop/shopData'
import {
  checkUsdtTransaction,
  connectTronLinkWallet,
  normalizeTxId,
  sendUsdtTransfer,
} from '../shop/tronPayments'
import './CryptoCheckoutPanel.css'

const POLL_INTERVAL_MS = 3000

const paymentStatusCopy = {
  idle: 'Awaiting transaction',
  waiting_wallet: 'Waiting for wallet',
  pending: 'Pending confirmation',
  success: 'Payment successful',
  failed: 'Payment failed',
}

function shortenAddress(value = '') {
  if (value.length <= 12) return value
  return `${value.slice(0, 6)}...${value.slice(-6)}`
}

function CryptoCheckoutPanel({ cartItems, cartTotal, onRemoveItem, compact = false }) {
  const [copiedField, setCopiedField] = useState('')
  const [txHash, setTxHash] = useState('')
  const [txIdToVerify, setTxIdToVerify] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('idle')
  const [paymentMessage, setPaymentMessage] = useState('')
  const [walletAccount, setWalletAccount] = useState('')
  const [walletTronWeb, setWalletTronWeb] = useState(null)
  const [walletStatus, setWalletStatus] = useState('idle')
  const [walletMessage, setWalletMessage] = useState('')
  const [qrSrc, setQrSrc] = useState('')
  const paymentAmount = cartTotal.toFixed(2)
  const paymentInProgress = paymentStatus === 'waiting_wallet' || paymentStatus === 'pending'

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

  useEffect(() => {
    if (!txIdToVerify) return undefined

    let canceled = false
    let timerId

    const pollTransaction = async () => {
      try {
        const result = await checkUsdtTransaction(txIdToVerify, paymentAmount)

        if (canceled) return

        setPaymentStatus(result.status)
        setPaymentMessage(result.message)

        if (result.status === 'pending') {
          timerId = window.setTimeout(pollTransaction, POLL_INTERVAL_MS)
        }
      } catch (error) {
        if (canceled) return

        setPaymentStatus('pending')
        setPaymentMessage(error.message || 'TRONGrid is not responding. Retrying shortly.')
        timerId = window.setTimeout(pollTransaction, POLL_INTERVAL_MS)
      }
    }

    pollTransaction()

    return () => {
      canceled = true
      window.clearTimeout(timerId)
    }
  }, [paymentAmount, txIdToVerify])

  const copyPaymentValue = async (value, field) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField(''), 1400)
    } catch (error) {
      console.log('Could not copy payment value:', error)
    }
  }

  const connectWallet = async () => {
    setWalletStatus('connecting')
    setWalletMessage('')

    try {
      const connection = await connectTronLinkWallet()
      setWalletAccount(connection.account)
      setWalletTronWeb(connection.tronWeb)
      setWalletStatus('connected')
      return connection
    } catch (error) {
      setWalletStatus('failed')
      setWalletMessage(error.message || 'Could not connect TronLink.')
      throw error
    }
  }

  const getWalletConnection = async () => {
    if (walletTronWeb && walletAccount) {
      return { tronWeb: walletTronWeb, account: walletAccount }
    }

    return connectWallet()
  }

  const sendPaymentWithTronLink = async () => {
    setPaymentStatus('waiting_wallet')
    setPaymentMessage('Confirm the USDT transfer in TronLink.')

    try {
      const { tronWeb } = await getWalletConnection()
      const sentTxId = await sendUsdtTransfer(tronWeb, paymentAmount)
      setTxHash(sentTxId)
      setTxIdToVerify(sentTxId)
      setPaymentStatus('pending')
      setPaymentMessage('Transfer submitted. Waiting for TRON confirmation.')
    } catch (error) {
      setPaymentStatus('failed')
      setPaymentMessage(error.message || 'The transfer was not submitted.')
    }
  }

  const submitPaymentProof = () => {
    const normalizedTxId = normalizeTxId(txHash)
    if (!normalizedTxId) return
    setPaymentStatus('pending')
    setPaymentMessage('Checking the TRON network...')
    setTxIdToVerify(normalizedTxId)
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

      <div className="crypto-wallet-box">
        <div className="crypto-wallet-heading">
          <PlugZap size={16} />
          <div>
            <span>TronLink automation</span>
            <strong>{walletAccount ? shortenAddress(walletAccount) : 'Wallet not connected'}</strong>
          </div>
        </div>
        <div className="crypto-wallet-actions">
          <button
            type="button"
            onClick={() => {
              connectWallet().catch(() => {})
            }}
            disabled={walletStatus === 'connecting' || paymentInProgress}
          >
            {walletStatus === 'connecting' ? 'Connecting...' : walletAccount ? 'Reconnect' : 'Connect TronLink'}
          </button>
          <button
            type="button"
            className="primary"
            onClick={sendPaymentWithTronLink}
            disabled={!cartItems.length || paymentInProgress || paymentStatus === 'success'}
          >
            <Send size={14} />
            {paymentStatus === 'waiting_wallet' ? 'Open TronLink' : 'Send USDT'}
          </button>
        </div>
        {walletMessage && <p>{walletMessage}</p>}
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
            setTxIdToVerify('')
            setPaymentStatus('idle')
            setPaymentMessage('')
          }}
          placeholder="Paste your TRC20 transaction hash"
        />
      </label>

      <button type="button" className="crypto-submit-payment" disabled={!txHash.trim()} onClick={submitPaymentProof}>
        Verify transaction
      </button>

      {paymentStatus !== 'idle' && (
        <div className={`crypto-payment-status ${paymentStatus}`}>
          {paymentStatus === 'success' && <Check size={16} />}
          {paymentStatus === 'failed' && <AlertCircle size={16} />}
          {(paymentStatus === 'pending' || paymentStatus === 'waiting_wallet') && (
            <LoaderCircle className="crypto-status-spinner" size={16} />
          )}
          <div>
            <strong>{paymentStatusCopy[paymentStatus]}</strong>
            <span>{paymentMessage}</span>
            {txIdToVerify && <code>{txIdToVerify}</code>}
          </div>
        </div>
      )}
    </div>
  )
}

export default CryptoCheckoutPanel
