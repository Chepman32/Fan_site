import { TronWeb } from 'tronweb'
import {
  PAYMENT_ADDRESS,
  TRONGRID_FULL_HOST,
  USDT_CONTRACT_ADDRESS,
  USDT_DECIMALS,
  USDT_TRANSFER_FEE_LIMIT,
} from './shopData'

const TRANSFER_EVENT_TOPIC = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

function cleanHex(value = '') {
  return String(value).replace(/^0x/i, '').toLowerCase()
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

function tronAddressFromHex(tronWeb, value) {
  const hex = cleanHex(value)
  if (!hex) return ''

  const tronHex = hex.startsWith('41') ? hex : `41${hex.slice(-40)}`
  return tronWeb.address.fromHex(tronHex)
}

function tronAddressFromTopic(tronWeb, topic) {
  const hex = cleanHex(topic)
  if (!hex) return ''

  return tronWeb.address.fromHex(`41${hex.slice(-40)}`)
}

function parseTransferLog(tronWeb, log) {
  const topics = log?.topics || []
  const eventTopic = cleanHex(topics[0])

  if (eventTopic !== TRANSFER_EVENT_TOPIC || topics.length < 3) {
    return null
  }

  return {
    tokenAddress: tronAddressFromHex(tronWeb, log.address),
    toAddress: tronAddressFromTopic(tronWeb, topics[2]),
    amount: BigInt(`0x${cleanHex(log.data || '0') || '0'}`),
  }
}

function findMatchingUsdtTransfer(tronWeb, transactionInfo, expectedAmountInUnits) {
  const logs = transactionInfo?.log || []

  return logs.some((log) => {
    const transfer = parseTransferLog(tronWeb, log)

    return transfer
      && transfer.tokenAddress === USDT_CONTRACT_ADDRESS
      && transfer.toAddress === PAYMENT_ADDRESS
      && transfer.amount === expectedAmountInUnits
  })
}

export async function checkUsdtTransaction(txId, amount) {
  const normalizedTxId = normalizeTxId(txId)

  if (!/^[a-fA-F0-9]{64}$/.test(normalizedTxId)) {
    return {
      status: 'failed',
      message: 'Transaction hash must be a 64-character TRON txid.',
    }
  }

  const tronWeb = createTronGridClient()
  const expectedAmountInUnits = usdtToSmallestUnit(amount)
  const [transaction, transactionInfo] = await Promise.all([
    tronWeb.trx.getTransaction(normalizedTxId),
    tronWeb.trx.getTransactionInfo(normalizedTxId),
  ])

  if (!transactionInfo?.id) {
    return {
      status: 'pending',
      message: 'Transaction found is not confirmed yet. Checking again shortly.',
    }
  }

  const contractResult = transaction?.ret?.[0]?.contractRet
  const receiptResult = transactionInfo?.receipt?.result

  if (contractResult && contractResult !== 'SUCCESS') {
    return {
      status: 'failed',
      message: `TRON returned ${contractResult.toLowerCase()} for this transaction.`,
    }
  }

  if (receiptResult && receiptResult !== 'SUCCESS') {
    return {
      status: 'failed',
      message: `The transaction receipt is ${receiptResult.toLowerCase()}.`,
    }
  }

  if (!findMatchingUsdtTransfer(tronWeb, transactionInfo, expectedAmountInUnits)) {
    return {
      status: 'failed',
      message: `Transaction confirmed, but it is not an exact ${amount} USDT transfer to this checkout address.`,
    }
  }

  return {
    status: 'success',
    message: 'Payment confirmed on TRON.',
  }
}
