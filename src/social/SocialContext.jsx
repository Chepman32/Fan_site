/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getFirebaseServices } from '../firebase/firebaseClient'
import {
  REACTION_OPTIONS,
  RUMOR_VOTE_OPTIONS,
  createSeedSocialState,
} from './socialData'
import { normalizePostUrl } from './postLinks'
import { P2P_PAYMENT_METHODS, P2P_SEED_LISTINGS } from '../p2p/p2pData'

const SocialContext = createContext(null)
const seedState = createSeedSocialState()
const FIREBASE_REQUEST_TIMEOUT_MS = 20000
const P2P_MAX_FILES = 8
const P2P_MAX_PROPERTIES = 12
const P2P_PAYMENT_METHOD_IDS = P2P_PAYMENT_METHODS.map((method) => method.id)
const POST_MAX_ATTACHMENTS = 4

function withFirebaseTimeout(promise) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error('Firebase took too long to respond. Check your project config and network connection.'))
    }, FIREBASE_REQUEST_TIMEOUT_MS)
  })

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId))
}

function mergeById(seedItems, firestoreItems) {
  const items = new Map(seedItems.map((item) => [item.id, item]))
  firestoreItems.forEach((item) => items.set(item.id, item))
  return Array.from(items.values())
}

function dateValue(value) {
  if (!value) return new Date().toISOString()
  if (typeof value === 'string') return value
  if (value.toDate) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return new Date(value).toISOString()
}

function docData(snapshot) {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    ...data,
    createdAt: dateValue(data.createdAt),
    joinedAt: dateValue(data.joinedAt),
    updatedAt: dateValue(data.updatedAt),
  }
}

function sortNewest(items, field = 'createdAt') {
  return [...items].sort((a, b) => new Date(b[field] ?? 0) - new Date(a[field] ?? 0))
}

function sortOldest(items, field = 'createdAt') {
  return [...items].sort((a, b) => new Date(a[field] ?? 0) - new Date(b[field] ?? 0))
}

function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

function normalizeUsername(username) {
  return username.trim().replace(/\s+/g, '')
}

function normalizeDisplayName(username) {
  return username.trim().replace(/\s+/g, ' ')
}

function normalizePostAttachments(attachments = []) {
  return attachments
    .filter((attachment) => /^(image|video)\//.test(attachment?.type || attachment?.mimeType || ''))
    .map((attachment) => ({
      name: String(attachment.name || attachment.fileName || 'post-media').slice(0, 160),
      size: Number(attachment.size || attachment.fileSize || 0),
      type: String(attachment.type || attachment.mimeType).slice(0, 120),
      provider: 'telegram_bot',
      fileId: String(attachment.fileId || '').slice(0, 512),
      fileUniqueId: String(attachment.fileUniqueId || '').slice(0, 256),
      thumbnailFileId: String(attachment.thumbnailFileId || '').slice(0, 512),
      thumbnailFileUniqueId: String(attachment.thumbnailFileUniqueId || '').slice(0, 256),
      messageId: String(attachment.messageId || '').slice(0, 64),
      kind: 'ugc-post-media',
      storageStatus: 'stored',
    }))
    .filter((attachment) => attachment.fileId && attachment.size > 0)
    .slice(0, POST_MAX_ATTACHMENTS)
}

function getInitials(username) {
  return username.slice(0, 2).toUpperCase()
}

function getUserById(state, userId) {
  return state.users.find((user) => user.id === userId)
}

function withoutUser(votes, userId) {
  return votes.filter((voteUserId) => voteUserId !== userId)
}

function setSingleChoice(collectionValue, optionIds, targetId, userId) {
  const next = { ...collectionValue }

  optionIds.forEach((optionId) => {
    next[optionId] = withoutUser(next[optionId] ?? [], userId)
  })

  const currentVotes = collectionValue[targetId] ?? []
  if (!currentVotes.includes(userId)) {
    next[targetId] = [...currentVotes, userId]
  }

  return next
}

function totalVotes(votes) {
  return Object.values(votes).reduce((total, entries) => total + entries.length, 0)
}

function normalizeP2PListingPayload({
  title = '',
  description = '',
  category = 'other',
  price = 0,
  currency = 'USD',
  cryptoWalletAddress = '',
  deliveryMethod = '',
  paymentMethods = ['crypto'],
  properties = [],
  previewDataUrl = '',
  files = [],
}) {
  const cleanTitle = title.trim().slice(0, 90)
  const cleanDescription = description.trim().slice(0, 520)
  const cleanCryptoWalletAddress = cryptoWalletAddress.trim().slice(0, 128)
  const cleanDeliveryMethod = deliveryMethod.trim().slice(0, 80)
  const numericPrice = Number(price)
  const cleanProperties = properties
    .map((property) => ({
      key: property.key?.trim().slice(0, 30) || '',
      value: property.value?.trim().slice(0, 64) || '',
    }))
    .filter((property) => property.key && property.value)
    .slice(0, P2P_MAX_PROPERTIES)
  const cleanPaymentMethods = paymentMethods
    .filter((method) => P2P_PAYMENT_METHOD_IDS.includes(method))
    .slice(0, P2P_PAYMENT_METHOD_IDS.length)
  const cleanFiles = files.map((file) => ({
    name: file.name || file.fileName || 'listing-file',
    size: Number(file.size || file.fileSize || 0),
    type: file.type || file.mimeType || 'application/octet-stream',
    provider: file.provider || 'telegram_bot',
    fileId: file.fileId || '',
    fileUniqueId: file.fileUniqueId || '',
    messageId: file.messageId || '',
    kind: file.kind || 'p2p-listing-file',
    storageStatus: file.storageStatus || 'stored',
  })).slice(0, P2P_MAX_FILES)

  return {
    title: cleanTitle,
    description: cleanDescription,
    category,
    price: numericPrice,
    currency,
    cryptoWalletAddress: cleanCryptoWalletAddress,
    deliveryMethod: cleanDeliveryMethod,
    paymentMethods: cleanPaymentMethods.length ? cleanPaymentMethods : ['crypto'],
    properties: cleanProperties,
    previewDataUrl,
    files: cleanFiles,
  }
}

function emptyReactionMap() {
  return REACTION_OPTIONS.reduce((reactions, option) => {
    reactions[option.id] = []
    return reactions
  }, {})
}

function emptyVoteMap() {
  return RUMOR_VOTE_OPTIONS.reduce((votes, option) => {
    votes[option.id] = []
    return votes
  }, {})
}

function computeLevel(submittedSources, acceptedSources) {
  const score = submittedSources + acceptedSources * 3

  if (score >= 12) return { name: 'Archivist', level: 4, score }
  if (score >= 7) return { name: 'Source Hunter', level: 3, score }
  if (score >= 3) return { name: 'Verified Spotter', level: 2, score }
  return { name: 'Spotter', level: 1, score }
}

function computeBadges(user, state) {
  if (!user) return []

  const badges = new Set(user.badges ?? [])
  const submittedSources = state.sources.filter((source) => source.authorId === user.id)
  const acceptedSources = submittedSources.filter((source) => source.status === 'accepted')
  const rumorVoteCount = state.rumors.reduce((count, rumor) => {
    return count + Object.values(rumor.votes ?? {}).filter((entries) => entries.includes(user.id)).length
  }, 0)
  const trailerCommentCount = state.comments.filter(
    (comment) => comment.authorId === user.id && comment.targetType === 'trailer',
  ).length

  if (new Date(user.joinedAt) < new Date('2026-11-19T00:00:00.000Z')) badges.add('Early Follower')
  if (user.followedTopics.includes('Trailers') || trailerCommentCount > 0) badges.add('Trailer Watcher')
  if (submittedSources.length > 0) badges.add('Source Hunter')
  if (acceptedSources.length > 0 || rumorVoteCount >= 2) badges.add('Fact Checker')
  if (user.followedTopics.includes('Map / Leonida') || user.followedTopics.includes('Characters')) {
    badges.add('Vice City Local')
  }

  return Array.from(badges)
}

export function getUserProfile(user, state) {
  if (!user) return null

  const safeUser = {
    ...user,
    bio: user.bio ?? '',
    photoDataUrl: user.photoDataUrl ?? '',
    followedTopics: user.followedTopics ?? [],
    badges: user.badges ?? [],
    bookmarkedPostIds: user.bookmarkedPostIds ?? [],
    purchasesByTx: user.purchasesByTx ?? {},
  }
  const submittedSources = state.sources.filter((source) => source.authorId === safeUser.id)
  const acceptedSources = submittedSources.filter((source) => source.status === 'accepted')
  const level = computeLevel(submittedSources.length, acceptedSources.length)

  return {
    ...safeUser,
    initials: getInitials(safeUser.username),
    submittedSources: submittedSources.length,
    acceptedSources: acceptedSources.length,
    badges: computeBadges(safeUser, state),
    followedTopicsCount: safeUser.followedTopics.length,
    reputation: level,
  }
}

function authUserFallback(authUser) {
  if (!authUser) return null

  return {
    id: authUser.uid,
    username: authUser.displayName || authUser.email?.split('@')[0] || 'Player',
    usernameLower: (authUser.displayName || authUser.email?.split('@')[0] || 'player').toLowerCase(),
    avatarColor: '#00d9ff',
    bio: '',
    photoDataUrl: '',
    joinedAt: authUser.metadata?.creationTime
      ? new Date(authUser.metadata.creationTime).toISOString()
      : new Date().toISOString(),
    followedTopics: [],
    badges: [],
    bookmarkedPostIds: [],
    purchasesByTx: {},
  }
}

function publicUserDocument(user, updatedAt) {
  return {
    username: user.username,
    usernameLower: user.usernameLower ?? user.username.toLowerCase(),
    avatarColor: user.avatarColor,
    bio: user.bio ?? '',
    photoDataUrl: user.photoDataUrl ?? '',
    joinedAt: user.joinedAt,
    followedTopics: user.followedTopics ?? [],
    badges: user.badges ?? [],
    bookmarkedPostIds: user.bookmarkedPostIds ?? [],
    purchasesByTx: user.purchasesByTx ?? {},
    updatedAt,
  }
}

function seedDocPayload(item) {
  const payload = { ...item }
  delete payload.id
  return payload
}

function firebaseErrorMessage(error) {
  const code = error?.code ?? ''

  if (code.includes('auth/email-already-in-use')) return 'That email is already registered.'
  if (code.includes('auth/invalid-credential')) return 'No account found for those credentials.'
  if (code.includes('auth/weak-password')) return 'Password must be at least 6 characters.'
  if (code.includes('auth/operation-not-allowed') || code.includes('auth/configuration-not-found')) {
    return 'Email/password auth is not enabled for this Firebase project.'
  }
  if (code.includes('permission-denied')) return 'Firebase rejected this write. Check Firestore rules.'

  return error?.message || 'Firebase request failed.'
}

async function ensureUserDocument(services, authUser) {
  const userRef = services.doc(services.db, 'users', authUser.uid)

  await services.runTransaction(services.db, async (transaction) => {
    const existing = await transaction.get(userRef)
    if (existing.exists()) return

    const username = authUser.displayName || authUser.email?.split('@')[0] || 'Player'
    transaction.set(userRef, publicUserDocument({
      username,
      usernameLower: username.toLowerCase(),
      avatarColor: '#00d9ff',
      bio: '',
      photoDataUrl: '',
      joinedAt: new Date().toISOString(),
      followedTopics: [],
      badges: [],
      bookmarkedPostIds: [],
      purchasesByTx: {},
    }, services.serverTimestamp()))
  })
}

async function updateReactionTransaction(services, postId, userId, reactionId) {
  const ref = services.doc(services.db, 'posts', postId)
  const seedPost = seedState.posts.find((post) => post.id === postId)

  await services.runTransaction(services.db, async (transaction) => {
    const snapshot = await transaction.get(ref)
    const post = snapshot.exists()
      ? snapshot.data()
      : seedPost

    if (!post) throw new Error('Post no longer exists.')

    const currentReactions = post.reactions ?? emptyReactionMap()
    const nextReactions = { ...currentReactions }
    const alreadyReacted = nextReactions[reactionId]?.includes(userId)

    REACTION_OPTIONS.forEach((option) => {
      nextReactions[option.id] = withoutUser(nextReactions[option.id] ?? [], userId)
    })

    if (!alreadyReacted) {
      nextReactions[reactionId] = [...(nextReactions[reactionId] ?? []), userId]
    }

    if (snapshot.exists()) {
      transaction.update(ref, { reactions: nextReactions })
    } else {
      transaction.set(ref, { ...seedDocPayload(seedPost), reactions: nextReactions })
    }
  })
}

async function updateVoteTransaction({ services, collectionName, id, optionId, userId, seedItems, optionIds }) {
  const ref = services.doc(services.db, collectionName, id)
  const seedItem = seedItems.find((item) => item.id === id)

  await services.runTransaction(services.db, async (transaction) => {
    const snapshot = await transaction.get(ref)
    const item = snapshot.exists()
      ? snapshot.data()
      : seedItem

    if (!item) throw new Error('Voting target no longer exists.')

    const currentVotes = item.votes ?? emptyVoteMap()
    const nextVotes = setSingleChoice(currentVotes, optionIds, optionId, userId)

    if (snapshot.exists()) {
      transaction.update(ref, { votes: nextVotes })
    } else {
      transaction.set(ref, { ...seedDocPayload(seedItem), votes: nextVotes })
    }
  })
}

const initialState = {
  version: seedState.version,
  users: seedState.users,
  posts: sortNewest(seedState.posts),
  rumors: sortNewest(seedState.rumors, 'updatedAt'),
  sources: sortNewest(seedState.sources),
  polls: seedState.polls,
  comments: sortOldest(seedState.comments),
  messages: [],
  p2pListings: sortNewest(P2P_SEED_LISTINGS),
}

export function SocialProvider({ children }) {
  const [services, setServices] = useState(null)
  const [state, setState] = useState(initialState)
  const [authUser, setAuthUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [backendError, setBackendError] = useState('')
  const clearBackendError = useCallback(() => setBackendError(''), [])

  useEffect(() => {
    let canceled = false

    getFirebaseServices()
      .then((loadedServices) => {
        if (!canceled) setServices(loadedServices)
      })
      .catch((error) => {
        if (!canceled) {
          setBackendError(firebaseErrorMessage(error))
          setAuthLoading(false)
        }
      })

    return () => {
      canceled = true
    }
  }, [])

  useEffect(() => {
    if (!services) return undefined

    return services.onAuthStateChanged(services.auth, (nextAuthUser) => {
      setAuthUser(nextAuthUser)
      setAuthLoading(false)

      if (nextAuthUser) {
        withFirebaseTimeout(ensureUserDocument(services, nextAuthUser)).catch((error) => {
          console.warn('Profile sync failed:', error)
        })
      } else {
        setState((currentState) => ({ ...currentState, messages: [] }))
      }
    })
  }, [services])

  useEffect(() => {
    if (!services) return undefined

    const subscriptions = [
      services.onSnapshot(services.collection(services.db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(docData)
        setState((currentState) => ({
          ...currentState,
          users: mergeById(seedState.users, users),
        }))
      }, (error) => setBackendError(firebaseErrorMessage(error))),
      services.onSnapshot(services.collection(services.db, 'posts'), (snapshot) => {
        const posts = snapshot.docs.map(docData)
        setState((currentState) => ({
          ...currentState,
          posts: sortNewest(mergeById(seedState.posts, posts)),
        }))
      }, (error) => setBackendError(firebaseErrorMessage(error))),
      services.onSnapshot(services.collection(services.db, 'rumors'), (snapshot) => {
        const rumors = snapshot.docs.map(docData)
        setState((currentState) => ({
          ...currentState,
          rumors: sortNewest(mergeById(seedState.rumors, rumors), 'updatedAt'),
        }))
      }, (error) => setBackendError(firebaseErrorMessage(error))),
      services.onSnapshot(services.collection(services.db, 'sources'), (snapshot) => {
        const sources = snapshot.docs.map(docData)
        setState((currentState) => ({
          ...currentState,
          sources: sortNewest(mergeById(seedState.sources, sources)),
        }))
      }, (error) => setBackendError(firebaseErrorMessage(error))),
      services.onSnapshot(services.collection(services.db, 'polls'), (snapshot) => {
        const polls = snapshot.docs.map(docData)
        setState((currentState) => ({
          ...currentState,
          polls: mergeById(seedState.polls, polls),
        }))
      }, (error) => setBackendError(firebaseErrorMessage(error))),
      services.onSnapshot(services.collection(services.db, 'comments'), (snapshot) => {
        const comments = snapshot.docs.map(docData)
        setState((currentState) => ({
          ...currentState,
          comments: sortOldest(mergeById(seedState.comments, comments)),
        }))
      }, (error) => setBackendError(firebaseErrorMessage(error))),
      services.onSnapshot(services.collection(services.db, 'p2pListings'), (snapshot) => {
        const p2pListings = snapshot.docs.map(docData)
        setState((currentState) => ({
          ...currentState,
          p2pListings: sortNewest(mergeById(P2P_SEED_LISTINGS, p2pListings)),
        }))
      }, (error) => setBackendError(firebaseErrorMessage(error))),
    ]

    return () => subscriptions.forEach((unsubscribe) => unsubscribe())
  }, [services])

  useEffect(() => {
    if (!services || !authUser) {
      return undefined
    }

    const messagesQuery = services.query(
      services.collection(services.db, 'messages'),
      services.where('participantIds', 'array-contains', authUser.uid),
    )

    return services.onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(docData)
      setState((currentState) => ({
        ...currentState,
        messages: sortOldest(messages),
      }))
    }, (error) => setBackendError(firebaseErrorMessage(error)))
  }, [services, authUser])

  const currentUser = useMemo(() => {
    return getUserById(state, authUser?.uid) ?? authUserFallback(authUser)
  }, [state, authUser])
  const currentProfile = useMemo(() => getUserProfile(currentUser, state), [currentUser, state])

  const usersById = useMemo(() => {
    return state.users.reduce((users, user) => {
      users[user.id] = user
      return users
    }, {})
  }, [state.users])

  const publicUsers = useMemo(() => {
    return state.users.map((user) => getUserProfile(user, state))
  }, [state])

  const requireUser = () => Boolean(services && authUser)

  const getReadyServices = async () => {
    if (services) return services

    try {
      const loadedServices = await withFirebaseTimeout(getFirebaseServices())
      setServices(loadedServices)
      return loadedServices
    } catch (error) {
      const message = firebaseErrorMessage(error)
      setAuthError(message)
      setBackendError(message)
      setAuthLoading(false)
      return null
    }
  }

  const signup = async ({ username, email, password }) => {
    setAuthError('')
    const cleanUsername = normalizeUsername(username)
    const cleanEmail = normalizeEmail(email)

    if (cleanUsername.length < 3) {
      setAuthError('Choose a username with at least 3 characters.')
      return false
    }

    if (!cleanEmail.includes('@')) {
      setAuthError('Enter a valid email address.')
      return false
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.')
      return false
    }

    const usernameTaken = state.users.some(
      (user) => user.username.toLowerCase() === cleanUsername.toLowerCase(),
    )

    if (usernameTaken) {
      setAuthError('That username is already registered.')
      return false
    }

    const readyServices = await getReadyServices()
    if (!readyServices) return false

    try {
      const colors = ['#ff2d95', '#00d9ff', '#ffb000', '#3ddc97', '#9d4edd']
      const result = await withFirebaseTimeout(
        readyServices.createUserWithEmailAndPassword(readyServices.auth, cleanEmail, password),
      )
      const profile = {
        id: result.user.uid,
        username: cleanUsername,
        usernameLower: cleanUsername.toLowerCase(),
        avatarColor: colors[state.users.length % colors.length],
        bio: '',
        photoDataUrl: '',
        joinedAt: new Date().toISOString(),
        followedTopics: [],
        badges: [],
        bookmarkedPostIds: [],
        purchasesByTx: {},
      }

      setState((currentState) => ({
        ...currentState,
        users: mergeById(currentState.users, [profile]),
      }))

      void Promise.allSettled([
        withFirebaseTimeout(readyServices.updateProfile(result.user, { displayName: cleanUsername })),
        withFirebaseTimeout(
          readyServices.setDoc(
            readyServices.doc(readyServices.db, 'users', result.user.uid),
            publicUserDocument(profile, readyServices.serverTimestamp()),
          ),
        ),
      ]).then((results) => {
        const failure = results.find((syncResult) => syncResult.status === 'rejected')
        if (failure) {
          setBackendError(`Account created, but profile sync failed: ${firebaseErrorMessage(failure.reason)}`)
        }
      })

      return true
    } catch (error) {
      setAuthError(firebaseErrorMessage(error))
      return false
    }
  }

  const login = async ({ email, password }) => {
    setAuthError('')

    const readyServices = await getReadyServices()
    if (!readyServices) return false

    try {
      await withFirebaseTimeout(
        readyServices.signInWithEmailAndPassword(readyServices.auth, normalizeEmail(email), password),
      )
      return true
    } catch (error) {
      setAuthError(firebaseErrorMessage(error))
      return false
    }
  }

  const logout = async () => {
    if (!services) return
    await services.signOut(services.auth)
    setAuthError('')
  }

  const createPost = async ({ body, tags, linkUrl = '', attachments = [] }) => {
    if (!requireUser()) return false
    const cleanBody = body.trim()
    const cleanLinkUrl = normalizePostUrl(linkUrl)
    const cleanAttachments = normalizePostAttachments(attachments)
    if (!cleanBody && !cleanLinkUrl && !cleanAttachments.length) return false
    if (linkUrl.trim() && !cleanLinkUrl) {
      setBackendError('Enter a valid http or https link.')
      return false
    }

    const payload = {
      authorId: authUser.uid,
      body: cleanBody,
      tags,
      createdAt: services.serverTimestamp(),
      reactions: emptyReactionMap(),
    }

    if (cleanLinkUrl) {
      payload.linkUrl = cleanLinkUrl
    }

    if (cleanAttachments.length) {
      payload.attachments = cleanAttachments
    }

    try {
      await services.addDoc(services.collection(services.db, 'posts'), payload)
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const deletePost = async (postId) => {
    if (!requireUser()) return false

    try {
      await services.deleteDoc(services.doc(services.db, 'posts', postId))
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const reactToPost = async (postId, reactionId) => {
    if (!requireUser()) return false

    try {
      await updateReactionTransaction(services, postId, authUser.uid, reactionId)
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const voteRumor = async (rumorId, voteId) => {
    if (!requireUser()) return false

    try {
      await updateVoteTransaction({
        services,
        collectionName: 'rumors',
        id: rumorId,
        optionId: voteId,
        userId: authUser.uid,
        seedItems: seedState.rumors,
        optionIds: RUMOR_VOTE_OPTIONS.map((option) => option.id),
      })
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const followTopic = async (topic) => {
    if (!requireUser()) return false
    const userRef = services.doc(services.db, 'users', authUser.uid)
    const alreadyFollowing = currentProfile?.followedTopics.includes(topic)

    try {
      await services.updateDoc(userRef, {
        followedTopics: alreadyFollowing ? services.arrayRemove(topic) : services.arrayUnion(topic),
        updatedAt: services.serverTimestamp(),
      })
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const updateUserProfile = async ({ username, bio, photoDataUrl }) => {
    if (!requireUser()) return false

    setBackendError('')
    const cleanUsername = normalizeDisplayName(username)
    const cleanBio = bio.trim().slice(0, 220)
    const cleanPhotoDataUrl = photoDataUrl || ''

    if (cleanUsername.length < 3) {
      setBackendError('Choose a name with at least 3 characters.')
      return false
    }

    const usernameTaken = state.users.some((user) => {
      return user.id !== authUser.uid && user.username.toLowerCase() === cleanUsername.toLowerCase()
    })

    if (usernameTaken) {
      setBackendError('That name is already registered.')
      return false
    }

    const userRef = services.doc(services.db, 'users', authUser.uid)

    try {
      await withFirebaseTimeout(
        services.updateDoc(userRef, {
          username: cleanUsername,
          usernameLower: cleanUsername.toLowerCase(),
          bio: cleanBio,
          photoDataUrl: cleanPhotoDataUrl,
          updatedAt: services.serverTimestamp(),
        }),
      )

      await withFirebaseTimeout(services.updateProfile(authUser, { displayName: cleanUsername }))
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const recordPurchase = async ({ txId, amount, network, items = [] }) => {
    if (!requireUser()) return false

    const safeTxId = txId?.trim()
    if (!safeTxId || items.length === 0) return false

    const purchase = {
      txId: safeTxId,
      amount,
      network,
      purchasedAt: new Date().toISOString(),
      items: items.map((item) => ({
        productId: item.id,
        categoryId: item.categoryId,
        price: item.price,
      })),
    }

    try {
      await withFirebaseTimeout(
        services.setDoc(
          services.doc(services.db, 'users', authUser.uid),
          {
            purchasesByTx: {
              [safeTxId]: purchase,
            },
            updatedAt: services.serverTimestamp(),
          },
          { merge: true },
        ),
      )
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const toggleBookmark = async (postId) => {
    if (!requireUser()) return false

    const postExists = state.posts.some((post) => post.id === postId)
    if (!postExists) return false

    const userRef = services.doc(services.db, 'users', authUser.uid)
    const alreadyBookmarked = currentProfile?.bookmarkedPostIds.includes(postId)

    try {
      await services.updateDoc(userRef, {
        bookmarkedPostIds: alreadyBookmarked ? services.arrayRemove(postId) : services.arrayUnion(postId),
        updatedAt: services.serverTimestamp(),
      })
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const submitSource = async ({ url, claim, category, reason }) => {
    if (!requireUser()) return false

    if (!url.trim() || !claim.trim() || !reason.trim()) return false

    try {
      await services.addDoc(services.collection(services.db, 'sources'), {
        authorId: authUser.uid,
        url: url.trim(),
        claim: claim.trim(),
        category,
        reason: reason.trim(),
        status: 'review',
        createdAt: services.serverTimestamp(),
      })
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const votePoll = async (pollId, optionId) => {
    if (!requireUser()) return false
    const poll = state.polls.find((item) => item.id === pollId)
    if (!poll) return false

    try {
      await updateVoteTransaction({
        services,
        collectionName: 'polls',
        id: pollId,
        optionId,
        userId: authUser.uid,
        seedItems: seedState.polls,
        optionIds: poll.options.map((option) => option.id),
      })
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const addComment = async ({ targetType, targetId, body }) => {
    if (!requireUser()) return false

    const cleanBody = body.trim()
    if (!cleanBody) return false

    try {
      await services.addDoc(services.collection(services.db, 'comments'), {
        targetType,
        targetId,
        authorId: authUser.uid,
        body: cleanBody,
        createdAt: services.serverTimestamp(),
      })
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const sendMessage = async ({ toId, body }) => {
    if (!requireUser()) return false
    const cleanBody = body.trim()
    if (!cleanBody || toId === authUser.uid) return false

    try {
      await services.addDoc(services.collection(services.db, 'messages'), {
        fromId: authUser.uid,
        toId,
        participantIds: [authUser.uid, toId].sort(),
        body: cleanBody,
        createdAt: services.serverTimestamp(),
      })
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const createP2PListing = async ({
    title,
    description,
    category,
    price,
    currency,
    cryptoWalletAddress,
    deliveryMethod,
    paymentMethods = ['crypto'],
    properties = [],
    previewDataUrl = '',
    files = [],
  }) => {
    if (!requireUser()) return false

    setBackendError('')
    const payload = normalizeP2PListingPayload({
      title,
      description,
      category,
      price,
      currency,
      cryptoWalletAddress,
      deliveryMethod,
      paymentMethods,
      properties,
      previewDataUrl,
      files,
    })

    if (
      payload.title.length < 3 ||
      !Number.isFinite(payload.price) ||
      payload.price < 0 ||
      !payload.properties.length
    ) {
      setBackendError('Complete the listing title, price, and properties.')
      return false
    }

    try {
      await services.addDoc(services.collection(services.db, 'p2pListings'), {
        sellerId: authUser.uid,
        ...payload,
        status: 'active',
        createdAt: services.serverTimestamp(),
        updatedAt: services.serverTimestamp(),
      })
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const updateP2PListing = async (listingId, updates) => {
    if (!requireUser()) return false

    const listing = state.p2pListings.find((item) => item.id === listingId)
    if (!listing || listing.sellerId !== authUser.uid) return false

    setBackendError('')
    const payload = normalizeP2PListingPayload(updates)

    if (
      payload.title.length < 3 ||
      !Number.isFinite(payload.price) ||
      payload.price < 0 ||
      !payload.properties.length
    ) {
      setBackendError('Complete the listing title, price, and properties.')
      return false
    }

    try {
      await services.updateDoc(services.doc(services.db, 'p2pListings', listingId), {
        ...payload,
        updatedAt: services.serverTimestamp(),
      })
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const updateP2PListingStatus = async (listingId, status) => {
    if (!requireUser()) return false
    if (!['active', 'sold'].includes(status)) return false

    const listing = state.p2pListings.find((item) => item.id === listingId)
    if (!listing || listing.sellerId !== authUser.uid) return false

    try {
      await services.updateDoc(services.doc(services.db, 'p2pListings', listingId), {
        status,
        updatedAt: services.serverTimestamp(),
      })
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const deleteP2PListing = async (listingId) => {
    if (!requireUser()) return false

    const listing = state.p2pListings.find((item) => item.id === listingId)
    if (!listing || listing.sellerId !== authUser.uid) return false

    try {
      await services.deleteDoc(services.doc(services.db, 'p2pListings', listingId))
      return true
    } catch (error) {
      setBackendError(firebaseErrorMessage(error))
      return false
    }
  }

  const value = {
    state,
    usersById,
    publicUsers,
    currentUser,
    currentProfile,
    authError,
    backendError,
    clearBackendError,
    authLoading,
    isSignedIn: Boolean(authUser),
    signup,
    login,
    logout,
    createPost,
    deletePost,
    reactToPost,
    voteRumor,
    followTopic,
    updateUserProfile,
    recordPurchase,
    toggleBookmark,
    submitSource,
    votePoll,
    addComment,
    sendMessage,
    createP2PListing,
    updateP2PListing,
    updateP2PListingStatus,
    deleteP2PListing,
    totalVotes,
    getUserProfile: (userId) => getUserProfile(getUserById(state, userId), state),
  }

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>
}

export function useSocial() {
  const context = useContext(SocialContext)
  if (!context) {
    throw new Error('useSocial must be used inside SocialProvider')
  }
  return context
}
