import { getFirebaseServices } from '../firebase/firebaseClient'
import {
  PAYMENT_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  USDT_DECIMALS,
  USDT_TRANSFER_FEE_LIMIT,
} from './shopData'

export function normalizeTxId(value) {
  return String(value).trim()
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

export async function sendUsdtTransfer(tronWeb, amount) {
  const amountInUnits = usdtToSmallestUnit(amount)
  const contract = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS)
  const tx = await contract.transfer(PAYMENT_ADDRESS, amountInUnits.toString()).send({
    feeLimit: USDT_TRANSFER_FEE_LIMIT,
  })

  if (typeof tx === 'string') return tx
  if (tx?.txid) return tx.txid
  if (tx?.transaction?.txID) return tx.transaction.txID

  throw new Error('TronLink did not return a transaction id.')
}

export async function checkUsdtTransaction(txId, amount) {
  const normalizedTxId = normalizeTxId(txId)

  if (!/^[a-fA-F0-9]{64}$/.test(normalizedTxId)) {
    return {
      status: 'failed',
      message: 'Transaction hash must be a 64-character TRON txid.',
    }
  }

  const { functions, httpsCallable } = await getFirebaseServices()
  const checkUsdtPayment = httpsCallable(functions, 'checkUsdtPayment')
  const result = await checkUsdtPayment({
    txId: normalizedTxId,
    amount,
  })

  return result.data
}
