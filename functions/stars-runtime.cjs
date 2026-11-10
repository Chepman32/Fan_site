const { createStarsService, createStarsHandlers } = require('./shop-stars.cjs')

const WEBSITE_PROJECT = 'gta-vi-fan-site'
const INVALID_SESSION_CODES = new Set([
  'auth/argument-error', 'auth/invalid-argument', 'auth/invalid-id-token', 'auth/id-token-expired',
  'auth/id-token-revoked', 'auth/user-disabled', 'auth/user-not-found',
])

function projectId(value) {
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(value || '')) throw new Error('Invalid Stars Firebase project configuration.')
  return value
}

function createStarsRuntime({ admin, catalog, env = process.env, logger = console }) {
  // Deployment/billing identity is independent of the website's Auth audience.
  // Application Default Credentials remain the Cloud Run service account;
  // projectId selects the existing Firebase resources that account may access.
  const authProject = projectId(env.STARS_AUTH_PROJECT_ID || WEBSITE_PROJECT)
  const dataProject = projectId(env.STARS_DATA_PROJECT_ID || WEBSITE_PROJECT)
  const appFor = (id) => {
    const name = `stars-${id}`
    return admin.apps.find((app) => app.name === name) || admin.initializeApp({ projectId: id }, name)
  }
  const auth = admin.auth(appFor(authProject))
  const db = admin.firestore(appFor(dataProject))
  const config = {
    enabled: env.TELEGRAM_STARS_ENABLED === 'true',
    botUsername: env.TELEGRAM_STARS_BOT_USERNAME || 'FSFESbot',
    botToken: env.TELEGRAM_STARS_BOT_TOKEN || '',
    webhookSecret: env.TELEGRAM_STARS_WEBHOOK_SECRET || '',
    testMode: env.TELEGRAM_STARS_TEST_MODE === 'true',
    siteOrigin: 'https://leonidaloot.com', supportUrl: 'https://leonidaloot.com/contact',
  }
  return createStarsHandlers({ service: createStarsService({ db, catalog, config }), config, logger,
    authenticate: async (req) => {
      const match = (req.get('authorization') || '').match(/^Bearer\s+(.+)$/i)
      if (!match) throw Object.assign(new Error('Sign in to pay with Stars.'), { status: 401 })
      try {
        return await auth.verifyIdToken(match[1], true)
      } catch (error) {
        if (INVALID_SESSION_CODES.has(error?.code)) {
          throw Object.assign(new Error('Sign in again to pay with Stars.'), { status: 401 })
        }
        throw Object.assign(new Error('Sign-in verification is temporarily unavailable. Please try again.'), { status: 503 })
      }
    },
  })
}

module.exports = { createStarsRuntime }
