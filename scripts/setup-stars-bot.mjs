import { execFile, spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import process from 'node:process'

const exec = promisify(execFile)
const args = process.argv.slice(2)
const argument = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback
const project = argument('--project', 'fan-site-496610')
const sourceSecret = argument('--source-secret', 'TELEGRAM_STARS_BOT_TOKEN')
const webhookUrl = argument('--webhook-url', 'https://leonidaloot.com/api/telegram/stars/webhook')
const configuring = args.includes('--configure')
const testMode = args.includes('--test-mode')
const saving = args.includes('--save-token')

function promptForToken() {
  if (!process.stdin.isTTY) throw new Error('Run --save-token in Terminal to enter the token privately.')
  const entry = spawnSync('/bin/bash', ['-c', `
    IFS= read -r -s -p 'Paste the current @FSFESbot API token and press Enter: ' stars_token || exit 1
    printf '\\n' >&2
    printf '%s' "$stars_token"
  `], { encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'], maxBuffer: 4096 })
  if (entry.status !== 0) throw new Error('Token entry was cancelled.')
  return entry.stdout.trim()
}

async function saveToken(token) {
  const scratch = await mkdtemp(join(tmpdir(), 'stars-secret-'))
  try {
    // Keep any Firebase CLI diagnostic log out of the repository and delete it after saving.
    const result = spawnSync('firebase', ['functions:secrets:set', 'TELEGRAM_STARS_BOT_TOKEN',
      '--project', project, '--data-file', '-', '--non-interactive'], {
      cwd: scratch, input: token, stdio: ['pipe', 'ignore', 'ignore'], timeout: 60_000,
    })
    if (result.status !== 0) throw new Error('Telegram accepted the token, but Firebase reported a save error. Check the Firebase CLI login and connection.')
  } finally {
    await rm(scratch, { recursive: true, force: true })
  }
}

async function readSecret(name) {
  try {
    const { stdout } = await exec('firebase', ['functions:secrets:access', name, '--project', project], { maxBuffer: 32_768 })
    return stdout.trim()
  } catch { throw new Error(`Cannot read ${name} from Firebase Secret Manager. Set it using firebase functions:secrets:set ${name} --project ${project}.`) }
}

async function main() {
  if (saving && (configuring || testMode || args.includes('--source-secret'))) {
    throw new Error('Use --save-token on its own to verify and save the live bot token.')
  }
  if (configuring && project !== 'gta-vi-fan-site' && !args.includes('--webhook-url')) throw new Error('Pass --webhook-url with the deployed Cloud Run URL plus /api/telegram/stars/webhook.')
  if (testMode && !args.includes('--webhook-url')) throw new Error('Test mode requires an explicit staging --webhook-url; the live shop webhook cannot be used.')
  if (configuring && sourceSecret !== 'TELEGRAM_STARS_BOT_TOKEN') throw new Error('--source-secret is for read-only checks. Configure using the deployed TELEGRAM_STARS_BOT_TOKEN secret.')
  const token = saving ? promptForToken() : await readSecret(sourceSecret)
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) throw new Error('Copy only the full API token shown for @FSFESbot.')
  const call = async (method, body = {}) => {
    let response
    let result
    try {
      response = await fetch(`https://api.telegram.org/bot${token}${testMode ? '/test' : ''}/${method}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(10_000),
      })
      result = await response.json()
    } catch { throw new Error(`Could not reach Telegram for ${method}. Check the connection and retry.`) }
    if (!response.ok || !result.ok) throw new Error(`Telegram ${method} returned HTTP ${response.status}.`)
    return result.result
  }
  const bot = await call('getMe')
  if (bot.username?.toLowerCase() !== 'fsfesbot' && !testMode) {
    throw new Error('This secret belongs to another bot. The live shop is configured for @FSFESbot.')
  }
  console.log(`Verified @${bot.username}.`)
  if (saving) {
    await saveToken(token)
    console.log(`Saved the verified bot token in ${project}.`)
    return
  }
  const current = await call('getWebhookInfo')
  if (current.url && current.url !== webhookUrl) {
    throw new Error('This bot already has a different webhook. I left it unchanged. Integrate Stars into that update router before switching the webhook; Telegram supports only one webhook per bot.')
  }
  console.log(current.url ? 'The shop webhook is already registered.' : 'No webhook is currently registered. Check for a separate getUpdates polling process before configuring this shared bot.')
  console.log(`Pending updates: ${current.pending_update_count || 0}.`)
  if (configuring) {
    const secret = await readSecret('TELEGRAM_STARS_WEBHOOK_SECRET')
    if (!/^[A-Za-z0-9_-]{16,256}$/.test(secret)) throw new Error('Use a webhook secret of 16–256 letters, numbers, underscores, or hyphens.')
    await call('setWebhook', { url: webhookUrl, secret_token: secret,
      allowed_updates: ['message', 'pre_checkout_query'], drop_pending_updates: false })
    const commands = await call('getMyCommands')
    const updated = commands.filter((command) => command.command !== 'paysupport')
    updated.push({ command: 'paysupport', description: 'Help with Leonida Loot purchases and refunds' })
    await call('setMyCommands', { commands: updated })
    console.log('Registered the shop webhook and /paysupport. Existing default bot commands were preserved.')
  } else {
    console.log('Read-only check complete. After deployment, run npm run stars:bot -- --configure to register payment updates.')
  }
}

main().catch((error) => {
  // Sanitized messages only: fetch/CLI errors can include credential-bearing URLs.
  console.error(error.message)
  process.exitCode = 1
})
