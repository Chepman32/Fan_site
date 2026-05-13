import { initializeApp } from 'firebase-admin/app'
import { logger } from 'firebase-functions'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { TronWeb } from 'tronweb'

initializeApp()

const PAYMENT_ADDRESS = 'TZ7XRNtbhznky43JwgBMPFNFm4KMNRLRei'
const TRONGRID_FULL_HOST = 'https://api.trongrid.io'
const USDT_CONTRACT_ADDRESS = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'
const USDT_DECIMALS = 6
const TRANSFER_EVENT_TOPIC = 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

function cleanHex(value = '') {
  return String(value).replace(/^0x/i, '').toLowerCase()
}

function normalizeTxId(value) {
  return String(value || '').trim()
}

function usdtToSmallestUnit(amount) {
  const amountString = String(amount || '').trim()

  if (!/^\d+(\.\d{1,6})?$/.test(amountString)) {
    throw new HttpsError('invalid-argument', 'USDT amount must use up to 6 decimal places.')
  }

  const [whole, fraction = ''] = amountString.split('.')
  const paddedFraction = fraction.padEnd(USDT_DECIMALS, '0')

  return BigInt(whole) * (10n ** BigInt(USDT_DECIMALS)) + BigInt(paddedFraction || '0')
}

function createTronGridClient() {
  return new TronWeb({ fullHost: TRONGRID_FULL_HOST })
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

function paymentResponse(status, message, txId) {
  return {
    status,
    message,
    txId,
    checkedAt: new Date().toISOString(),
  }
}

export const checkUsdtPayment = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 30,
    memory: '256MiB',
  },
  async (request) => {
    const txId = normalizeTxId(request.data?.txId)
    const amount = String(request.data?.amount || '').trim()

    if (!/^[a-fA-F0-9]{64}$/.test(txId)) {
      throw new HttpsError('invalid-argument', 'Transaction hash must be a 64-character TRON txid.')
    }

    const tronWeb = createTronGridClient()
    const expectedAmountInUnits = usdtToSmallestUnit(amount)

    try {
      const [transaction, transactionInfo] = await Promise.all([
        tronWeb.trx.getTransaction(txId),
        tronWeb.trx.getTransactionInfo(txId),
      ])

      if (!transactionInfo?.id) {
        return paymentResponse(
          'pending',
          'Transaction is not confirmed yet. Checking again shortly.',
          txId,
        )
      }

      const contractResult = transaction?.ret?.[0]?.contractRet
      const receiptResult = transactionInfo?.receipt?.result

      if (contractResult && contractResult !== 'SUCCESS') {
        return paymentResponse(
          'failed',
          `TRON returned ${contractResult.toLowerCase()} for this transaction.`,
          txId,
        )
      }

      if (receiptResult && receiptResult !== 'SUCCESS') {
        return paymentResponse(
          'failed',
          `The transaction receipt is ${receiptResult.toLowerCase()}.`,
          txId,
        )
      }

      if (!findMatchingUsdtTransfer(tronWeb, transactionInfo, expectedAmountInUnits)) {
        return paymentResponse(
          'failed',
          `Transaction confirmed, but it is not an exact ${amount} USDT transfer to this checkout address.`,
          txId,
        )
      }

      return paymentResponse('success', 'Payment confirmed on TRON.', txId)
    } catch (error) {
      logger.error('USDT payment verification failed', {
        txId,
        message: error.message,
      })

      if (error instanceof HttpsError) {
        throw error
      }

      throw new HttpsError('unavailable', 'TRONGrid verification is temporarily unavailable.')
    }
  },
)
