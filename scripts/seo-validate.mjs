import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const serverEntryPath = path.join(rootDir, 'dist-ssr', 'entry-server.js')

const {
  NOINDEX_PRERENDER_ROUTES,
  PRERENDER_ROUTES,
  SITEMAP_ROUTES,
  SITE_ORIGIN,
  SHOP_ROUTES_WITH_UNIQUE_DETAIL_COPY,
} = await import(pathToFileURL(serverEntryPath).href)

const failures = []
const requiredRoutes = [
  '/',
  '/news',
  '/about',
  '/leonida',
  '/leonida/characters',
  '/leonida/locations',
  '/leonida/vehicles',
  '/leonida/weapons',
  '/leonida/social-media',
  '/shop',
  '/p2p',
  '/community',
]
const forbiddenPhrases = [
  'Loading latest news',
  'Loading character guide',
  'Loading Leonida guide',
  'Loading vehicle guide',
  'Loading weapons guide',
  'Loading social media guide',
  'Preparing social media guide',
  'Loading game information',
  'Loading news article',
  'Loading...',
  'undefined',
  'NaN',
]
const routeSpecificForbiddenPhrases = {
  '/leonida/social-media': [
    'Loading social media guide',
    'Preparing social media guide',
  ],
}
const loadingPlaceholderPattern = /\bLoading\b(?:[\s:.!?-]+[^<]{0,90})?/g

function fail(message) {
  failures.push(message)
}

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) return listHtmlFiles(entryPath)
    return entry.isFile() && entry.name.endsWith('.html') ? [entryPath] : []
  }))

  return files.flat()
}

function routeFilePath(route) {
  if (route === '/') return path.join(distDir, 'index.html')
  return path.join(distDir, route.slice(1), 'index.html')
}

function routeAliasPath(route) {
  if (route === '/') return null
  return path.join(distDir, `${route.slice(1)}.html`)
}

function readTag(html, pattern) {
  return html.match(pattern)?.[1] || ''
}

function canonicalFor(route) {
  return `${SITE_ORIGIN}${route === '/' ? '/' : route}`
}

function textFromHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function mainText(html) {
  const rawMain = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || ''
  return textFromHtml(rawMain)
}

function validateNoLoadingPlaceholder(label, html) {
  const visibleText = textFromHtml(html)
  const matches = Array.from(visibleText.matchAll(loadingPlaceholderPattern))
    .map((match) => match[0].trim())
    .filter(Boolean)

  for (const match of matches) {
    fail(`${label} contains loading placeholder text: "${match}"`)
  }
}

async function readRouteHtml(route) {
  try {
    return await readFile(routeFilePath(route), 'utf8')
  } catch {
    fail(`Missing prerendered HTML for ${route}`)
    return ''
  }
}

async function validateAliasHtml(route, html) {
  const aliasPath = routeAliasPath(route)
  if (!aliasPath) return

  try {
    const aliasHtml = await readFile(aliasPath, 'utf8')
    if (aliasHtml !== html) fail(`${route} .html alias does not match prerendered route HTML`)
  } catch {
    fail(`${route} is missing .html alias for slashless static serving`)
  }
}

function validateJsonLd(html, route) {
  const raw = readTag(html, /<script id="structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/)
  if (!raw) {
    fail(`${route} is missing JSON-LD`)
    return
  }

  try {
    const parsed = JSON.parse(raw)
    const graph = parsed['@graph']
    if (!Array.isArray(graph) || graph.length < 3) fail(`${route} JSON-LD graph is incomplete`)
  } catch (error) {
    fail(`${route} has invalid JSON-LD: ${error.message}`)
  }
}

const titleOwners = new Map()
const descriptionOwners = new Map()

for (const route of PRERENDER_ROUTES) {
  const html = await readRouteHtml(route)
  if (!html) continue

  const title = readTag(html, /<title>(.*?)<\/title>/)
  const description = readTag(html, /<meta name="description" content="(.*?)" \/>/)
  const robots = readTag(html, /<meta name="robots" content="(.*?)" \/>/)
  const canonical = readTag(html, /<link rel="canonical" href="(.*?)" \/>/)
  const ogImage = readTag(html, /<meta property="og:image" content="(.*?)" \/>/)
  const twitterImage = readTag(html, /<meta name="twitter:image" content="(.*?)" \/>/)
  const h1Count = (html.match(/<h1\b/g) || []).length
  const isNoindex = NOINDEX_PRERENDER_ROUTES.includes(route)

  await validateAliasHtml(route, html)

  if (!title) fail(`${route} is missing a title`)
  if (!description) fail(`${route} is missing a meta description`)
  if (!robots) fail(`${route} is missing robots metadata`)
  if (canonical !== canonicalFor(route)) fail(`${route} canonical is ${canonical || 'missing'}`)
  if (!ogImage.endsWith('/og-image.png')) fail(`${route} og:image must use og-image.png`)
  if (!twitterImage.endsWith('/og-image.png')) fail(`${route} twitter:image must use og-image.png`)
  if (isNoindex && !robots.includes('noindex')) fail(`${route} must be noindex`)
  if (!isNoindex && robots.includes('noindex')) fail(`${route} should be indexable`)
  if (!isNoindex && h1Count !== 1) fail(`${route} should have exactly one H1, found ${h1Count}`)

  for (const phrase of forbiddenPhrases) {
    if (html.includes(phrase)) fail(`${route} contains forbidden placeholder/value: "${phrase}"`)
  }
  for (const phrase of routeSpecificForbiddenPhrases[route] || []) {
    if (html.includes(phrase)) fail(`${route} contains social-media guide loading copy: "${phrase}"`)
  }
  if (html.includes('>null<')) fail(`${route} contains null placeholder text`)

  if (!isNoindex) {
    const readableMainText = mainText(html)
    if (!readableMainText) fail(`${route} has empty main content`)
    if (readableMainText.length < 500) fail(`${route} main content is too thin (${readableMainText.length} characters)`)

    if (titleOwners.has(title)) fail(`${route} duplicates title with ${titleOwners.get(title)}`)
    else titleOwners.set(title, route)

    if (descriptionOwners.has(description)) fail(`${route} duplicates description with ${descriptionOwners.get(description)}`)
    else descriptionOwners.set(description, route)
  }

  validateJsonLd(html, route)
}

for (const route of requiredRoutes) {
  try {
    await readFile(routeFilePath(route), 'utf8')
  } catch {
    fail(`Missing required prerendered HTML for ${route}`)
  }
}

for (const htmlFile of await listHtmlFiles(distDir)) {
  const html = await readFile(htmlFile, 'utf8')
  const relativePath = path.relative(distDir, htmlFile)
  validateNoLoadingPlaceholder(relativePath, html)
}

const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8')
const sitemapRoutes = Array.from(sitemap.matchAll(/<loc>https:\/\/leonidaloot\.com(\/[^<]*)<\/loc>/g))
  .map((match) => (match[1] === '/' ? '/' : match[1].replace(/\/$/, '')))
  .sort()
const expectedRoutes = [...SITEMAP_ROUTES].sort()

if (JSON.stringify(sitemapRoutes) !== JSON.stringify(expectedRoutes)) {
  fail(`Sitemap routes differ. Expected ${expectedRoutes.join(', ')}, got ${sitemapRoutes.join(', ')}`)
}

for (const route of NOINDEX_PRERENDER_ROUTES) {
  if (sitemapRoutes.includes(route)) fail(`${route} must not be in sitemap.xml`)
}

const uniqueShopRoutes = new Set(SHOP_ROUTES_WITH_UNIQUE_DETAIL_COPY)
const sitemapShopRoutes = SITEMAP_ROUTES.filter((route) => route.startsWith('/shop/'))
const prerenderedShopRoutes = PRERENDER_ROUTES.filter((route) => route.startsWith('/shop/'))

for (const route of sitemapShopRoutes) {
  if (!uniqueShopRoutes.has(route)) {
    fail(`${route} is indexable but does not have unique long-form product copy`)
  }
}

for (const route of uniqueShopRoutes) {
  if (!SITEMAP_ROUTES.includes(route)) {
    fail(`${route} has unique long-form product copy but is missing from the sitemap`)
  }
}

for (const route of prerenderedShopRoutes) {
  if (!uniqueShopRoutes.has(route) && !NOINDEX_PRERENDER_ROUTES.includes(route)) {
    fail(`${route} must be noindex until it has unique long-form product copy`)
  }
}

const robots = await readFile(path.join(distDir, 'robots.txt'), 'utf8')
if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) {
  fail('robots.txt must reference sitemap.xml')
}

try {
  const ogImage = await stat(path.join(distDir, 'og-image.png'))
  if (ogImage.size <= 0) fail('og-image.png is empty')
} catch {
  fail('dist/og-image.png is missing')
}

try {
  const rootHtml = await readFile(path.join(distDir, 'index.html'), 'utf8')
  const requiredFaviconLinks = [
    'href="/favicon.ico"',
    'href="/favicon-48x48.png"',
    'href="/favicon-96x96.png"',
    'href="/favicon.png"',
    'href="/apple-touch-icon.png"',
  ]

  for (const link of requiredFaviconLinks) {
    if (!rootHtml.includes(link)) fail(`index.html is missing favicon link ${link}`)
  }
} catch {
  fail('Unable to validate favicon links in index.html')
}

async function validatePngSize(fileName, expectedSize) {
  try {
    const image = await readFile(path.join(distDir, fileName))
    const width = image.readUInt32BE(16)
    const height = image.readUInt32BE(20)

    if (width !== expectedSize || height !== expectedSize) {
      fail(`${fileName} must be ${expectedSize}x${expectedSize}, found ${width}x${height}`)
    }
  } catch {
    fail(`${fileName} is missing or invalid`)
  }
}

await validatePngSize('favicon-48x48.png', 48)
await validatePngSize('favicon-96x96.png', 96)
await validatePngSize('favicon.png', 256)
await validatePngSize('apple-touch-icon.png', 180)

try {
  const icon = await readFile(path.join(distDir, 'favicon.ico'))
  if (icon.readUInt16LE(0) !== 0 || icon.readUInt16LE(2) !== 1 || icon.readUInt16LE(4) < 1) {
    fail('favicon.ico is not a valid ICO file')
  }
} catch {
  fail('favicon.ico is missing or invalid')
}

if (failures.length) {
  console.error(failures.map((message) => `- ${message}`).join('\n'))
  process.exit(1)
}

console.log(`SEO validation passed for ${PRERENDER_ROUTES.length} routes.`)
