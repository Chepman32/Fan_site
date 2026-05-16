import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  Hash,
  Link,
  LogIn,
  MessageSquare,
  Plus,
  Radio,
  Send,
  ShieldCheck,
  Trophy,
  Users,
  Vote,
  XCircle,
} from 'lucide-react'
import { useSocial } from '../social/SocialContext'
import { useTranslation } from '../i18n/useTranslation.jsx'
import CommunityPostCard from './CommunityPostCard.jsx'
import PostAttachment from './PostAttachment.jsx'
import {
  RUMOR_VOTE_OPTIONS,
  SOCIAL_TOPICS,
  SOURCE_CATEGORIES,
} from '../social/socialData'
import { getFirstPostUrl, removeFirstPostUrl } from '../social/postLinks'
import './SocialHub.css'

const TAB_IDS = ['feed', 'rumors', 'sources', 'polls']
const TAB_ICONS = { feed: MessageSquare, rumors: Radio, sources: Link, polls: Vote }

const SOURCE_STATUS_ICONS = {
  accepted: CheckCircle2,
  review: Clock,
  rejected: XCircle,
}

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

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'submitted source'
  }
}

function userFallback(userId) {
  return {
    id: userId,
    username: 'Unknown user',
    avatarColor: '#6b6b7b',
    photoDataUrl: '',
    followedTopics: [],
    joinedAt: new Date().toISOString(),
  }
}

function Avatar({ user, size = 'md', onClick }) {
  const initials = (user?.username ?? '?').slice(0, 2).toUpperCase()

  return (
    <div
      className={`social-avatar ${size}${onClick ? ' clickable' : ''}`}
      style={{ backgroundColor: `${user?.avatarColor ?? '#6b6b7b'}22`, color: user?.avatarColor }}
      aria-hidden={!onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {user?.photoDataUrl ? <img src={user.photoDataUrl} alt="" /> : initials}
    </div>
  )
}

function AuthPrompt({ onOpenAuth, compact = false }) {
  const { t } = useTranslation()
  return (
    <div className={compact ? 'social-auth-prompt compact' : 'social-auth-prompt'}>
      <LogIn size={compact ? 16 : 20} />
      <span>{t.social.signInPrompt}</span>
      <button type="button" onClick={onOpenAuth}>{t.social.signIn}</button>
    </div>
  )
}

function Sidebar({ onOpenAuth }) {
  const { currentProfile, isSignedIn, followTopic, state } = useSocial()
  const { t } = useTranslation()
  const topicCounts = SOCIAL_TOPICS.map((topic) => ({
    topic,
    count: state.users.filter((user) => user.followedTopics.includes(topic)).length,
  }))

  return (
    <aside className="social-sidebar">
      {isSignedIn ? (
        <div className="profile-summary">
          <div className="profile-summary-top">
            <Avatar user={currentProfile} size="lg" />
            <div>
              <span className="profile-eyebrow">{t.social.signedInAs}</span>
              <h3>{currentProfile.username}</h3>
              <p>{currentProfile.reputation.name}</p>
            </div>
          </div>

          <div className="reputation-meter" aria-label={`${t.social.level} ${currentProfile.reputation.level}`}>
            <span style={{ width: `${Math.min(currentProfile.reputation.level * 25, 100)}%` }} />
          </div>

          <div className="profile-stats">
            <span>
              <strong>{currentProfile.submittedSources}</strong>
              {t.social.sources}
            </span>
            <span>
              <strong>{currentProfile.acceptedSources}</strong>
              {t.social.accepted}
            </span>
            <span>
              <strong>{currentProfile.followedTopicsCount}</strong>
              {t.social.topics}
            </span>
          </div>
        </div>
      ) : (
        <div className="profile-summary guest">
          <div className="profile-summary-top">
            <div className="guest-mark">
              <Users size={24} />
            </div>
            <div>
              <span className="profile-eyebrow">{t.social.guestMode}</span>
              <h3>{t.social.readOnly}</h3>
              <p>{t.social.postsVisible}</p>
            </div>
          </div>
          <button className="sidebar-auth-button" type="button" onClick={onOpenAuth}>
            {t.social.unlockSocial}
          </button>
        </div>
      )}

      <div className="topics-panel">
        <div className="panel-heading">
          <Hash size={16} />
          <h3>{t.social.trackedTopics}</h3>
        </div>

        <div className="topic-list">
          {topicCounts.map(({ topic, count }) => {
            const following = currentProfile?.followedTopics.includes(topic)
            return (
              <button
                key={topic}
                className={following ? 'topic-chip following' : 'topic-chip'}
                type="button"
                onClick={() => (isSignedIn ? followTopic(topic) : onOpenAuth())}
              >
                <span>{topic}</span>
                <small>{following ? t.social.following : `${count} ${t.social.watching}`}</small>
              </button>
            )
          })}
        </div>
      </div>

      <div className="badges-panel">
        <div className="panel-heading">
          <Trophy size={16} />
          <h3>{t.social.badges}</h3>
        </div>
        <div className="badge-list">
          {['Early Follower', 'Trailer Watcher', 'Source Hunter', 'Fact Checker', 'Vice City Local'].map((badge) => (
            <span key={badge} className={currentProfile?.badges.includes(badge) ? 'badge earned' : 'badge'}>
              {badge}
            </span>
          ))}
        </div>
      </div>
    </aside>
  )
}

function PostComposer({ onOpenAuth }) {
  const { createPost, isSignedIn } = useSocial()
  const { t } = useTranslation()
  const [body, setBody] = useState('')
  const [selectedTags, setSelectedTags] = useState(['Trailers'])
  const bodyUrl = getFirstPostUrl(body)
  const previewPost = bodyUrl
    ? {
      body: '',
      linkUrl: bodyUrl,
      tags: selectedTags,
      reactions: {},
    }
    : null

  const toggleTag = (topic) => {
    setSelectedTags((tags) => {
      if (tags.includes(topic)) return tags.filter((tag) => tag !== topic)
      return [...tags, topic].slice(0, 3)
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isSignedIn) { onOpenAuth(); return }
    const cleanBody = bodyUrl ? removeFirstPostUrl(body) : body.trim()
    const didCreate = await createPost({ body: cleanBody, tags: selectedTags, linkUrl: bodyUrl })
    if (didCreate) {
      setBody('')
      setSelectedTags(['Trailers'])
    }
  }

  return (
    <form className="post-composer" onSubmit={handleSubmit}>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={isSignedIn ? t.social.postPlaceholder : t.social.postPlaceholderGuest}
        rows={4}
      />
      {previewPost && (
        <div className="composer-preview" aria-label="Post attachment preview">
          <PostAttachment post={previewPost} />
        </div>
      )}
      <div className="composer-bottom">
        <div className="composer-tags" aria-label="Post topics">
          {SOCIAL_TOPICS.slice(0, 6).map((topic) => (
            <button
              key={topic}
              className={selectedTags.includes(topic) ? 'mini-topic selected' : 'mini-topic'}
              type="button"
              onClick={() => toggleTag(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
        <button className="compose-button" type="submit">
          <Plus size={16} />
          {t.social.post}
        </button>
      </div>
    </form>
  )
}

function FeedTab({ onOpenAuth, onViewUser }) {
  const { state, usersById, currentUser, currentProfile, isSignedIn, reactToPost, toggleBookmark, deletePost } = useSocial()

  return (
    <div className="social-stack">
      <PostComposer onOpenAuth={onOpenAuth} />

      {!isSignedIn && <AuthPrompt onOpenAuth={onOpenAuth} compact />}

      <AnimatePresence initial={false}>
      {state.posts.map((post) => {
        const author = usersById[post.authorId] ?? userFallback(post.authorId)

        return (
          <motion.div
            key={post.id}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
            exit={{ opacity: 0, scale: 0.94, height: 0, marginBottom: 0, transition: { type: 'spring', stiffness: 400, damping: 35, opacity: { duration: 0.15 } } }}
          >
            <CommunityPostCard
              post={post}
              author={author}
              currentUser={currentUser}
              currentProfile={currentProfile}
              isSignedIn={isSignedIn}
              onOpenAuth={onOpenAuth}
              onViewUser={onViewUser}
              onToggleBookmark={toggleBookmark}
              onDeletePost={deletePost}
              onReactToPost={reactToPost}
            />
          </motion.div>
        )
      })}
      </AnimatePresence>
    </div>
  )
}

function CommentsPanel({ targetType, targetId, onOpenAuth, onViewUser }) {
  const { state, usersById, currentUser, isSignedIn, addComment } = useSocial()
  const [body, setBody] = useState('')
  const comments = state.comments.filter(
    (comment) => comment.targetType === targetType && comment.targetId === targetId,
  )

  const submitComment = async (event) => {
    event.preventDefault()
    if (!isSignedIn) {
      onOpenAuth()
      return
    }

    const didAdd = await addComment({ targetType, targetId, body })
    if (didAdd) setBody('')
  }

  return (
    <div className="comments-panel">
      <div className="comments-heading">
        <MessageSquare size={14} />
        <span>{comments.length} comments</span>
      </div>

      {comments.length > 0 && (
        <div className="comments-list">
          {comments.map((comment) => {
            const author = usersById[comment.authorId] ?? userFallback(comment.authorId)
            return (
              <div key={comment.id} className="comment-item">
                <Avatar user={author} size="sm" onClick={() => onViewUser?.(comment.authorId)} />
                <div>
                  <strong>{author.username}</strong>
                  <span>{formatRelative(comment.createdAt)}</span>
                  <p>{comment.body}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <form className="comment-form" onSubmit={submitComment}>
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={currentUser ? 'Add a focused note...' : 'Sign in to comment here.'}
        />
        <button type="submit" aria-label="Send comment">
          <Send size={15} />
        </button>
      </form>
    </div>
  )
}

function RumorsTab({ onOpenAuth, onViewUser }) {
  const { state, currentUser, isSignedIn, voteRumor, totalVotes } = useSocial()

  return (
    <div className="social-stack">
      {state.rumors.map((rumor) => {
        const total = Math.max(totalVotes(rumor.votes), 1)
        const currentVote = RUMOR_VOTE_OPTIONS.find((option) => rumor.votes[option.id]?.includes(currentUser?.id))

        return (
          <article key={rumor.id} className="rumor-card">
            <div className="rumor-topline">
              <span>{rumor.topic}</span>
              <small>{formatRelative(rumor.updatedAt)}</small>
            </div>

            <h3>{rumor.title}</h3>
            <p>{rumor.summary}</p>
            <div className="rumor-source">Source type: {rumor.sourceLabel}</div>

            <div className="vote-grid">
              {RUMOR_VOTE_OPTIONS.map((option) => {
                const count = rumor.votes[option.id]?.length ?? 0
                const percent = Math.round((count / total) * 100)
                const active = currentVote?.id === option.id
                return (
                  <button
                    key={option.id}
                    className={active ? 'vote-option active' : 'vote-option'}
                    type="button"
                    onClick={() => (isSignedIn ? voteRumor(rumor.id, option.id) : onOpenAuth())}
                  >
                    <span>{option.label}</span>
                    <strong>{count}</strong>
                    <em style={{ width: `${percent}%` }} />
                  </button>
                )
              })}
            </div>

            <CommentsPanel targetType="rumor" targetId={rumor.id} onOpenAuth={onOpenAuth} onViewUser={onViewUser} />
          </article>
        )
      })}
    </div>
  )
}

function SourceForm({ onOpenAuth }) {
  const { isSignedIn, submitSource } = useSocial()
  const { t } = useTranslation()
  const [form, setForm] = useState({
    url: '',
    claim: '',
    category: SOURCE_CATEGORIES[0],
    reason: '',
  })

  const updateForm = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isSignedIn) {
      onOpenAuth()
      return
    }

    const didSubmit = await submitSource(form)
    if (didSubmit) {
      setForm({
        url: '',
        claim: '',
        category: SOURCE_CATEGORIES[0],
        reason: '',
      })
    }
  }

  return (
    <form className="source-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          <span>Source URL</span>
          <input
            value={form.url}
            onChange={(event) => updateForm('url', event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label>
          <span>Category</span>
          <select value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
            {SOURCE_CATEGORIES.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span>What does it claim?</span>
        <textarea
          value={form.claim}
          onChange={(event) => updateForm('claim', event.target.value)}
          placeholder="Summarize the exact claim."
          rows={3}
        />
      </label>
      <label>
        <span>Why should it be reviewed?</span>
        <textarea
          value={form.reason}
          onChange={(event) => updateForm('reason', event.target.value)}
          placeholder="Explain why this source matters."
          rows={3}
        />
      </label>
      <button className="compose-button" type="submit">
        <ShieldCheck size={16} />
        {t.social.submitSource}
      </button>
    </form>
  )
}

function SourcesTab({ onOpenAuth, onViewUser }) {
  const { state, usersById } = useSocial()
  const { t } = useTranslation()

  return (
    <div className="social-stack">
      <SourceForm onOpenAuth={onOpenAuth} />

      <div className="source-list">
        {state.sources.map((source) => {
          const author = usersById[source.authorId] ?? userFallback(source.authorId)
          const StatusIcon = SOURCE_STATUS_ICONS[source.status] ?? SOURCE_STATUS_ICONS.review
          const statusLabel = t.social.sourceStatus[source.status] ?? t.social.sourceStatus.review

          return (
            <article key={source.id} className="source-card">
              <div className="source-card-top">
                <div>
                  <span className={`source-status ${source.status}`}>
                    <StatusIcon size={14} />
                    {statusLabel}
                  </span>
                  <h3>{source.claim}</h3>
                </div>
                <a href={source.url} target="_blank" rel="noopener noreferrer" aria-label="Open source">
                  <Link size={18} />
                </a>
              </div>

              <div className="source-meta">
                <span>{source.category}</span>
                <span>{getHostname(source.url)}</span>
                <span>{formatRelative(source.createdAt)}</span>
              </div>

              <p>{source.reason}</p>

              <div className="source-author">
                <Avatar user={author} size="sm" onClick={() => onViewUser(source.authorId)} />
                <span>Submitted by {author.username}</span>
              </div>

              <CommentsPanel targetType="source" targetId={source.id} onOpenAuth={onOpenAuth} onViewUser={onViewUser} />
            </article>
          )
        })}
      </div>
    </div>
  )
}

function PollsTab({ onOpenAuth, onViewUser }) {
  const { state, currentUser, isSignedIn, votePoll, totalVotes } = useSocial()

  return (
    <div className="social-stack">
      {state.polls.map((poll) => {
        const total = Math.max(totalVotes(poll.votes), 1)
        const currentVote = poll.options.find((option) => poll.votes[option.id]?.includes(currentUser?.id))

        return (
          <article key={poll.id} className="poll-card">
            <h3>{poll.question}</h3>
            <div className="poll-options">
              {poll.options.map((option) => {
                const count = poll.votes[option.id]?.length ?? 0
                const percent = Math.round((count / total) * 100)
                const active = currentVote?.id === option.id

                return (
                  <button
                    key={option.id}
                    className={active ? 'poll-option active' : 'poll-option'}
                    type="button"
                    onClick={() => (isSignedIn ? votePoll(poll.id, option.id) : onOpenAuth())}
                  >
                    <span>{option.label}</span>
                    <strong>{percent}%</strong>
                    <em style={{ width: `${percent}%` }} />
                  </button>
                )
              })}
            </div>
            <span className="poll-total">{totalVotes(poll.votes)} votes</span>
            <CommentsPanel targetType="poll" targetId={poll.id} onOpenAuth={onOpenAuth} onViewUser={onViewUser} />
          </article>
        )
      })}
    </div>
  )
}

function SocialHub({ onOpenAuth, onNavigate }) {
  const [activeTab, setActiveTab] = useState('feed')
  const { backendError } = useSocial()
  const { t } = useTranslation()

  const onViewUser = (userId) => onNavigate(`/profile/${userId}`)

  const TAB_LABELS = {
    feed: t.social.tabs.posts,
    rumors: t.social.tabs.rumors,
    sources: t.social.tabs.sources,
    polls: t.social.tabs.polls,
  }
  const TABS = TAB_IDS.map((id) => ({ id, label: TAB_LABELS[id], icon: TAB_ICONS[id] }))

  return (
    <section id="community" className="section-padding social-hub">
      <div className="container">
        <div className="section-header social-header">
          <h2 className="section-title">
            {t.social.title} <span className="gradient-text">{t.social.titleHighlight}</span>
          </h2>
        </div>

        <div className="social-shell">
          <Sidebar onOpenAuth={onOpenAuth} />

          <div className="social-main">
            <div className="social-tabs" role="tablist" aria-label="Social sections">
              {TABS.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={activeTab === tab.id ? 'active' : ''}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {backendError && (
              <div className="firebase-error">
                <ShieldCheck size={16} />
                <span>{backendError}</span>
              </div>
            )}

            {activeTab === 'feed' && <FeedTab onOpenAuth={onOpenAuth} onViewUser={onViewUser} />}
            {activeTab === 'rumors' && <RumorsTab onOpenAuth={onOpenAuth} onViewUser={onViewUser} />}
            {activeTab === 'sources' && <SourcesTab onOpenAuth={onOpenAuth} onViewUser={onViewUser} />}
            {activeTab === 'polls' && <PollsTab onOpenAuth={onOpenAuth} onViewUser={onViewUser} />}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SocialHub
