export const PAYMENT_ADDRESS = 'TZ7XRNtbhznky43JwgBMPFNFm4KMNRLRei'
export const P2P_PLATFORM_USDT_ADDRESS = import.meta.env.VITE_P2P_PLATFORM_USDT_ADDRESS?.trim() || PAYMENT_ADDRESS
export const PAYMENT_NETWORK = 'USDT TRC20'
export const PAYMENT_NETWORK_SUFFIX = '(TRC 20)'
export const TRONGRID_FULL_HOST = 'https://api.trongrid.io'
export const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
export const USDT_DECIMALS = 6
export const USDT_TRANSFER_FEE_LIMIT = 100_000_000
export const P2P_COMMISSION_RATE = normalizedCommissionRate(import.meta.env.VITE_P2P_COMMISSION_RATE ?? '0.02')
export const P2P_COMMISSION_PERCENT_LABEL = `${new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
}).format(P2P_COMMISSION_RATE * 100)}%`

function normalizedCommissionRate(value) {
  const rate = Number(value)

  return Number.isFinite(rate) && rate >= 0 && rate < 1 ? rate : 0.02
}

export function shopPriceToCents(price) {
  const cents = Math.round(Number(price) * 100)

  if (!Number.isFinite(cents)) {
    throw new Error(`Invalid shop price: ${price}`)
  }

  return cents
}

export function shopCentsToPrice(cents) {
  return Number((cents / 100).toFixed(2))
}

export function formatShopPrice(price) {
  return (shopPriceToCents(price) / 100).toFixed(2)
}

export function formatUsdtAmount(amount) {
  const numericAmount = Number(amount)
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: safeAmount % 1 === 0 ? 2 : 0,
    maximumFractionDigits: USDT_DECIMALS,
  }).format(safeAmount)
}
