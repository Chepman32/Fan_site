import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Bell,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Hash,
  HelpCircle,
  Link,
  LogIn,
  Mail,
  MessageSquare,
  Plus,
  Radio,
  Send,
  ShieldCheck,
  ThumbsUp,
  Trophy,
  User,
  Users,
  Vote,
  XCircle,
} from 'lucide-react'
import { useSocial } from '../social/SocialContext'
import {
  REACTION_OPTIONS,
  RUMOR_VOTE_OPTIONS,
  SOCIAL_TOPICS,
  SOURCE_CATEGORIES,
  TRAILER_ANALYSIS_THREADS,
} from '../social/socialData'
import './SocialHub.css'

const TABS = [
  { id: 'feed', label: 'Posts', icon: MessageSquare },
  { id: 'rumors', label: 'Rumors', icon: Radio },
  { id: 'sources', label: 'Sources', icon: Link },
  { id: 'polls', label: 'Polls', icon: Vote },
  { id: 'messages', label: 'Messages', icon: Mail },
  { id: 'profile', label: 'Profile', icon: User },
]

const REACTION_ICONS = {
  useful: ThumbsUp,
  interesting: Eye,
  doubtful: HelpCircle,
}

const SOURCE_STATUS = {
  accepted: { label: 'Accepted', icon: CheckCircle2 },
  review: { label: 'In review', icon: Clock },
  rejected: { label: 'Rejected', icon: XCircle },
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
    followedTopics: [],
    joinedAt: new Date().toISOString(),
  }
}

function Avatar({ user, size = 'md' }) {
  const initials = (user?.username ?? '?').slice(0, 2).toUpperCase()

  return (
    <div
      className={`social-avatar ${size}`}
      style={{ backgroundColor: `${user?.avatarColor ?? '#6b6b7b'}22`, color: user?.avatarColor }}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

function AuthPrompt({ onOpenAuth, compact = false }) {
  return (
    <div className={compact ? 'social-auth-prompt compact' : 'social-auth-prompt'}>
      <LogIn size={compact ? 16 : 20} />
      <span>Sign in to use community features.</span>
      <button type="button" onClick={onOpenAuth}>Sign in</button>
    </div>
  )
}

function Sidebar({ onOpenAuth }) {
  const { currentProfile, isSignedIn, followTopic, state } = useSocial()
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
              <span className="profile-eyebrow">Signed in as</span>
              <h3>{currentProfile.username}</h3>
              <p>{currentProfile.reputation.name}</p>
            </div>
          </div>

          <div className="reputation-meter" aria-label={`Level ${currentProfile.reputation.level}`}>
            <span style={{ width: `${Math.min(currentProfile.reputation.level * 25, 100)}%` }} />
          </div>

          <div className="profile-stats">
            <span>
              <strong>{currentProfile.submittedSources}</strong>
              Sources
            </span>
            <span>
              <strong>{currentProfile.acceptedSources}</strong>
              Accepted
            </span>
            <span>
              <strong>{currentProfile.followedTopicsCount}</strong>
              Topics
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
              <span className="profile-eyebrow">Guest mode</span>
              <h3>Read-only access</h3>
              <p>Posts, sources, and results stay visible.</p>
            </div>
          </div>
          <button className="sidebar-auth-button" type="button" onClick={onOpenAuth}>
            Unlock social tools
          </button>
        </div>
      )}

      <div className="topics-panel">
        <div className="panel-heading">
          <Hash size={16} />
          <h3>Tracked topics</h3>
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
                <small>{following ? 'Following' : `${count} watching`}</small>
              </button>
            )
          })}
        </div>
      </div>

      <div className="badges-panel">
        <div className="panel-heading">
          <Trophy size={16} />
          <h3>Badges</h3>
        </div>
        <div className="badge-list">
          {['Early Follower', 'Trailer Watcher', 'Source Hunter', 'Fact Checker', 'Vice City Local'].map((badge) => (
            <span
              key={badge}
              className={currentProfile?.badges.includes(badge) ? 'badge earned' : 'badge'}
            >
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
  const [body, setBody] = useState('')
  const [selectedTags, setSelectedTags] = useState(['Trailers'])

  const toggleTag = (topic) => {
    setSelectedTags((tags) => {
      if (tags.includes(topic)) return tags.filter((tag) => tag !== topic)
      return [...tags, topic].slice(0, 3)
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isSignedIn) {
      onOpenAuth()
      return
    }

    const didCreate = await createPost({ body, tags: selectedTags })
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
        placeholder={isSignedIn ? 'Share a GTA VI find, theory, or update...' : 'Sign in to create community posts.'}
        rows={4}
      />
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
          Post
        </button>
      </div>
    </form>
  )
}

function FeedTab({ onOpenAuth }) {
  const { state, usersById, currentUser, isSignedIn, reactToPost } = useSocial()

  return (
    <div className="social-stack">
      <PostComposer onOpenAuth={onOpenAuth} />

      {!isSignedIn && <AuthPrompt onOpenAuth={onOpenAuth} compact />}

      {state.posts.map((post) => {
        const author = usersById[post.authorId] ?? userFallback(post.authorId)
        const currentReaction = REACTION_OPTIONS.find((option) =>
          post.reactions[option.id]?.includes(currentUser?.id),
        )

        return (
          <article key={post.id} className="community-post">
            <header className="post-header">
              <Avatar user={author} />
              <div>
                <h3>{author.username}</h3>
                <span>{formatRelative(post.createdAt)}</span>
              </div>
            </header>

            <p className="post-body">{post.body}</p>

            <div className="post-tags">
              {post.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>

            <div className="reaction-row">
              {REACTION_OPTIONS.map((reaction) => {
                const Icon = REACTION_ICONS[reaction.id]
                const active = currentReaction?.id === reaction.id
                return (
                  <button
                    key={reaction.id}
                    className={active ? 'reaction-button active' : 'reaction-button'}
                    type="button"
                    onClick={() => (isSignedIn ? reactToPost(post.id, reaction.id) : onOpenAuth())}
                    aria-pressed={active}
                  >
                    <Icon size={15} />
                    <span>{reaction.icon} {reaction.label}</span>
                    <strong>{post.reactions[reaction.id]?.length ?? 0}</strong>
                  </button>
                )
              })}
            </div>
          </article>
        )
      })}
    </div>
  )
}

function CommentsPanel({ targetType, targetId, onOpenAuth }) {
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
                <Avatar user={author} size="sm" />
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

function RumorsTab({ onOpenAuth }) {
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

            <CommentsPanel targetType="rumor" targetId={rumor.id} onOpenAuth={onOpenAuth} />
          </article>
        )
      })}
    </div>
  )
}

function SourceForm({ onOpenAuth }) {
  const { isSignedIn, submitSource } = useSocial()
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
        Submit source
      </button>
    </form>
  )
}

function SourcesTab({ onOpenAuth }) {
  const { state, usersById } = useSocial()

  return (
    <div className="social-stack">
      <SourceForm onOpenAuth={onOpenAuth} />

      <div className="source-list">
        {state.sources.map((source) => {
          const author = usersById[source.authorId] ?? userFallback(source.authorId)
          const status = SOURCE_STATUS[source.status] ?? SOURCE_STATUS.review
          const StatusIcon = status.icon

          return (
            <article key={source.id} className="source-card">
              <div className="source-card-top">
                <div>
                  <span className={`source-status ${source.status}`}>
                    <StatusIcon size={14} />
                    {status.label}
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
                <Avatar user={author} size="sm" />
                <span>Submitted by {author.username}</span>
              </div>

              <CommentsPanel targetType="source" targetId={source.id} onOpenAuth={onOpenAuth} />
            </article>
          )
        })}
      </div>
    </div>
  )
}

function PollsTab({ onOpenAuth }) {
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
            <CommentsPanel targetType="poll" targetId={poll.id} onOpenAuth={onOpenAuth} />
          </article>
        )
      })}
    </div>
  )
}

function TrailerAnalysisTab({ onOpenAuth }) {
  return (
    <div className="social-stack">
      {TRAILER_ANALYSIS_THREADS.map((thread) => (
        <article key={thread.id} className="trailer-thread">
          <div className="rumor-topline">
            <span>{thread.topic}</span>
            <small>Analysis thread</small>
          </div>
          <h3>{thread.title}</h3>
          <p>{thread.summary}</p>
          <CommentsPanel targetType="trailer" targetId={thread.id} onOpenAuth={onOpenAuth} />
        </article>
      ))}
    </div>
  )
}

function MessagesTab({ onOpenAuth }) {
  const { state, publicUsers, currentUser, isSignedIn, usersById, sendMessage } = useSocial()
  const recipients = publicUsers.filter((user) => user.id !== currentUser?.id)
  const [selectedUserId, setSelectedUserId] = useState(recipients[0]?.id ?? '')
  const [body, setBody] = useState('')

  const activeRecipientId = selectedUserId || recipients[0]?.id
  const activeRecipient = usersById[activeRecipientId]
  const thread = state.messages.filter((message) => {
    return (
      (message.fromId === currentUser?.id && message.toId === activeRecipientId) ||
      (message.fromId === activeRecipientId && message.toId === currentUser?.id)
    )
  })

  const submitMessage = async (event) => {
    event.preventDefault()
    if (!isSignedIn) {
      onOpenAuth()
      return
    }

    const didSend = await sendMessage({ toId: activeRecipientId, body })
    if (didSend) setBody('')
  }

  if (!isSignedIn) {
    return <AuthPrompt onOpenAuth={onOpenAuth} />
  }

  return (
    <div className="messages-layout">
      <div className="recipient-list">
        {recipients.map((user) => (
          <button
            key={user.id}
            className={activeRecipientId === user.id ? 'recipient active' : 'recipient'}
            type="button"
            onClick={() => setSelectedUserId(user.id)}
          >
            <Avatar user={user} size="sm" />
            <span>{user.username}</span>
          </button>
        ))}
      </div>

      <div className="message-thread">
        <header>
          <Mail size={16} />
          <span>{activeRecipient?.username ?? 'Select a member'}</span>
        </header>

        <div className="message-list">
          {thread.length === 0 && <p className="empty-state">No messages in this thread yet.</p>}
          {thread.map((message) => {
            const mine = message.fromId === currentUser.id
            const author = usersById[message.fromId] ?? userFallback(message.fromId)
            return (
              <div key={message.id} className={mine ? 'message-bubble mine' : 'message-bubble'}>
                <span>{author.username} · {formatRelative(message.createdAt)}</span>
                <p>{message.body}</p>
              </div>
            )
          })}
        </div>

        <form className="message-form" onSubmit={submitMessage}>
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a message..."
          />
          <button type="submit" aria-label="Send message">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}

function ProfileTab({ onOpenAuth }) {
  const { currentProfile, publicUsers, state, isSignedIn } = useSocial()
  const leaderboard = [...publicUsers].sort((a, b) => b.reputation.score - a.reputation.score)

  if (!isSignedIn) {
    return <AuthPrompt onOpenAuth={onOpenAuth} />
  }

  const mySources = state.sources.filter((source) => source.authorId === currentProfile.id)

  return (
    <div className="profile-grid">
      <article className="profile-detail">
        <div className="profile-hero">
          <Avatar user={currentProfile} size="xl" />
          <div>
            <span>Level {currentProfile.reputation.level}: {currentProfile.reputation.name}</span>
            <h3>{currentProfile.username}</h3>
            <p>Joined {formatDate(currentProfile.joinedAt)}</p>
          </div>
        </div>

        <div className="profile-metrics">
          <span><strong>{currentProfile.submittedSources}</strong>Submitted sources</span>
          <span><strong>{currentProfile.acceptedSources}</strong>Accepted sources</span>
          <span><strong>{currentProfile.followedTopicsCount}</strong>Followed topics</span>
        </div>

        <div className="profile-badge-wrap">
          {currentProfile.badges.map((badge) => (
            <span key={badge} className="badge earned">
              <BadgeCheck size={13} />
              {badge}
            </span>
          ))}
        </div>
      </article>

      <article className="profile-detail">
        <div className="panel-heading">
          <FileText size={16} />
          <h3>Your source log</h3>
        </div>
        {mySources.length === 0 ? (
          <p className="empty-state">No source submissions yet.</p>
        ) : (
          <div className="mini-source-list">
            {mySources.map((source) => (
              <div key={source.id}>
                <strong>{source.category}</strong>
                <span>{source.status} · {formatRelative(source.createdAt)}</span>
                <p>{source.claim}</p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="profile-detail leaderboard">
        <div className="panel-heading">
          <Trophy size={16} />
          <h3>Spotter board</h3>
        </div>
        {leaderboard.map((user, index) => (
          <div key={user.id} className="leader-row">
            <span>{index + 1}</span>
            <Avatar user={user} size="sm" />
            <strong>{user.username}</strong>
            <em>Lvl {user.reputation.level}</em>
          </div>
        ))}
      </article>
    </div>
  )
}

function SocialHub({ onOpenAuth }) {
  const [activeTab, setActiveTab] = useState('feed')
  const [showTrailerThreads, setShowTrailerThreads] = useState(false)
  const { backendError, isSignedIn } = useSocial()

  const activeTitle = useMemo(() => TABS.find((tab) => tab.id === activeTab)?.label ?? 'Posts', [activeTab])

  return (
    <section id="social" className="section-padding social-hub">
      <div className="container">
        <div className="section-header social-header">
          <div className="section-badge">
            <Bell size={14} />
            <span>SOCIAL TRACKER</span>
          </div>
          <h2 className="section-title">
            FAN SIGNAL <span className="gradient-text">CENTER</span>
          </h2>
          <p>
            Follow topics, compare rumors, share sources, and keep community discussion attached to the pages where it matters.
          </p>
        </div>

        <div className="social-shell">
          <Sidebar onOpenAuth={onOpenAuth} />

          <div className="social-main">
            <div className="social-main-top">
              <div>
                <span>{isSignedIn ? 'Interactive mode' : 'Guest mode'}</span>
                <h3>{activeTitle}</h3>
              </div>
              <button
                className={showTrailerThreads ? 'analysis-toggle active' : 'analysis-toggle'}
                type="button"
                onClick={() => setShowTrailerThreads((visible) => !visible)}
              >
                <FileText size={15} />
                Trailer analysis
              </button>
            </div>

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

            {showTrailerThreads && <TrailerAnalysisTab onOpenAuth={onOpenAuth} />}

            {!showTrailerThreads && activeTab === 'feed' && <FeedTab onOpenAuth={onOpenAuth} />}
            {!showTrailerThreads && activeTab === 'rumors' && <RumorsTab onOpenAuth={onOpenAuth} />}
            {!showTrailerThreads && activeTab === 'sources' && <SourcesTab onOpenAuth={onOpenAuth} />}
            {!showTrailerThreads && activeTab === 'polls' && <PollsTab onOpenAuth={onOpenAuth} />}
            {!showTrailerThreads && activeTab === 'messages' && <MessagesTab onOpenAuth={onOpenAuth} />}
            {!showTrailerThreads && activeTab === 'profile' && <ProfileTab onOpenAuth={onOpenAuth} />}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SocialHub
