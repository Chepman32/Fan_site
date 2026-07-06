import { getFirebaseServices } from '../firebase/firebaseClient'

function newsletterEndpoint() {
  return import.meta.env.VITE_NEWSLETTER_ENDPOINT?.trim() || '/api/newsletter/subscribe'
}

export async function subscribeToNewsletter() {
  const services = await getFirebaseServices()
  const user = services.auth.currentUser
  if (!user) throw new Error('Sign in to subscribe to site updates.')

  const token = await user.getIdToken()
  const response = await fetch(newsletterEndpoint(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'subscribe' }),
  })
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.toLowerCase().includes('application/json')
  const payload = isJson ? await response.json().catch(() => ({})) : {}

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Newsletter signup is not available yet. Deploy the newsletterSubscription function and Hosting rewrite.')
    }
    throw new Error(payload.error || 'Newsletter signup could not be completed.')
  }

  if (!isJson || payload.status !== 'subscribed') {
    throw new Error('The newsletter service returned an invalid response.')
  }

  return payload
}
