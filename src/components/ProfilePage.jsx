import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Bookmark,
  Camera,
  Download,
  FileText,
  MessageSquare,
  Save,
  Settings,
  ShoppingBag,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { useSocial } from '../social/SocialContext'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { buildMessageDialogs } from '../messages/messageHelpers'
import { SHOP_PRODUCT_BY_ID } from '../shop/shopData'
import { localizeShopProduct } from '../shop/shopLocalization'
import { usePreferences } from '../preferences/AppPreferences.jsx'
import CommunityPostCard from './CommunityPostCard.jsx'
import PostAttachment from './PostAttachment.jsx'
import PostMediaAttachments from './PostMediaAttachments.jsx'
import './ProfilePage.css'

function formatDate(date, lang = 'en', dateTimeFormat = 'locale') {
  const locale = dateTimeFormat === 'mdy' ? 'en-US' : dateTimeFormat === 'dmy' ? 'en-GB' : lang
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function formatRelative(date, s, lang, dateTimeFormat) {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.max(Math.floor(diff / 60000), 0)
  if (minutes < 1) return s.relativeNow
  if (minutes < 60) return `${minutes}${s.relativeMin}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}${s.relativeHour}`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}${s.relativeDay}`
  return formatDate(date, lang, dateTimeFormat)
}

function shortenTxId(txId = '') {
  if (txId.length <= 18) return txId
  return `${txId.slice(0, 10)}...${txId.slice(-8)}`
}

function userFallback(userId) {
  return {
    id: userId,
    username: 'Unknown user',
    avatarColor: '#6b6b7b',
    photoDataUrl: '',
  }
}

function profileToForm(profile) {
  return {
    profileId: profile?.id ?? '',
    username: profile?.username ?? '',
    bio: profile?.bio ?? '',
    photoDataUrl: profile?.photoDataUrl ?? '',
  }
}

function ProfileAvatar({ user, size = 'md' }) {
  const initials = (user?.username ?? '?').slice(0, 2).toUpperCase()

  return (
    <div
      className={`profile-avatar ${size}`}
      style={{ backgroundColor: `${user?.avatarColor ?? '#6b6b7b'}22`, color: user?.avatarColor }}
      aria-hidden="true"
    >
      {user?.photoDataUrl ? <img src={user.photoDataUrl} alt="" /> : initials}
    </div>
  )
}

function resizePhoto(file, errors) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(errors.chooseImageError))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error(errors.readImageError))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error(errors.prepareImageError))
      image.onload = () => {
        const maxSize = 512
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * scale))
        const height = Math.max(1, Math.round(image.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.86))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function ProfilePage({ onOpenAuth, onOpenSettings, onNavigate }) {
  const {
    backendError,
    currentUser,
    currentProfile,
    deletePost,
    isSignedIn,
    publicUsers,
    reactToPost,
    state,
    toggleBookmark,
    updateUserProfile,
    usersById,
  } = useSocial()
  const { t, lang } = useTranslation()
  const { dateTimeFormat } = usePreferences()
  const s = t.social
  const shopCopy = { ...t.shop, lang }
  const [formDraft, setFormDraft] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const form = formDraft?.profileId === currentProfile?.id ? formDraft : profileToForm(currentProfile)
  const currentProfileId = currentProfile?.id || ''

  const bookmarkedPosts = useMemo(() => {
    const bookmarkIds = currentProfile?.bookmarkedPostIds ?? []
    return bookmarkIds
      .map((postId) => state.posts.find((post) => post.id === postId))
      .filter(Boolean)
  }, [currentProfile?.bookmarkedPostIds, state.posts])

  const myPosts = useMemo(() => {
    if (!currentProfile) return []
    return state.posts.filter((post) => post.authorId === currentProfile.id)
  }, [currentProfile, state.posts])

  const mySources = useMemo(() => {
    if (!currentProfile) return []
    return state.sources.filter((source) => source.authorId === currentProfile.id)
  }, [currentProfile, state.sources])

  const purchasedItems = useMemo(() => {
    const purchasesByTx = currentProfile?.purchasesByTx ?? {}
    const purchases = Object.values(purchasesByTx)
      .sort((purchaseA, purchaseB) => new Date(purchaseB.purchasedAt ?? 0) - new Date(purchaseA.purchasedAt ?? 0))
    const itemsByProductId = new Map()

    purchases.forEach((purchase) => {
      const purchaseItems = purchase.items ?? []

      purchaseItems.forEach((item) => {
        const productId = item.productId
        if (!productId || itemsByProductId.has(productId)) return

        itemsByProductId.set(productId, {
          product: SHOP_PRODUCT_BY_ID[productId],
          purchase,
          purchaseItem: item,
        })
      })
    })

    return Array.from(itemsByProductId.values())
  }, [currentProfile?.purchasesByTx])

  const leaderboard = useMemo(() => {
    return [...publicUsers].sort((a, b) => b.reputation.score - a.reputation.score).slice(0, 5)
  }, [publicUsers])

  const messageDialogCount = useMemo(() => {
    if (!currentProfileId) return 0
    return buildMessageDialogs(state.messages, currentProfileId).length
  }, [currentProfileId, state.messages])

  const updateField = (field, value) => {
    setSaved(false)
    setFormDraft((currentForm) => ({
      ...form,
      ...(currentForm?.profileId === form.profileId ? currentForm : {}),
      [field]: value,
    }))
  }

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setFormError('')
      const photoDataUrl = await resizePhoto(file, {
        chooseImageError: s.chooseImageError,
        readImageError: s.readImageError,
        prepareImageError: s.prepareImageError,
      })
      updateField('photoDataUrl', photoDataUrl)
    } catch (error) {
      setFormError(error.message)
    } finally {
      event.target.value = ''
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')

    const didSave = await updateUserProfile(form)
    setSaving(false)
    setSaved(didSave)
    if (didSave) {
      window.setTimeout(() => setSaved(false), 2200)
    }
  }

  const goToCommunity = () => {
    if (onNavigate) {
      onNavigate('/community')
    } else {
      window.location.href = '/community'
    }
  }

  const viewUser = (userId) => {
    onNavigate?.(`/profile/${userId}`)
  }

  if (!isSignedIn) {
    return (
      <section className="profile-page section-padding">
        <div className="container">
          <div className="profile-page-heading">
            <span>{t.social.tabs.profile}</span>
            <h1>{s.signInToEdit}</h1>
            <p>{s.signInToEditDesc}</p>
          </div>
          <button className="profile-primary-action" type="button" onClick={onOpenAuth}>
            <User size={17} />
            {t.social.signIn}
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="profile-page section-padding">
      <div className="container profile-page-layout">
        <div className="profile-page-topbar">
          <div className="profile-page-heading">
            <span>{t.social.tabs.profile}</span>
            <h1>{currentProfile.username}</h1>
            <p>{s.joinedOn} {formatDate(currentProfile.joinedAt, lang, dateTimeFormat)} · {s.level} {currentProfile.reputation.level} {currentProfile.reputation.name}</p>
          </div>

          <button
            className="profile-settings-button"
            type="button"
            onClick={onOpenSettings}
            aria-label={t.nav.settings || 'Settings'}
          >
            <Settings size={18} aria-hidden="true" />
            <span>{t.nav.settings || 'Settings'}</span>
          </button>
        </div>

        <div className="profile-page-grid">
          <form className="profile-editor" onSubmit={handleSubmit}>
            <div className="profile-photo-panel">
              <ProfileAvatar user={{ ...currentProfile, photoDataUrl: form.photoDataUrl, username: form.username }} size="xl" />
              <div>
                <span>{s.profilePhoto}</span>
                <label className="profile-upload-button">
                  <Upload size={16} />
                  {s.uploadNew}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} />
                </label>
                {form.photoDataUrl && (
                  <button
                    className="profile-ghost-button"
                    type="button"
                    onClick={() => updateField('photoDataUrl', '')}
                  >
                    {s.removePhoto}
                  </button>
                )}
              </div>
            </div>

            <label>
              <span>{s.nameLabel}</span>
              <input
                value={form.username}
                onChange={(event) => updateField('username', event.target.value)}
                placeholder="ViceCityFan"
              />
            </label>

            <label>
              <span>{s.bioLabel}</span>
              <textarea
                value={form.bio}
                onChange={(event) => updateField('bio', event.target.value)}
                placeholder={s.bioPlaceholder}
                rows={5}
                maxLength={220}
              />
            </label>

            <div className="profile-editor-footer">
              <small>{form.bio.length}/220</small>
              <button className="profile-primary-action" type="submit" disabled={saving}>
                <Save size={16} />
                {saving ? s.saving : s.saveProfile}
              </button>
            </div>

            {(formError || backendError || saved) && (
              <p className={saved ? 'profile-form-note success' : 'profile-form-note'}>
                {saved ? s.profileUpdated : formError || backendError}
              </p>
            )}
          </form>

          <aside className="profile-status-panel">
            <div className="profile-metrics-card">
              <span><strong>{currentProfile.submittedSources}</strong>{s.sources}</span>
              <span><strong>{currentProfile.acceptedSources}</strong>{s.accepted}</span>
              <span><strong>{bookmarkedPosts.length}</strong>{s.bookmarks}</span>
            </div>

            <button type="button" className="profile-messages-card" onClick={() => onNavigate?.('/messages')}>
              <MessageSquare size={18} />
              <span>
                <strong>{t.social.tabs.messages}</strong>
                <small>{messageDialogCount} dialog{messageDialogCount === 1 ? '' : 's'}</small>
              </span>
            </button>

            <div className="profile-badges-card">
              <div className="profile-panel-heading">
                <BadgeCheck size={16} />
                <h2>{s.badges}</h2>
              </div>
              <div className="profile-badge-list">
                {currentProfile.badges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className="profile-content-grid">
          <div className="profile-main-stack">
            {myPosts.length > 0 && (
              <section className="profile-bookmarks-panel">
                <div className="profile-panel-heading">
                  <MessageSquare size={16} />
                  <h2>{s.tabs.posts}</h2>
                </div>

                <div className="profile-community-post-list">
                  {myPosts.map((post) => (
                    <CommunityPostCard
                      key={post.id}
                      post={post}
                      author={currentProfile}
                      currentUser={currentUser}
                      currentProfile={currentProfile}
                      isSignedIn={isSignedIn}
                      onOpenAuth={onOpenAuth}
                      onViewUser={viewUser}
                      onToggleBookmark={toggleBookmark}
                      onDeletePost={deletePost}
                      onReactToPost={reactToPost}
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="profile-bookmarks-panel profile-purchases-panel">
              <div className="profile-panel-heading">
                <ShoppingBag size={16} />
                <h2>{s.myPurchases || 'My Purchases'}</h2>
                <button type="button" onClick={() => onNavigate?.('/shop')}>{s.browseShop || 'Browse shop'}</button>
              </div>

              {purchasedItems.length === 0 ? (
                <div className="profile-empty-state">
                  <ShoppingBag size={20} />
                  <p>{s.noPurchases || 'No purchases yet.'}</p>
                </div>
              ) : (
                <div className="profile-purchase-list">
                  {purchasedItems.map(({ product, purchase, purchaseItem }) => {
                    const displayProduct = product ? localizeShopProduct(product, shopCopy) : null
                    const title = displayProduct?.title || purchaseItem.productId
                    const category = displayProduct?.categoryLabel || purchaseItem.categoryId

                    return (
                      <article key={`${purchase.txId}-${purchaseItem.productId}`} className="profile-purchase-card">
                        {product?.image && <img src={product.image} alt="" aria-hidden="true" loading="lazy" decoding="async" />}
                        <div className="profile-purchase-copy">
                          <strong>{title}</strong>
                          <span>{category} · {formatDate(purchase.purchasedAt || new Date(), lang, dateTimeFormat)}</span>
                          <code>{shortenTxId(purchase.txId)}</code>
                        </div>
                        {product?.downloadUrl ? (
                          <a href={product.downloadUrl} target="_blank" rel="noreferrer" className="profile-download-action">
                            <Download size={15} />
                            {s.download8k || 'Download 8K'}
                          </a>
                        ) : (
                          <span className="profile-download-action disabled">{s.noDownload || 'No download'}</span>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="profile-bookmarks-panel">
              <div className="profile-panel-heading">
                <Bookmark size={16} />
                <h2>{s.bookmarks}</h2>
                <button type="button" onClick={goToCommunity}>{s.browsePosts}</button>
              </div>

              {bookmarkedPosts.length === 0 ? (
                <div className="profile-empty-state">
                  <Camera size={20} />
                  <p>{s.noBookmarks}</p>
                </div>
              ) : (
                <div className="profile-bookmark-list">
                  {bookmarkedPosts.map((post) => {
                    const author = usersById[post.authorId] ?? userFallback(post.authorId)
                    return (
                      <article key={post.id} className="profile-bookmark-card">
                        <div className="profile-bookmark-top">
                          <ProfileAvatar user={author} size="sm" />
                          <div className="profile-bookmark-meta">
                            <strong>{author.username}</strong>
                            <span>{formatRelative(post.createdAt, s, lang, dateTimeFormat)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleBookmark(post.id)}
                            aria-label={s.removeBookmark}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p>{post.body}</p>
                        <PostMediaAttachments post={post} />
                        <PostAttachment post={post} />
                        <div className="profile-bookmark-tags">
                          {post.tags.map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="profile-side-stack">
            <section className="profile-source-log">
              <div className="profile-panel-heading">
                <FileText size={16} />
                <h2>{s.yourSourceLog}</h2>
              </div>
              {mySources.length === 0 ? (
                <p className="profile-muted">{s.noSources}</p>
              ) : (
                mySources.map((source) => (
                  <div key={source.id} className="profile-mini-source">
                    <strong>{source.category}</strong>
                    <span>{source.status} · {formatRelative(source.createdAt, s, lang, dateTimeFormat)}</span>
                    <p>{source.claim}</p>
                  </div>
                ))
              )}
            </section>

            <section className="profile-leaderboard">
              <div className="profile-panel-heading">
                <BadgeCheck size={16} />
                <h2>{s.spotterBoard}</h2>
              </div>
              {leaderboard.map((user, index) => (
                <div key={user.id} className="profile-leader-row">
                  <span>{index + 1}</span>
                  <ProfileAvatar user={user} size="sm" />
                  <strong>{user.username}</strong>
                  <em>{s.lvl} {user.reputation.level}</em>
                </div>
              ))}
            </section>
          </aside>
        </div>
      </div>
    </section>
  )
}

export default ProfilePage
