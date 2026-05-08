const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')

const REDDIT_CLIENT_ID = defineSecret('REDDIT_CLIENT_ID')
const REDDIT_CLIENT_SECRET = defineSecret('REDDIT_CLIENT_SECRET')

let cachedToken = null
let cachedTokenExpiresAt = 0

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) {
    return cachedToken
  }

  const credentials = Buffer.from(
    `${REDDIT_CLIENT_ID.value()}:${REDDIT_CLIENT_SECRET.value()}`,
  ).toString('base64')

  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'web:gta-vi-fan-site:v1.0.0',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error(`Reddit token request failed: ${response.status}`)
  }

  const data = await response.json()
  cachedToken = data.access_token
  cachedTokenExpiresAt = Date.now() + Math.max((data.expires_in - 60) * 1000, 0)
  return cachedToken
}

exports.redditHot = onRequest(
  {
    region: 'us-central1',
    secrets: [REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET],
  },
  async (request, response) => {
    try {
      const token = await getAccessToken()
      const redditResponse = await fetch('https://oauth.reddit.com/r/GTA6/hot?limit=6', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'web:gta-vi-fan-site:v1.0.0',
        },
      })

      if (!redditResponse.ok) {
        throw new Error(`Reddit posts request failed: ${redditResponse.status}`)
      }

      const data = await redditResponse.json()
      response.set('Cache-Control', 'public, max-age=300, s-maxage=300')
      response.json(data)
    } catch (error) {
      console.error(error)
      response.status(502).json({ error: 'Unable to load Reddit posts' })
    }
  },
)
