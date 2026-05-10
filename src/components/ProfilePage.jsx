import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Bookmark,
  Camera,
  FileText,
  Save,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { useSocial } from '../social/SocialContext'
import './ProfilePage.css'

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function formatRelative(date) {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.max(Math.floor(diff / 60000), 0)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
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

function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file.'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read this image.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Could not prepare this image.'))
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

function ProfilePage({ onOpenAuth, onNavigate }) {
  const {
    backendError,
    currentProfile,
    isSignedIn,
    publicUsers,
    state,
    toggleBookmark,
    updateUserProfile,
    usersById,
  } = useSocial()
  const [formDraft, setFormDraft] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const form = formDraft?.profileId === currentProfile?.id ? formDraft : profileToForm(currentProfile)

  const bookmarkedPosts = useMemo(() => {
    const bookmarkIds = currentProfile?.bookmarkedPostIds ?? []
    return bookmarkIds
      .map((postId) => state.posts.find((post) => post.id === postId))
      .filter(Boolean)
  }, [currentProfile?.bookmarkedPostIds, state.posts])

  const mySources = useMemo(() => {
    if (!currentProfile) return []
    return state.sources.filter((source) => source.authorId === currentProfile.id)
  }, [currentProfile, state.sources])

  const leaderboard = useMemo(() => {
    return [...publicUsers].sort((a, b) => b.reputation.score - a.reputation.score).slice(0, 5)
  }, [publicUsers])

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
      const photoDataUrl = await resizePhoto(file)
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

  if (!isSignedIn) {
    return (
      <section className="profile-page section-padding">
        <div className="container">
          <div className="profile-page-heading">
            <span>Profile</span>
            <h1>Sign in to edit your profile</h1>
            <p>Your profile, uploaded photo, and saved community posts are available after sign in.</p>
          </div>
          <button className="profile-primary-action" type="button" onClick={onOpenAuth}>
            <User size={17} />
            Sign in
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="profile-page section-padding">
      <div className="container profile-page-layout">
        <div className="profile-page-heading">
          <span>Profile</span>
          <h1>{currentProfile.username}</h1>
          <p>Joined {formatDate(currentProfile.joinedAt)} · Level {currentProfile.reputation.level} {currentProfile.reputation.name}</p>
        </div>

        <div className="profile-page-grid">
          <form className="profile-editor" onSubmit={handleSubmit}>
            <div className="profile-photo-panel">
              <ProfileAvatar user={{ ...currentProfile, photoDataUrl: form.photoDataUrl, username: form.username }} size="xl" />
              <div>
                <span>Profile photo</span>
                <label className="profile-upload-button">
                  <Upload size={16} />
                  Upload new
                  <input type="file" accept="image/*" onChange={handlePhotoChange} />
                </label>
                {form.photoDataUrl && (
                  <button
                    className="profile-ghost-button"
                    type="button"
                    onClick={() => updateField('photoDataUrl', '')}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            <label>
              <span>Name</span>
              <input
                value={form.username}
                onChange={(event) => updateField('username', event.target.value)}
                placeholder="ViceCityFan"
              />
            </label>

            <label>
              <span>Bio</span>
              <textarea
                value={form.bio}
                onChange={(event) => updateField('bio', event.target.value)}
                placeholder="Tell the community what you track: trailers, map clues, source checks..."
                rows={5}
                maxLength={220}
              />
            </label>

            <div className="profile-editor-footer">
              <small>{form.bio.length}/220</small>
              <button className="profile-primary-action" type="submit" disabled={saving}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </div>

            {(formError || backendError || saved) && (
              <p className={saved ? 'profile-form-note success' : 'profile-form-note'}>
                {saved ? 'Profile updated.' : formError || backendError}
              </p>
            )}
          </form>

          <aside className="profile-status-panel">
            <div className="profile-metrics-card">
              <span><strong>{currentProfile.submittedSources}</strong>Sources</span>
              <span><strong>{currentProfile.acceptedSources}</strong>Accepted</span>
              <span><strong>{bookmarkedPosts.length}</strong>Bookmarks</span>
            </div>

            <div className="profile-badges-card">
              <div className="profile-panel-heading">
                <BadgeCheck size={16} />
                <h2>Badges</h2>
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
          <section className="profile-bookmarks-panel">
            <div className="profile-panel-heading">
              <Bookmark size={16} />
              <h2>Bookmarks</h2>
              <button type="button" onClick={goToCommunity}>Browse posts</button>
            </div>

            {bookmarkedPosts.length === 0 ? (
              <div className="profile-empty-state">
                <Camera size={20} />
                <p>No bookmarked posts yet.</p>
              </div>
            ) : (
              <div className="profile-bookmark-list">
                {bookmarkedPosts.map((post) => {
                  const author = usersById[post.authorId] ?? userFallback(post.authorId)
                  return (
                    <article key={post.id} className="profile-bookmark-card">
                      <div className="profile-bookmark-top">
                        <ProfileAvatar user={author} size="sm" />
                        <div>
                          <strong>{author.username}</strong>
                          <span>{formatRelative(post.createdAt)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleBookmark(post.id)}
                          aria-label="Remove bookmark"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p>{post.body}</p>
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

          <aside className="profile-side-stack">
            <section className="profile-source-log">
              <div className="profile-panel-heading">
                <FileText size={16} />
                <h2>Your source log</h2>
              </div>
              {mySources.length === 0 ? (
                <p className="profile-muted">No source submissions yet.</p>
              ) : (
                mySources.map((source) => (
                  <div key={source.id} className="profile-mini-source">
                    <strong>{source.category}</strong>
                    <span>{source.status} · {formatRelative(source.createdAt)}</span>
                    <p>{source.claim}</p>
                  </div>
                ))
              )}
            </section>

            <section className="profile-leaderboard">
              <div className="profile-panel-heading">
                <BadgeCheck size={16} />
                <h2>Spotter board</h2>
              </div>
              {leaderboard.map((user, index) => (
                <div key={user.id} className="profile-leader-row">
                  <span>{index + 1}</span>
                  <ProfileAvatar user={user} size="sm" />
                  <strong>{user.username}</strong>
                  <em>Lvl {user.reputation.level}</em>
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
