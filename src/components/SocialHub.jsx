import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  ClipboardPaste,
  Clock,
  Hash,
  ImagePlus,
  Link,
  Loader2,
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
import { uploadTelegramFile } from '../storage/telegramStorage'
import { usePreferences } from '../preferences/AppPreferences.jsx'
import './SocialHub.css'

const TAB_IDS = ['feed', 'rumors', 'sources', 'polls']
const TAB_ICONS = { feed: MessageSquare, rumors: Radio, sources: Link, polls: Vote }
const MAX_POST_MEDIA = 4
const MAX_POST_MEDIA_BYTES = 20 * 1024 * 1024
const DEFAULT_COMPOSER_COPY = {
  optionLabel: (index) => `Option ${index}`,
  queryPrefix: 'Query:',
  optionsPrefix: 'Options:',
}
const createDefaultQueryOptions = (copy = DEFAULT_COMPOSER_COPY) => [
  { id: 'option-1', name: copy.optionLabel(1) },
  { id: 'option-2', name: copy.optionLabel(2) },
]

const SOURCE_STATUS_ICONS = {
  accepted: CheckCircle2,
  review: Clock,
  rejected: XCircle,
}

function formatDate(date, locale = 'en') {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function formatRelative(date, copy, locale = 'en') {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.max(Math.floor(diff / 60000), 0)
  if (minutes < 1) return copy.relativeNow
  if (minutes < 60) return `${minutes}${copy.relativeMin}`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}${copy.relativeHour}`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}${copy.relativeDay}`
  return formatDate(date, locale)
}

function getHostname(url, copy) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return copy.submittedSource
  }
}

function formatAttachedQuery(query, copy = DEFAULT_COMPOSER_COPY) {
  if (!query) return ''
  const options = query.options
    .map((option, index) => `${index + 1}. ${option}`)
    .join('\n')

  return [`${copy.queryPrefix} ${query.title}`, options ? `${copy.optionsPrefix}\n${options}` : '']
    .filter(Boolean)
    .join('\n')
}

function topicLabel(topic, copy) {
  return copy.topicLabels?.[topic] || topic
}

function sourceCategoryLabel(category, copy) {
  return copy.sourceCategories?.[category] || category
}

function sourceLabel(label, copy) {
  return copy.sourceLabels?.[label] || label
}

function mediaSelectionId(file) {
  const randomId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${file.name}-${file.lastModified}-${randomId}`
}

function userFallback(userId, copy) {
  return {
    id: userId,
    username: copy.unknownUser,
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

function GuestAccessNotice({ onOpenAuth, compact = false }) {
  const { t } = useTranslation()
  const title = t.social.guestBrowseTitle || 'Browse the community as a guest'
  const description = t.social.guestBrowseDescription || 'Posts, source checks, rumor votes, and poll results stay visible. Sign in when you want to post, react, vote, save, or comment.'

  return (
    <div className={compact ? 'guest-access-notice compact' : 'guest-access-notice'}>
      <div className="guest-access-icon">
        <Users size={compact ? 17 : 20} />
      </div>
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <button type="button" onClick={onOpenAuth}>
        <LogIn size={16} />
        {t.social.signIn}
      </button>
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
                <span>{topicLabel(topic, t.social)}</span>
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
  const composerCopy = t.social.composer
  const [body, setBody] = useState('')
  const [selectedTags, setSelectedTags] = useState(['Trailers'])
  const [attachMenuOpen, setAttachMenuOpen] = useState(false)
  const [attachmentModal, setAttachmentModal] = useState(null)
  const [linkDraft, setLinkDraft] = useState('')
  const [queryTitleDraft, setQueryTitleDraft] = useState('')
  const [queryOptionsDraft, setQueryOptionsDraft] = useState(() => createDefaultQueryOptions(composerCopy))
  const [attachedLink, setAttachedLink] = useState('')
  const [attachedQuery, setAttachedQuery] = useState(null)
  const [attachedMedia, setAttachedMedia] = useState([])
  const [composerError, setComposerError] = useState('')
  const [uploadProgress, setUploadProgress] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const attachMenuRef = useRef(null)
  const linkInputRef = useRef(null)
  const mediaInputRef = useRef(null)
  const attachedMediaRef = useRef([])
  const nextQueryOptionIdRef = useRef(3)
  const typedBodyUrl = getFirstPostUrl(body)
  const bodyUrl = attachedLink || typedBodyUrl
  const previewPost = bodyUrl
    ? {
      body: '',
      linkUrl: bodyUrl,
      tags: selectedTags,
      reactions: {},
    }
    : null

  useEffect(() => {
    if (!attachMenuOpen) return undefined
    const close = (event) => {
      if (!attachMenuRef.current?.contains(event.target)) setAttachMenuOpen(false)
    }
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [attachMenuOpen])

  useEffect(() => {
    attachedMediaRef.current = attachedMedia
  }, [attachedMedia])

  useEffect(() => () => {
    attachedMediaRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl))
  }, [])

  const toggleTag = (topic) => {
    setSelectedTags((tags) => {
      if (tags.includes(topic)) return tags.filter((tag) => tag !== topic)
      return [...tags, topic].slice(0, 3)
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isSignedIn) { onOpenAuth(); return }
    if (isPublishing) return

    const cleanTextBody = typedBodyUrl ? removeFirstPostUrl(body) : body.trim()
    const cleanQuery = formatAttachedQuery(attachedQuery, composerCopy)
    const cleanBody = cleanQuery
      ? [cleanTextBody, cleanQuery].filter(Boolean).join('\n\n')
      : cleanTextBody

    if (!cleanBody && !bodyUrl && attachedMedia.length === 0) return

    setComposerError('')
    setUploadProgress('')
    setIsPublishing(true)

    try {
      let preparedMedia = [...attachedMedia]
      const pendingMedia = preparedMedia.filter((item) => !item.storedFile)

      for (let index = 0; index < pendingMedia.length; index += 1) {
        const pendingItem = pendingMedia[index]
        setUploadProgress(composerCopy.uploading?.(index + 1, pendingMedia.length, pendingItem.file.name) || `Uploading ${index + 1} of ${pendingMedia.length}: ${pendingItem.file.name}`)
        const storedFile = await uploadTelegramFile(pendingItem.file, {
          kind: 'ugc-post-media',
          title: cleanBody.slice(0, 160) || t.social.communityPost,
        })
        preparedMedia = preparedMedia.map((item) => (
          item.id === pendingItem.id ? { ...item, storedFile } : item
        ))
        setAttachedMedia(preparedMedia)
      }

      setUploadProgress(composerCopy.publishingPost || composerCopy.publishing || 'Publishing post...')
      const didCreate = await createPost({
        body: cleanBody,
        tags: selectedTags,
        linkUrl: bodyUrl,
        attachments: preparedMedia.map((item) => item.storedFile).filter(Boolean),
      })

      if (didCreate) {
        preparedMedia.forEach((item) => URL.revokeObjectURL(item.previewUrl))
        setBody('')
        setAttachedLink('')
        setAttachedQuery(null)
        setAttachedMedia([])
        setSelectedTags(['Trailers'])
      }
    } catch (error) {
      setComposerError(error.message || composerCopy.uploadFailed || 'Could not upload the attached media.')
    } finally {
      setIsPublishing(false)
      setUploadProgress('')
    }
  }

  const openMediaPicker = () => {
    setAttachMenuOpen(false)
    setComposerError('')
    if (!isSignedIn) {
      onOpenAuth()
      return
    }
    mediaInputRef.current?.click()
  }

  const handleMediaSelection = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    event.target.value = ''
    if (!selectedFiles.length) return

    const invalidType = selectedFiles.find((file) => !/^(image|video)\//.test(file.type))
    if (invalidType) {
      setComposerError(composerCopy.invalidMedia?.(invalidType.name) || `${invalidType.name} is not an image or video.`)
      return
    }

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_POST_MEDIA_BYTES)
    if (oversizedFile) {
      setComposerError(composerCopy.mediaTooLarge?.(oversizedFile.name, 20) || `${oversizedFile.name} is larger than 20 MB.`)
      return
    }

    const existingKeys = new Set(attachedMedia.map((item) => (
      `${item.file.name}-${item.file.size}-${item.file.lastModified}`
    )))
    const availableSlots = MAX_POST_MEDIA - attachedMedia.length
    const uniqueFiles = selectedFiles.filter((file) => (
      !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`)
    ))
    const acceptedFiles = uniqueFiles.slice(0, Math.max(availableSlots, 0))

    if (acceptedFiles.length === 0) {
      setComposerError(composerCopy.attachUpTo?.(MAX_POST_MEDIA) || `Attach up to ${MAX_POST_MEDIA} unique images or videos.`)
      return
    }

    setAttachedMedia((items) => [
      ...items,
      ...acceptedFiles.map((file) => ({
        id: mediaSelectionId(file),
        file,
        previewUrl: URL.createObjectURL(file),
        storedFile: null,
      })),
    ])
    setComposerError(
      acceptedFiles.length < uniqueFiles.length
        ? composerCopy.firstFilesAttached?.(MAX_POST_MEDIA) || `Only the first ${MAX_POST_MEDIA} media files were attached.`
        : '',
    )
  }

  const removeAttachedMedia = (id) => {
    setAttachedMedia((items) => {
      const removedItem = items.find((item) => item.id === id)
      if (removedItem) URL.revokeObjectURL(removedItem.previewUrl)
      return items.filter((item) => item.id !== id)
    })
    setComposerError('')
  }

  const openAttachmentModal = (type) => {
    setAttachMenuOpen(false)
    setAttachmentModal(type)
    if (type === 'link') setLinkDraft(attachedLink || typedBodyUrl || '')
    if (type === 'query' && attachedQuery) {
      setQueryTitleDraft(attachedQuery.title)
      setQueryOptionsDraft(attachedQuery.options.map((name, index) => ({
        id: `option-${index + 1}`,
        name,
      })))
      nextQueryOptionIdRef.current = attachedQuery.options.length + 1
    }
    if (type === 'query' && !attachedQuery) {
      setQueryTitleDraft('')
      setQueryOptionsDraft(createDefaultQueryOptions(composerCopy))
      nextQueryOptionIdRef.current = 3
    }
  }

  const pasteLinkDraft = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      linkInputRef.current?.focus()
      return
    }

    try {
      const value = await navigator.clipboard.readText()
      if (value) setLinkDraft(value.trim())
    } catch {
      // Clipboard permission can be unavailable in some browser contexts.
      linkInputRef.current?.focus()
    }
  }

  const updateQueryOption = (id, name) => {
    setQueryOptionsDraft((options) => options.map((option) => (
      option.id === id ? { ...option, name } : option
    )))
  }

  const addQueryOption = () => {
    const id = `option-${nextQueryOptionIdRef.current}`
    nextQueryOptionIdRef.current += 1
    setQueryOptionsDraft((options) => [...options, { id, name: composerCopy.optionLabel(options.length + 1) }])
  }

  const removeQueryOption = (id) => {
    setQueryOptionsDraft((options) => {
      if (options.length <= 2) return options
      return options.filter((option) => option.id !== id)
    })
  }

  const removeAttachedLink = () => {
    if (attachedLink) {
      setAttachedLink('')
      setLinkDraft('')
      return
    }

    if (typedBodyUrl) setBody(removeFirstPostUrl(body))
  }

  const saveAttachment = () => {
    if (attachmentModal === 'link') {
      setAttachedLink(linkDraft.trim())
    }

    if (attachmentModal === 'query') {
      const title = queryTitleDraft.trim()
      const options = queryOptionsDraft
        .map((option) => option.name.trim())
        .filter(Boolean)
      setAttachedQuery({
        title: title || composerCopy.untitledQuery,
        options: options.length >= 2 ? options : createDefaultQueryOptions(composerCopy).map((option) => option.name),
      })
    }

    setAttachmentModal(null)
  }

  return (
    <form className="post-composer" onSubmit={handleSubmit}>
      <div className="composer-input-wrap">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={isSignedIn ? t.social.postPlaceholder : t.social.postPlaceholderGuest}
          rows={4}
        />
        <div ref={attachMenuRef} className="composer-attach">
          <button
            className="composer-attach-button"
            type="button"
            aria-label={composerCopy.attachContent}
            aria-haspopup="menu"
            aria-expanded={attachMenuOpen}
            onClick={(event) => {
              event.stopPropagation()
              setAttachMenuOpen((open) => !open)
            }}
          >
            <Plus size={18} />
          </button>
          {attachMenuOpen && (
            <div className="composer-attach-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => openAttachmentModal('link')}>
                <Link size={15} />
                {composerCopy.link}
              </button>
              <button type="button" role="menuitem" onClick={openMediaPicker}>
                <ImagePlus size={15} />
                {composerCopy.media}
              </button>
              <button type="button" role="menuitem" onClick={() => openAttachmentModal('query')}>
                <MessageSquare size={15} />
                {composerCopy.query}
              </button>
            </div>
          )}
        </div>
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={handleMediaSelection}
        />
      </div>
      {previewPost && (
        <div className="composer-preview" aria-label={composerCopy.previewLabel}>
          <PostAttachment post={previewPost} />
          <button
            className="composer-remove-attachment"
            type="button"
            aria-label={composerCopy.removeAttachedLink}
            onClick={removeAttachedLink}
          >
            <XCircle size={16} />
          </button>
        </div>
      )}
      {attachedQuery && (
        <div className="composer-query-preview">
          <MessageSquare size={15} />
          <span className="composer-query-preview-text">
            <strong>{attachedQuery.title}</strong>
            <small>{attachedQuery.options.join(' / ')}</small>
          </span>
          <button type="button" aria-label={composerCopy.removeQueryAttachment} onClick={() => setAttachedQuery(null)}>
            <XCircle size={15} />
          </button>
        </div>
      )}
      {attachedMedia.length > 0 && (
        <div className={`composer-media-grid media-count-${attachedMedia.length}`} aria-label={composerCopy.mediaLabel}>
          {attachedMedia.map((item) => (
            <div className="composer-media-item" key={item.id}>
              {item.file.type.startsWith('video/') ? (
                <video src={item.previewUrl} preload="metadata" muted />
              ) : (
                <img src={item.previewUrl} alt={item.file.name} />
              )}
              <span title={item.file.name}>{item.file.name}</span>
              <button
                type="button"
                aria-label={composerCopy.removeFile(item.file.name)}
                disabled={isPublishing}
                onClick={() => removeAttachedMedia(item.id)}
              >
                <XCircle size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
      {composerError && <div className="composer-error" role="alert">{composerError}</div>}
      <div className="composer-bottom">
        <div className="composer-tags" aria-label={composerCopy.postTopics}>
          {SOCIAL_TOPICS.slice(0, 6).map((topic) => (
            <button
              key={topic}
              className={selectedTags.includes(topic) ? 'mini-topic selected' : 'mini-topic'}
              type="button"
              onClick={() => toggleTag(topic)}
            >
              {topicLabel(topic, t.social)}
            </button>
          ))}
        </div>
        <button className="compose-button" type="submit" disabled={isPublishing}>
          {isPublishing ? <Loader2 size={16} className="composer-spin" /> : <Plus size={16} />}
          {isPublishing ? (uploadProgress || composerCopy.publishing) : t.social.post}
        </button>
      </div>
      {attachmentModal && (
        <div className="composer-modal-backdrop" role="presentation" onMouseDown={() => setAttachmentModal(null)}>
          <div
            className="composer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="composer-attachment-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="composer-modal-header">
              <h3 id="composer-attachment-title">
                {attachmentModal === 'link' ? composerCopy.attachLink : composerCopy.attachQuery}
              </h3>
              <button type="button" aria-label={composerCopy.closeAttachmentModal} onClick={() => setAttachmentModal(null)}>
                <XCircle size={18} />
              </button>
            </div>

            {attachmentModal === 'link' ? (
              <label>
                <span>{composerCopy.linkUrl}</span>
                <div className="composer-icon-input">
                  <button type="button" aria-label={composerCopy.pasteLinkUrl} onClick={pasteLinkDraft}>
                    <ClipboardPaste size={16} />
                  </button>
                  <input
                    ref={linkInputRef}
                    autoFocus
                    value={linkDraft}
                    onChange={(event) => setLinkDraft(event.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </label>
            ) : (
              <div className="query-builder">
                <label>
                  <span>{composerCopy.queryTitle}</span>
                  <input
                    autoFocus
                    value={queryTitleDraft}
                    onChange={(event) => setQueryTitleDraft(event.target.value)}
                    placeholder={composerCopy.queryTitlePlaceholder}
                  />
                </label>
                <div className="query-options-header">
                  <span>{composerCopy.options}</span>
                  <button type="button" onClick={addQueryOption}>
                    <Plus size={14} />
                    {composerCopy.addOption}
                  </button>
                </div>
                <div className="query-option-list">
                  <AnimatePresence initial={false}>
                    {queryOptionsDraft.map((option, index) => (
                      <motion.div
                        key={option.id}
                        layout
                        className="query-option-row"
                        initial={{ opacity: 0, scale: 0.92, y: -14, filter: 'blur(5px)' }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          y: 0,
                          filter: 'blur(0px)',
                          transition: { type: 'spring', stiffness: 620, damping: 28, mass: 0.72, velocity: 4 },
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.9,
                          x: 34,
                          filter: 'blur(4px)',
                          transition: { type: 'spring', stiffness: 700, damping: 32, mass: 0.6, velocity: 6 },
                        }}
                        transition={{ layout: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 } }}
                      >
                        <input
                          value={option.name}
                          onChange={(event) => updateQueryOption(option.id, event.target.value)}
                          placeholder={composerCopy.optionLabel(index + 1)}
                        />
                        <button
                          type="button"
                          aria-label={composerCopy.removeOption(index + 1)}
                          disabled={queryOptionsDraft.length <= 2}
                          onClick={() => removeQueryOption(option.id)}
                        >
                          <XCircle size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            <div className="composer-modal-actions">
              <button type="button" onClick={() => setAttachmentModal(null)}>{composerCopy.cancel}</button>
              <button className="compose-button" type="button" onClick={saveAttachment}>{composerCopy.attach}</button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}

function FeedTab({ onOpenAuth, onViewUser }) {
  const { state, usersById, currentUser, currentProfile, isSignedIn, reactToPost, toggleBookmark, deletePost } = useSocial()
  const { t } = useTranslation()
  const { defaultCommunityFeed, reducedMotion } = usePreferences()
  const posts = useMemo(() => {
    const feedPosts = defaultCommunityFeed === 'followed'
      ? state.posts.filter((post) => post.tags?.some((tag) => currentProfile?.followedTopics?.includes(tag)))
      : [...state.posts]

    if (defaultCommunityFeed === 'trending') {
      const reactionCount = (post) => Object.values(post.reactions || {}).reduce((total, entries) => total + entries.length, 0)
      return feedPosts.sort((first, second) => reactionCount(second) - reactionCount(first))
    }
    return feedPosts
  }, [currentProfile?.followedTopics, defaultCommunityFeed, state.posts])

  return (
    <div className="social-stack">
      {isSignedIn ? (
        <PostComposer onOpenAuth={onOpenAuth} />
      ) : (
        <GuestAccessNotice onOpenAuth={onOpenAuth} />
      )}

      <AnimatePresence initial={false}>
      {posts.map((post) => {
        const author = usersById[post.authorId] ?? userFallback(post.authorId, t.social)

        return (
          <motion.div
            key={post.id}
            layout={!reducedMotion}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, height: 0, marginBottom: 0, transition: { type: 'spring', stiffness: 400, damping: 35, opacity: { duration: 0.15 } } }}
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
  const { t, lang } = useTranslation()
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
        <span>{t.social.commentsCount(comments.length)}</span>
      </div>

      {comments.length > 0 && (
        <div className="comments-list">
          {comments.map((comment) => {
            const author = usersById[comment.authorId] ?? userFallback(comment.authorId, t.social)
            return (
              <div key={comment.id} className="comment-item">
                <Avatar user={author} size="sm" onClick={() => onViewUser?.(comment.authorId)} />
                <div>
                  <strong>{author.username}</strong>
                  <span>{formatRelative(comment.createdAt, t.social, lang)}</span>
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
          placeholder={currentUser ? t.social.addFocusedNote : t.social.signInToComment}
        />
        <button type="submit" aria-label={t.social.submitComment}>
          <Send size={15} />
        </button>
      </form>
    </div>
  )
}

function RumorsTab({ onOpenAuth, onViewUser }) {
  const { state, currentUser, isSignedIn, voteRumor, totalVotes } = useSocial()
  const { t, lang } = useTranslation()

  return (
    <div className="social-stack">
      {state.rumors.map((rumor) => {
        const total = Math.max(totalVotes(rumor.votes), 1)
        const currentVote = RUMOR_VOTE_OPTIONS.find((option) => rumor.votes[option.id]?.includes(currentUser?.id))

        return (
          <article key={rumor.id} className="rumor-card">
            <div className="rumor-topline">
              <span>{topicLabel(rumor.topic, t.social)}</span>
              <small>{formatRelative(rumor.updatedAt, t.social, lang)}</small>
            </div>

            <h3>{rumor.title}</h3>
            <p>{rumor.summary}</p>
            <div className="rumor-source">{t.social.sourceType}: {sourceLabel(rumor.sourceLabel, t.social)}</div>

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
                    <span>{t.social.rumorVotes[option.id] || option.label}</span>
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
  const sourceCopy = t.social.sourceForm
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
          <span>{sourceCopy.sourceUrl}</span>
          <input
            value={form.url}
            onChange={(event) => updateForm('url', event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label>
          <span>{sourceCopy.category}</span>
          <select value={form.category} onChange={(event) => updateForm('category', event.target.value)}>
            {SOURCE_CATEGORIES.map((category) => (
              <option key={category} value={category}>{sourceCategoryLabel(category, t.social)}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        <span>{sourceCopy.claimPrompt}</span>
        <textarea
          value={form.claim}
          onChange={(event) => updateForm('claim', event.target.value)}
          placeholder={sourceCopy.claimPlaceholder}
          rows={3}
        />
      </label>
      <label>
        <span>{sourceCopy.reasonPrompt}</span>
        <textarea
          value={form.reason}
          onChange={(event) => updateForm('reason', event.target.value)}
          placeholder={sourceCopy.reasonPlaceholder}
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
  const { state, usersById, isSignedIn } = useSocial()
  const { t, lang } = useTranslation()

  return (
    <div className="social-stack">
      {isSignedIn ? (
        <SourceForm onOpenAuth={onOpenAuth} />
      ) : (
        <GuestAccessNotice onOpenAuth={onOpenAuth} compact />
      )}

      <div className="source-list">
        {state.sources.map((source) => {
          const author = usersById[source.authorId] ?? userFallback(source.authorId, t.social)
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
                <a href={source.url} target="_blank" rel="noopener noreferrer" aria-label={t.social.sourceForm.openSource}>
                  <Link size={18} />
                </a>
              </div>

              <div className="source-meta">
                <span>{sourceCategoryLabel(source.category, t.social)}</span>
                <span>{getHostname(source.url, t.social)}</span>
                <span>{formatRelative(source.createdAt, t.social, lang)}</span>
              </div>

              <p>{source.reason}</p>

              <div className="source-author">
                <Avatar user={author} size="sm" onClick={() => onViewUser(source.authorId)} />
                <span>{t.social.submittedBy(author.username)}</span>
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
  const { t } = useTranslation()

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
            <span className="poll-total">{t.social.votesCount(totalVotes(poll.votes))}</span>
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
          <h1 className="section-title">
            {t.social.titleHighlight ? (
              <>
                {t.social.title} <span className="gradient-text">{t.social.titleHighlight}</span>
              </>
            ) : t.social.title}
          </h1>
        </div>

        <div className="social-shell">
          <Sidebar onOpenAuth={onOpenAuth} />

          <div className="social-main">
            <div className="social-tabs" role="tablist" aria-label={t.social.sectionsLabel || t.social.tabs.profile}>
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
