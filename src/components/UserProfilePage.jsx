import { useMemo } from 'react'
import { BadgeCheck, FileText, MessageSquare } from 'lucide-react'
import { getUserProfile, useSocial } from '../social/SocialContext'
import { useTranslation } from '../i18n/useTranslation.jsx'
import CommunityPostCard from './CommunityPostCard.jsx'
import { usePreferences } from '../preferences/AppPreferences.jsx'
import './ProfilePage.css'

function formatDate(date, lang = 'en', dateTimeFormat = 'locale') {
  const locale = dateTimeFormat === 'mdy' ? 'en-US' : dateTimeFormat === 'dmy' ? 'en-GB' : lang
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
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

function UserProfilePage({ userId, onNavigate, onOpenAuth }) {
  const {
    activityByUserId,
    currentProfile: socialCurrentProfile,
    currentUser,
    deletePost,
    isSignedIn,
    publicUsers,
    reactToPost,
    state,
    toggleBookmark,
  } = useSocial()
  const { t, lang } = useTranslation()
  const { dateTimeFormat } = usePreferences()
  const s = t.social

  const rawUser = state.users.find((u) => u.id === userId)
  const profile = useMemo(() => getUserProfile(rawUser, state), [rawUser, state])
  const activity = activityByUserId[userId]

  const userPosts = useMemo(
    () => state.posts.filter((p) => p.authorId === userId),
    [state.posts, userId],
  )

  const userSources = useMemo(
    () => state.sources.filter((src) => src.authorId === userId),
    [state.sources, userId],
  )

  const leaderboard = useMemo(
    () => [...publicUsers].sort((a, b) => b.reputation.score - a.reputation.score).slice(0, 5),
    [publicUsers],
  )

  if (!profile) {
    return (
      <section className="profile-page section-padding">
        <div className="container">
          <div className="profile-page-heading">
            <span>{s.community ?? 'Community'}</span>
            <h1>User not found</h1>
          </div>
          <button className="profile-primary-action" type="button" onClick={() => onNavigate('/community')}>
            ← Back
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="profile-page section-padding">
      <div className="container profile-page-layout">
        <div className="profile-page-heading">
          <span>{s.community ?? 'Community'}</span>
          <h1>{profile.username}</h1>
          <p>
            {s.joinedOn} {formatDate(profile.joinedAt, lang, dateTimeFormat)} · {s.level} {profile.reputation.level} {profile.reputation.name}
            {activity?.active ? ' · Online now' : ''}
            {profile.bio && ` · ${profile.bio}`}
          </p>
        </div>

        <div className="profile-page-grid">
          {/* Posts panel (replaces the edit form) */}
          <section className="profile-bookmarks-panel">
            <div className="profile-panel-heading">
              <MessageSquare size={16} />
              <h2>{s.tabs.posts}</h2>
            </div>
            {userPosts.length === 0 ? (
              <div className="profile-empty-state">
                <MessageSquare size={20} />
                <p>{s.noPosts ?? 'No posts yet.'}</p>
              </div>
            ) : (
              <div className="profile-community-post-list">
                {userPosts.map((post) => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    author={profile}
                    currentUser={currentUser}
                    currentProfile={socialCurrentProfile}
                    isSignedIn={isSignedIn}
                    onOpenAuth={onOpenAuth}
                    onViewUser={(nextUserId) => onNavigate(`/profile/${nextUserId}`)}
                    onToggleBookmark={toggleBookmark}
                    onDeletePost={deletePost}
                    onReactToPost={reactToPost}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="profile-status-panel">
            <div className="profile-metrics-card">
              <span><strong>{profile.submittedSources}</strong>{s.sources}</span>
              <span><strong>{profile.acceptedSources}</strong>{s.accepted}</span>
              <span><strong>{userPosts.length}</strong> posts</span>
            </div>

            <div className="profile-badges-card">
              <div className="profile-panel-heading">
                <BadgeCheck size={16} />
                <h2>{s.badges}</h2>
              </div>
              <div className="profile-badge-list">
                {profile.badges.length > 0
                  ? profile.badges.map((badge) => <span key={badge}>{badge}</span>)
                  : <span style={{ opacity: 0.5 }}>No badges yet.</span>}
              </div>
            </div>
          </aside>
        </div>

        <div className="profile-content-grid">
          <section className="profile-source-log">
            <div className="profile-panel-heading">
              <FileText size={16} />
              <h2>{s.yourSourceLog}</h2>
            </div>
            {userSources.length === 0 ? (
              <p className="profile-muted">{s.noSources}</p>
            ) : (
              userSources.map((source) => (
                <div key={source.id} className="profile-mini-source">
                  <strong>{source.category}</strong>
                  <span>{source.status} · {formatRelative(source.createdAt, s, lang, dateTimeFormat)}</span>
                  <p>{source.claim}</p>
                </div>
              ))
            )}
          </section>

          <aside className="profile-side-stack">
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

export default UserProfilePage
