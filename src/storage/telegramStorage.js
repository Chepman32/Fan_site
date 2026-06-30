import { getFirebaseServices } from '../firebase/firebaseClient'

function uploadEndpoint() {
  return import.meta.env.VITE_TELEGRAM_UPLOAD_ENDPOINT?.trim() || ''
}

function fileEndpoint() {
  const configured = import.meta.env.VITE_TELEGRAM_FILE_ENDPOINT?.trim()
  if (configured) return configured

  const uploadUrl = uploadEndpoint()
  if (uploadUrl) return uploadUrl.replace(/\/upload\/?(?:\?.*)?$/, '/file')

  return '/api/telegram/file'
}

function uploadErrorMessage(errorPayload) {
  if (errorPayload?.error) return errorPayload.error
  if (errorPayload?.description) return errorPayload.description
  return 'Telegram upload failed.'
}

export async function uploadTelegramFile(file, { kind = 'attachment', title = '' } = {}) {
  const services = await getFirebaseServices()
  const authUser = services.auth.currentUser

  if (!authUser) {
    throw new Error('Sign in before uploading files.')
  }

  const endpoint = uploadEndpoint()
  if (!endpoint) {
    throw new Error('Set VITE_TELEGRAM_UPLOAD_ENDPOINT to the Telegram upload URL.')
  }

  const token = await authUser.getIdToken()
  const body = new FormData()
  body.set('kind', kind)
  body.set('title', title)
  body.set('file', file)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(uploadErrorMessage(payload))
  }

  return payload
}

export async function uploadTelegramFiles(files, options = {}, onProgress = () => {}) {
  const uploadedFiles = []

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    onProgress({ file, index, total: files.length })
    uploadedFiles.push(await uploadTelegramFile(file, options))
  }

  return uploadedFiles
}

export function telegramPostMediaUrl(postId, attachment) {
  if (!postId || !attachment?.fileId) return ''

  const params = new URLSearchParams({
    postId,
    fileId: attachment.fileId,
  })

  return `${fileEndpoint()}?${params.toString()}`
}
