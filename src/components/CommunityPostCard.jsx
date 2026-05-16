import { useEffect, useRef, useState } from 'react'
import {
  Bookmark,
  BookmarkCheck,
  Eye,
  HelpCircle,
  MoreVertical,
  Share2,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { REACTION_OPTIONS } from '../social/socialData'
import PostAttachment from './PostAttachment.jsx'
import './SocialHub.css'

const REACTION_ICONS = {
  useful: ThumbsUp,
  interesting: Eye,
  doubtful: HelpCircle,
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
      onKeyDown={onClick ? (event) => event.key === 'Enter' && onClick() : undefined}
    >
      {user?.photoDataUrl ? <img src={user.photoDataUrl} alt="" /> : initials}
    </div>
  )
}

function PostMenu({ postId, onDelete }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleShare = async () => {
    const url = `${window.location.origin}/community`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Community Post', url })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      // share cancelled or failed
    }
    setOpen(false)
  }

  const handleDelete = async () => {
    setOpen(false)
    await onDelete(postId)
  }

  return (
    <div ref={menuRef} className="post-menu">
      <button
        className="post-menu-button"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Post options"
      >
        <MoreVertical size={17} />
      </button>
      {open && (
        <div className="post-menu-dropdown" role="menu">
          <button type="button" role="menuitem" onClick={handleShare}>
            <Share2 size={14} />
            Share
          </button>
          <button type="button" role="menuitem" onClick={handleDelete}>
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

function CommunityPostCard({
  post,
  author,
  currentUser,
  currentProfile,
  isSignedIn,
  onOpenAuth,
  onViewUser,
  onToggleBookmark,
  onDeletePost,
  onReactToPost,
}) {
  const currentReaction = REACTION_OPTIONS.find((option) =>
    post.reactions?.[option.id]?.includes(currentUser?.id),
  )
  const bookmarked = currentProfile?.bookmarkedPostIds?.includes(post.id)
  const canBookmark = post.authorId !== currentUser?.id && onToggleBookmark
  const canDelete = post.authorId === currentUser?.id && onDeletePost

  return (
    <article className="community-post">
      <header className="post-header">
        <div className="post-author">
          <Avatar user={author} onClick={onViewUser ? () => onViewUser(post.authorId) : undefined} />
          <div>
            <h3>{author.username}</h3>
            <span>{formatRelative(post.createdAt)}</span>
          </div>
        </div>
        <div className="post-header-actions">
          {canBookmark && (
            <button
              className={bookmarked ? 'post-bookmark-button active' : 'post-bookmark-button'}
              type="button"
              onClick={() => (isSignedIn ? onToggleBookmark(post.id) : onOpenAuth?.())}
              aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
              aria-pressed={Boolean(bookmarked)}
              title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
            >
              {bookmarked ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
            </button>
          )}
          {canDelete && <PostMenu postId={post.id} onDelete={onDeletePost} />}
        </div>
      </header>

      <p className="post-body">{post.body}</p>
      <PostAttachment post={post} />

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
              onClick={() => (isSignedIn ? onReactToPost?.(post.id, reaction.id) : onOpenAuth?.())}
              aria-pressed={active}
            >
              <Icon size={15} />
              <span>{reaction.icon} {reaction.label}</span>
              <strong>{post.reactions?.[reaction.id]?.length ?? 0}</strong>
            </button>
          )
        })}
      </div>
    </article>
  )
}

export default CommunityPostCard
