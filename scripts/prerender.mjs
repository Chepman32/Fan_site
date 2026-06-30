import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const templatePath = path.join(distDir, 'index.html')
const serverEntryPath = path.join(rootDir, 'dist-ssr', 'entry-server.js')

const {
  PRERENDER_ROUTES,
  SITEMAP_ROUTES,
  SITE_ORIGIN,
  render,
} = await import(pathToFileUrl(serverEntryPath))

function pathToFileUrl(filePath) {
  return pathToFileURL(filePath).href
}

function routeFilePath(route) {
  if (route === '/') return path.join(distDir, 'index.html')
  return path.join(distDir, route.slice(1), 'index.html')
}

function routeAliasPath(route) {
  if (route === '/') return null
  return path.join(distDir, `${route.slice(1)}.html`)
}

function injectHead(template, head) {
  return template.replace(
    /<!--seo-head-start-->[\s\S]*?<!--seo-head-end-->/,
    `<!--seo-head-start-->\n    ${head}\n    <!--seo-head-end-->`,
  )
}

function injectAppHtml(template, appHtml) {
  return template.replace(
    /<div id="root"[^>]*>[\s\S]*?<\/div>/,
    `<div id="root">${appHtml}</div>`,
  )
}

function sitemapXml() {
  const today = new Date().toISOString().slice(0, 10)
  const priorities = new Map([
    ['/', '1.0'],
    ['/leonida', '0.9'],
    ['/leonida/locations', '0.8'],
    ['/community', '0.8'],
    ['/shop', '0.8'],
    ['/news', '0.8'],
    ['/leonida/locations/vice-city', '0.8'],
  ])
  const frequencies = new Map([
    ['/community', 'daily'],
    ['/news', 'daily'],
    ['/', 'daily'],
    ['/shop', 'weekly'],
  ])

  const urls = SITEMAP_ROUTES.map((route) => {
    return [
      '  <url>',
      `    <loc>${SITE_ORIGIN}${route === '/' ? '/' : route}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${frequencies.get(route) || (route === '/' ? 'weekly' : 'monthly')}</changefreq>`,
      `    <priority>${priorities.get(route) || '0.7'}</priority>`,
      '  </url>',
    ].join('\n')
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

function robotsTxt() {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /__/firebase/',
    '',
    `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
    '',
  ].join('\n')
}

const template = await readFile(templatePath, 'utf8')

for (const route of PRERENDER_ROUTES) {
  const rendered = render(route)
  const html = injectAppHtml(injectHead(template, rendered.head), rendered.html)
  const outPath = routeFilePath(route)
  const aliasPath = routeAliasPath(route)

  await mkdir(path.dirname(outPath), { recursive: true })
  await writeFile(outPath, html)

  if (aliasPath) {
    await mkdir(path.dirname(aliasPath), { recursive: true })
    await writeFile(aliasPath, html)
  }
}

await writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml())
await writeFile(path.join(distDir, 'robots.txt'), robotsTxt())

console.log(`Prerendered ${PRERENDER_ROUTES.length} routes.`)
