const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s<>"']*)?/i

function trimUrlCandidate(value) {
  return value.trim().replace(/[),.!?;:\]]+$/g, '')
}

function isHost(hostname, domain) {
  return hostname === domain || hostname.endsWith(`.${domain}`)
}

function cleanVideoId(value) {
  if (!value) return ''
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120)
}

function getPathParts(url) {
  return url.pathname.split('/').filter(Boolean)
}

export function normalizePostUrl(value = '') {
  const raw = trimUrlCandidate(value)
  if (!raw) return ''

  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`

  try {
    const url = new URL(candidate)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
    return url.href
  } catch {
    return ''
  }
}

export function getFirstPostUrl(text = '') {
  return getFirstPostLink(text)?.url ?? ''
}

export function getFirstPostLink(text = '') {
  const match = text.match(URL_PATTERN)
  if (!match) return null

  const raw = trimUrlCandidate(match[0])
  const url = normalizePostUrl(raw)
  if (!url) return null

  return {
    url,
    raw,
    index: match.index ?? 0,
    matchText: match[0],
  }
}

export function removeFirstPostUrl(text = '') {
  const link = getFirstPostLink(text)
  if (!link) return text.trim()

  const before = text.slice(0, link.index).trimEnd()
  const after = text.slice(link.index + link.matchText.length).trimStart()
  return [before, after].filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function getYoutubeEmbed(url, hostname) {
  if (hostname === 'youtu.be') {
    const [id] = getPathParts(url)
    return cleanVideoId(id)
  }

  if (!isHost(hostname, 'youtube.com') && !isHost(hostname, 'youtube-nocookie.com')) return ''

  if (url.pathname === '/watch') return cleanVideoId(url.searchParams.get('v'))

  const [kind, id] = getPathParts(url)
  if (['embed', 'shorts', 'live'].includes(kind)) return cleanVideoId(id)

  return ''
}

function getVimeoEmbed(url, hostname) {
  if (!isHost(hostname, 'vimeo.com')) return ''

  const parts = getPathParts(url)
  const videoIndex = parts[0] === 'video' ? 1 : 0
  const id = parts[videoIndex]

  if (!/^\d+$/.test(id ?? '')) return ''
  return id
}

function getDailymotionEmbed(url, hostname) {
  if (hostname === 'dai.ly') {
    const [id] = getPathParts(url)
    return cleanVideoId(id)
  }

  if (!isHost(hostname, 'dailymotion.com')) return ''

  const parts = getPathParts(url)
  const id = parts[0] === 'video' ? parts[1] : ''
  return cleanVideoId(id)
}

function getRutubeEmbed(url, hostname) {
  if (!isHost(hostname, 'rutube.ru')) return ''

  const parts = getPathParts(url)
  const id = parts[0] === 'video' ? parts[1] : ''
  return cleanVideoId(id)
}

function getVkEmbed(url, hostname) {
  if (!isHost(hostname, 'vk.com') && !isHost(hostname, 'vkvideo.ru')) return ''

  const oid = url.searchParams.get('oid')
  const id = url.searchParams.get('id')
  if (/^-?\d+$/.test(oid ?? '') && /^\d+$/.test(id ?? '')) {
    return `https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2`
  }

  const token = `${url.pathname}${url.searchParams.get('z') ?? ''}`.match(/video(-?\d+)_(\d+)/)
  if (!token) return ''

  return `https://vk.com/video_ext.php?oid=${token[1]}&id=${token[2]}&hd=2`
}

function getVideoAttachment(url) {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, '')
  const youtubeId = getYoutubeEmbed(url, hostname)
  if (youtubeId) {
    return {
      provider: 'YouTube',
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    }
  }

  const vimeoId = getVimeoEmbed(url, hostname)
  if (vimeoId) {
    return {
      provider: 'Vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    }
  }

  const vkEmbedUrl = getVkEmbed(url, hostname)
  if (vkEmbedUrl) {
    return {
      provider: 'VK',
      embedUrl: vkEmbedUrl,
    }
  }

  if (
    isHost(hostname, 'facebook.com')
    && (url.pathname.includes('/videos/') || url.pathname.includes('/watch') || url.pathname.includes('/reel/') || url.searchParams.has('v'))
  ) {
    return {
      provider: 'Facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.href)}&show_text=false&width=734`,
    }
  }

  if (hostname === 'fb.watch') {
    return {
      provider: 'Facebook',
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url.href)}&show_text=false&width=734`,
    }
  }

  const dailymotionId = getDailymotionEmbed(url, hostname)
  if (dailymotionId) {
    return {
      provider: 'Dailymotion',
      embedUrl: `https://www.dailymotion.com/embed/video/${dailymotionId}`,
    }
  }

  const rutubeId = getRutubeEmbed(url, hostname)
  if (rutubeId) {
    return {
      provider: 'Rutube',
      embedUrl: `https://rutube.ru/play/embed/${rutubeId}`,
    }
  }

  return null
}

export function getPostAttachment(post) {
  const sourceUrl = normalizePostUrl(post?.linkUrl) || getFirstPostUrl(post?.body)
  if (!sourceUrl) return null

  const url = new URL(sourceUrl)
  const host = url.hostname.replace(/^www\./, '')
  const video = getVideoAttachment(url)

  if (video) {
    return {
      type: 'video',
      host,
      sourceUrl,
      ...video,
    }
  }

  return {
    type: 'link',
    host,
    sourceUrl,
  }
}
