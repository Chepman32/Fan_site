import { readFile, stat } from 'node:fs/promises'
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
} = await import(pathToFileURL(serverEntryPath).href)

const failures = []

function fail(message) {
  failures.push(message)
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

  validateJsonLd(html, route)
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

if (failures.length) {
  console.error(failures.map((message) => `- ${message}`).join('\n'))
  process.exit(1)
}

console.log(`SEO validation passed for ${PRERENDER_ROUTES.length} routes.`)
