export function starsEndpoint(configured) {
  const value = configured?.trim()
  if (!value) return '/api/shop/stars'
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error()
    return url.href.replace(/\/+$/, '')
  } catch { throw new Error('The Stars payment endpoint is not configured correctly.') }
}
