import process from 'node:process'
import { spawn } from 'node:child_process'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { starsEndpoint } from '../src/shop/starsEndpoint.js'

const endpoint = starsEndpoint(process.env.VITE_TELEGRAM_STARS_API_ENDPOINT)
if (!endpoint.startsWith('https://') || !new URL(endpoint).hostname.endsWith('.run.app')) {
  throw new Error('Set VITE_TELEGRAM_STARS_API_ENDPOINT to the deployed Cloud Run URL plus /api/shop/stars.')
}
const root = new URL('../', import.meta.url)
const temporaryConfig = new URL('../firebase.stars-cloud.generated.json', import.meta.url)
const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit', env: { ...process.env, VITE_TELEGRAM_STARS_API_ENDPOINT: endpoint } })
  child.on('error', reject)
  child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}.`)))
})

// A separate config preserves unrelated Hosting rewrites, and does not refer
// to undeployed Stars Functions in the project's unbilled Functions runtime.
const existing = JSON.parse(await readFile(new URL('../firebase.json', import.meta.url), 'utf8'))
const config = { firestore: existing.firestore, hosting: { ...existing.hosting,
  rewrites: existing.hosting.rewrites.filter((rewrite) => !rewrite.source.startsWith('/api/shop/stars') && rewrite.source !== '/api/telegram/stars/webhook'),
} }
let created = false
try {
  await writeFile(temporaryConfig, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx' })
  created = true
  await run('npm', ['run', 'build'])
  await run('firebase', ['deploy', '--config', 'firebase.stars-cloud.generated.json', '--only', 'firestore:rules,firestore:indexes,hosting', '--project', 'gta-vi-fan-site'])
} finally { if (created) await unlink(temporaryConfig).catch(() => {}) }
