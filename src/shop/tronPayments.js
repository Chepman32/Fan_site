import { TronWeb } from 'tronweb'
import {
  PAYMENT_ADDRESS,
  TRONGRID_FULL_HOST,
  USDT_CONTRACT_ADDRESS,
  USDT_DECIMALS,
  USDT_TRANSFER_FEE_LIMIT,
} from './shopData'

const RECENT_TRANSFER_LIMIT = 20

function normalizedTxIdEquals(left, right) {
  return normalizeTxId(left).toLowerCase() === normalizeTxId(right).toLowerCase()
}

export function normalizeTxId(value) {
  return String(value).trim()
}

export function createTronGridClient() {
  return new TronWeb({ fullHost: TRONGRID_FULL_HOST })
}

export function usdtToSmallestUnit(amount) {
  const amountString = String(amount).trim()

  if (!/^\d+(\.\d{1,6})?$/.test(amountString)) {
    throw new Error('USDT amount must use up to 6 decimal places.')
  }

  const [whole, fraction = ''] = amountString.split('.')
  const paddedFraction = fraction.padEnd(USDT_DECIMALS, '0')

  return BigInt(whole) * (10n ** BigInt(USDT_DECIMALS)) + BigInt(paddedFraction || '0')
}

function usdtFromSmallestUnit(amountInUnits) {
  const unit = 10n ** BigInt(USDT_DECIMALS)
  const whole = amountInUnits / unit
  const fraction = (amountInUnits % unit).toString().padStart(USDT_DECIMALS, '0').replace(/0+$/, '')

  return fraction ? `${whole}.${fraction}` : whole.toString()
}

function paymentAddressForRequest(recipientAddress = PAYMENT_ADDRESS) {
  return String(recipientAddress || PAYMENT_ADDRESS).trim()
}

function createRecentUsdtTransfersUrl(recipientAddress = PAYMENT_ADDRESS) {
  const paymentAddress = paymentAddressForRequest(recipientAddress)
  const url = new URL(`/v1/accounts/${paymentAddress}/transactions/trc20`, TRONGRID_FULL_HOST)
  url.searchParams.set('limit', String(RECENT_TRANSFER_LIMIT))
  url.searchParams.set('contract_address', USDT_CONTRACT_ADDRESS)

  return url.toString()
}

async function fetchRecentUsdtTransfers(recipientAddress = PAYMENT_ADDRESS) {
  const response = await fetch(createRecentUsdtTransfersUrl(recipientAddress))

  if (!response.ok) {
    throw new Error(`TRONGrid returned HTTP ${response.status}.`)
  }

  const payload = await response.json()

  if (payload?.success === false) {
    throw new Error('TRONGrid did not return a successful transfer response.')
  }

  return Array.isArray(payload?.data) ? payload.data : []
}

function transferAmountInSmallestUnit(transfer) {
  const value = String(transfer?.value ?? '').trim()

  return /^\d+$/.test(value) ? BigInt(value) : null
}

export async function connectTronLinkWallet() {
  if (!window.tronLink?.request) {
    throw new Error('TronLink is not installed.')
  }

  const response = await window.tronLink.request({ method: 'tron_requestAccounts' })

  if (response?.code && response.code !== 200) {
    throw new Error(response.message || 'TronLink connection was rejected.')
  }

  const injectedTronWeb = window.tronLink.tronWeb || window.tronWeb
  const account = injectedTronWeb?.defaultAddress?.base58

  if (!injectedTronWeb || !account) {
    throw new Error('TronLink is connected, but no active TRON account is available.')
  }

  return { tronWeb: injectedTronWeb, account }
}

export async function sendUsdtTransfer(tronWeb, amount, recipientAddress = PAYMENT_ADDRESS) {
  const amountInUnits = usdtToSmallestUnit(amount)
  const paymentAddress = paymentAddressForRequest(recipientAddress)
  const contract = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS)
  const tx = await contract.transfer(paymentAddress, amountInUnits.toString()).send({
    feeLimit: USDT_TRANSFER_FEE_LIMIT,
  })

  if (typeof tx === 'string') return tx
  if (tx?.txid) return tx.txid
  if (tx?.transaction?.txID) return tx.transaction.txID

  throw new Error('TronLink did not return a transaction id.')
}

export async function checkUsdtTransaction(txId, amount, recipientAddress = PAYMENT_ADDRESS) {
  const normalizedTxId = normalizeTxId(txId)
  const paymentAddress = paymentAddressForRequest(recipientAddress)

  if (!/^[a-fA-F0-9]{64}$/.test(normalizedTxId)) {
    return {
      status: 'failed',
      message: 'Transaction hash must be a 64-character TRON txid.',
    }
  }

  const expectedAmountInUnits = usdtToSmallestUnit(amount)
  const transfers = await fetchRecentUsdtTransfers(paymentAddress)
  const transfer = transfers.find((candidate) => normalizedTxIdEquals(candidate?.transaction_id, normalizedTxId))

  if (!transfer) {
    return {
      status: 'pending',
      message: 'Transaction is not in the checkout USDT transfer feed yet. Checking again shortly.',
    }
  }

  if (transfer?.to !== paymentAddress) {
    return {
      status: 'failed',
      message: 'Transaction was confirmed, but it was not sent to this checkout address.',
    }
  }

  if (transfer?.token_info?.address !== USDT_CONTRACT_ADDRESS) {
    return {
      status: 'failed',
      message: 'Transaction was confirmed, but it was not a USDT TRC20 transfer.',
    }
  }

  const foundAmount = transferAmountInSmallestUnit(transfer)

  if (foundAmount !== expectedAmountInUnits) {
    return {
      status: 'failed',
      message: `Transaction confirmed, but it sent ${usdtFromSmallestUnit(foundAmount ?? 0n)} USDT instead of ${amount} USDT.`,
    }
  }

  return {
    status: 'success',
    message: 'Payment confirmed on TRON.',
  }
}
