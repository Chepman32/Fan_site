import { useCallback, useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { AlertCircle, Check, Copy, Download, LoaderCircle, PlugZap, Send, ShieldCheck } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { PAYMENT_ADDRESS, PAYMENT_NETWORK, PAYMENT_NETWORK_SUFFIX } from '../shop/shopData'
import { localizeShopProduct } from '../shop/shopLocalization'
import { useSocial } from '../social/SocialContext'
import ShopLineItemThumbnail from './ShopLineItemThumbnail'
import {
  checkUsdtTransaction,
  connectTronLinkWallet,
  normalizeTxId,
  sendUsdtTransfer,
} from '../shop/tronPayments'
import './CryptoCheckoutPanel.css'

const POLL_INTERVAL_MS = 3000

function shortenAddress(value = '') {
  if (value.length <= 12) return value
  return `${value.slice(0, 6)}...${value.slice(-6)}`
}

function CryptoCheckoutPanel({ cartItems, cartTotal, onRemoveItem, compact = false, wide = false }) {
  const { t, lang } = useTranslation()
  const { isSignedIn, recordPurchase } = useSocial()
  const shopCopy = { ...t.shop, lang }
  const checkoutCopy = shopCopy.checkout
  const tronGridRetryMessage = checkoutCopy.messages.tronGridRetry
  const deliveredTxIdsRef = useRef(new Set())
  const [copiedField, setCopiedField] = useState('')
  const [txHash, setTxHash] = useState('')
  const [txIdToVerify, setTxIdToVerify] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('idle')
  const [paymentMessage, setPaymentMessage] = useState('')
  const [confirmedItems, setConfirmedItems] = useState([])
  const [purchaseSaveStatus, setPurchaseSaveStatus] = useState('idle')
  const [walletAccount, setWalletAccount] = useState('')
  const [walletTronWeb, setWalletTronWeb] = useState(null)
  const [walletStatus, setWalletStatus] = useState('idle')
  const [walletMessage, setWalletMessage] = useState('')
  const [qrSrc, setQrSrc] = useState('')
  const paymentAmount = cartTotal.toFixed(2)
  const paymentInProgress = paymentStatus === 'waiting_wallet' || paymentStatus === 'pending'

  const finalizeConfirmedPayment = useCallback((confirmedTxId) => {
    if (!confirmedTxId || deliveredTxIdsRef.current.has(confirmedTxId)) return

    deliveredTxIdsRef.current.add(confirmedTxId)
    setConfirmedItems(cartItems)

    if (!isSignedIn) {
      setPurchaseSaveStatus('guest')
      return
    }

    setPurchaseSaveStatus('saving')
    recordPurchase({
      txId: confirmedTxId,
      amount: paymentAmount,
      network: PAYMENT_NETWORK,
      items: cartItems,
    }).then((saved) => {
      setPurchaseSaveStatus(saved ? 'saved' : 'failed')
    })
  }, [cartItems, isSignedIn, paymentAmount, recordPurchase])

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
        } else if (result.status === 'success') {
          finalizeConfirmedPayment(txIdToVerify)
        }
      } catch (error) {
        if (canceled) return

        setPaymentStatus('pending')
        setPaymentMessage(error.message || tronGridRetryMessage)
        timerId = window.setTimeout(pollTransaction, POLL_INTERVAL_MS)
      }
    }

    pollTransaction()

    return () => {
      canceled = true
      window.clearTimeout(timerId)
    }
  }, [finalizeConfirmedPayment, paymentAmount, tronGridRetryMessage, txIdToVerify])

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
      setWalletMessage(error.message || checkoutCopy.messages.walletFailed)
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
    setPaymentMessage(checkoutCopy.messages.confirmWallet)

    try {
      const { tronWeb } = await getWalletConnection()
      const sentTxId = await sendUsdtTransfer(tronWeb, paymentAmount)
      setTxHash(sentTxId)
      setTxIdToVerify(sentTxId)
      setPaymentStatus('pending')
      setPaymentMessage(checkoutCopy.messages.transferSubmitted)
    } catch (error) {
      setPaymentStatus('failed')
      setPaymentMessage(error.message || checkoutCopy.messages.transferNotSubmitted)
    }
  }

  const submitPaymentProof = () => {
    const normalizedTxId = normalizeTxId(txHash)
    if (!normalizedTxId) return
    setPaymentStatus('pending')
    setPaymentMessage(checkoutCopy.messages.checkingNetwork)
    setTxIdToVerify(normalizedTxId)
  }

  return (
    <div className={`crypto-checkout-panel ${compact ? 'compact' : ''} ${wide ? 'wide' : ''}`}>
      <div className="crypto-checkout-heading">
        <ShieldCheck size={18} />
        <div>
          <h3>{shopCopy.cryptoCheckout}</h3>
          <span>{checkoutCopy.networkOnly(PAYMENT_NETWORK)}</span>
        </div>
      </div>

      <div className="crypto-checkout-summary">
        {cartItems.length > 0 && (
          <div className="crypto-checkout-items">
            {cartItems.map((item) => {
              const displayItem = localizeShopProduct(item, shopCopy)

              return (
                <div key={item.id} className="crypto-checkout-item">
                  <ShopLineItemThumbnail product={item} />
                  <div>
                    <strong>{displayItem.title}</strong>
                    <span>${item.price}</span>
                  </div>
                  {onRemoveItem && (
                    <button type="button" onClick={() => onRemoveItem(item.id)}>
                      {shopCopy.remove}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="crypto-checkout-total">
          <span>{shopCopy.total}</span>
          <strong>${cartTotal}</strong>
        </div>

        <div className="crypto-qr-row">
          <div className="crypto-qr-box">
            {qrSrc ? <img src={qrSrc} alt={checkoutCopy.qrAlt(PAYMENT_NETWORK)} /> : <span>QR</span>}
          </div>
          <p>{checkoutCopy.qrNote}</p>
        </div>
      </div>

      <div className="crypto-checkout-payment">
        <div className="crypto-payment-amount">
          <span>{checkoutCopy.sendExactly}</span>
          <strong>{paymentAmount} USDT {PAYMENT_NETWORK_SUFFIX}</strong>
          <button type="button" onClick={() => copyPaymentValue(paymentAmount, 'amount')}>
            <Copy size={14} />
            {copiedField === 'amount' ? checkoutCopy.copied : checkoutCopy.copyAmount}
          </button>
        </div>

        <div className="crypto-payment-address">
          <span>{checkoutCopy.receivingAddress}</span>
          <code>{PAYMENT_ADDRESS}</code>
          <button type="button" onClick={() => copyPaymentValue(PAYMENT_ADDRESS, 'address')}>
            <Copy size={14} />
            {copiedField === 'address' ? checkoutCopy.copied : checkoutCopy.copyAddress}
          </button>
        </div>

        <div className="crypto-wallet-box">
          <div className="crypto-wallet-heading">
            <PlugZap size={16} />
            <div>
              <span>{checkoutCopy.tronLinkAutomation}</span>
              <strong>{walletAccount ? shortenAddress(walletAccount) : checkoutCopy.walletNotConnected}</strong>
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
              {walletStatus === 'connecting' ? checkoutCopy.connecting : walletAccount ? checkoutCopy.reconnect : checkoutCopy.connectTronLink}
            </button>
            <button
              type="button"
              className="primary"
              onClick={sendPaymentWithTronLink}
              disabled={!cartItems.length || paymentInProgress || paymentStatus === 'success'}
            >
              <Send size={14} />
              {paymentStatus === 'waiting_wallet' ? checkoutCopy.openTronLink : checkoutCopy.sendUsdt}
            </button>
          </div>
          {walletMessage && <p>{walletMessage}</p>}
        </div>

        <p className="crypto-payment-warning">
          {checkoutCopy.warning}
        </p>

        <label className="crypto-tx-field">
          <span>{checkoutCopy.transactionHash}</span>
          <input
            type="text"
            value={txHash}
            onChange={(event) => {
              setTxHash(event.target.value)
              setTxIdToVerify('')
              setPaymentStatus('idle')
              setPaymentMessage('')
              setConfirmedItems([])
              setPurchaseSaveStatus('idle')
            }}
            placeholder={checkoutCopy.transactionPlaceholder}
          />
        </label>

        <button type="button" className="crypto-submit-payment" disabled={!txHash.trim()} onClick={submitPaymentProof}>
          {checkoutCopy.verifyTransaction}
        </button>

        {paymentStatus !== 'idle' && (
          <div className={`crypto-payment-status ${paymentStatus}`}>
            {paymentStatus === 'success' && <Check size={16} />}
            {paymentStatus === 'failed' && <AlertCircle size={16} />}
            {(paymentStatus === 'pending' || paymentStatus === 'waiting_wallet') && (
              <LoaderCircle className="crypto-status-spinner" size={16} />
            )}
            <div>
              <strong>{checkoutCopy.statuses[paymentStatus]}</strong>
              <span>{paymentMessage}</span>
              {txIdToVerify && <code>{txIdToVerify}</code>}
            </div>
          </div>
        )}

        {paymentStatus === 'success' && confirmedItems.some((item) => item.downloadUrl) && (
          <div className="crypto-downloads-box">
            <div className="crypto-downloads-heading">
              <Download size={16} />
              <div>
                <strong>{checkoutCopy.downloadReady}</strong>
                <span>{checkoutCopy.downloadReadyNote}</span>
              </div>
            </div>

            <div className="crypto-download-list">
              {confirmedItems
                .filter((item) => item.downloadUrl)
                .map((item) => {
                  const displayItem = localizeShopProduct(item, shopCopy)

                  return (
                    <a
                      key={item.id}
                      className="crypto-download-link"
                      href={item.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src={item.image} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                      <span>
                        <strong>{displayItem.title}</strong>
                        <em>{item.downloadFileName}</em>
                      </span>
                      <b>
                        <Download size={14} />
                        {checkoutCopy.download8k}
                      </b>
                    </a>
                  )
                })}
            </div>

            {purchaseSaveStatus !== 'idle' && purchaseSaveStatus !== 'saving' && (
              <p className={`crypto-purchase-save ${purchaseSaveStatus}`}>
                {purchaseSaveStatus === 'saved' && checkoutCopy.purchaseSaved}
                {purchaseSaveStatus === 'guest' && checkoutCopy.purchaseGuest}
                {purchaseSaveStatus === 'failed' && checkoutCopy.purchaseSaveFailed}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CryptoCheckoutPanel
