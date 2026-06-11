import { getFirebaseServices } from '../firebase/firebaseClient'

function payoutEndpoint() {
  return import.meta.env.VITE_P2P_PAYOUT_ENDPOINT?.trim() || '/api/p2p/payout'
}

function payoutErrorMessage(errorPayload) {
  if (errorPayload?.error) return errorPayload.error
  if (errorPayload?.message) return errorPayload.message
  return 'P2P payout failed.'
}

export async function settleP2PUsdtPayment({ listingId, txId }) {
  const services = await getFirebaseServices()
  const authUser = services.auth.currentUser

  if (!authUser) {
    throw new Error('Sign in before verifying a P2P payment.')
  }

  const endpoint = payoutEndpoint()
  if (!endpoint) {
    throw new Error('Set VITE_P2P_PAYOUT_ENDPOINT to the Firebase P2P payout URL.')
  }

  const token = await authUser.getIdToken()
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ listingId, txId }),
  })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payoutErrorMessage(payload))
  }

  return payload
}
