import { getFirebaseServices } from '../firebase/firebaseClient'

function accountEndpoint() {
  return import.meta.env.VITE_ACCOUNT_ENDPOINT?.trim() || '/api/account'
}

function accountError(error) {
  const code = error?.code || ''
  if (code.includes('wrong-password') || code.includes('invalid-credential')) return new Error('The current password is incorrect.')
  if (code.includes('weak-password')) return new Error('Choose a password with at least 6 characters.')
  if (code.includes('too-many-requests')) return new Error('Too many attempts. Please wait and try again.')
  if (code.includes('requires-recent-login')) return new Error('Confirm your current password and try again.')
  return error instanceof Error ? error : new Error('The account action could not be completed.')
}

async function currentAccount() {
  const services = await getFirebaseServices()
  const user = services.auth.currentUser
  if (!user) throw new Error('Sign in to manage your account.')
  return { services, user }
}

async function authorizedRequest(action, options = {}) {
  const { forceRefresh = false, ...body } = options
  const { user } = await currentAccount()
  const token = await user.getIdToken(forceRefresh)
  const response = await fetch(accountEndpoint(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...body }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'The account action could not be completed.')
  return payload
}

export async function sendVerificationEmail() {
  try {
    const { services, user } = await currentAccount()
    await services.sendEmailVerification(user)
  } catch (error) {
    throw accountError(error)
  }
}

export async function sendPasswordReset() {
  try {
    const { services, user } = await currentAccount()
    if (!user.email) throw new Error('This account does not have an email address.')
    await services.sendPasswordResetEmail(services.auth, user.email)
  } catch (error) {
    throw accountError(error)
  }
}

async function reauthenticate(password) {
  const { services, user } = await currentAccount()
  if (!user.email) throw new Error('Password confirmation is unavailable for this account.')
  const credential = services.EmailAuthProvider.credential(user.email, password)
  await services.reauthenticateWithCredential(user, credential)
  return { services, user }
}

export async function changePassword(currentPassword, newPassword) {
  try {
    const { services, user } = await reauthenticate(currentPassword)
    await services.updatePassword(user, newPassword)
  } catch (error) {
    throw accountError(error)
  }
}

export async function signOutEverywhere() {
  const { services } = await currentAccount()
  await authorizedRequest('revokeSessions')
  await services.signOut(services.auth)
}

export async function downloadAccountData() {
  return authorizedRequest('export')
}

export async function deleteAccount(currentPassword) {
  try {
    const { services } = await reauthenticate(currentPassword)
    await authorizedRequest('delete', { forceRefresh: true })
    await services.signOut(services.auth).catch(() => {})
  } catch (error) {
    throw accountError(error)
  }
}
