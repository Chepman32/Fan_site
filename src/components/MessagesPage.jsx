import { useEffect, useMemo, useRef, useState } from 'react'
import { Inbox, Loader2, MessageCircle, Search, Send, User } from 'lucide-react'
import { buildMessageDialogs, messageTimeLabel, messagesBetween } from '../messages/messageHelpers'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { useSocial } from '../social/SocialContext'
import { usePreferences } from '../preferences/AppPreferences.jsx'
import './MessagesPage.css'

function userFallback(userId, copy) {
  return {
    id: userId,
    username: copy.unknownUser,
    avatarColor: '#6b6b7b',
    photoDataUrl: '',
  }
}

function DialogAvatar({ user, size = 'md' }) {
  const initials = (user?.username || '?').slice(0, 2).toUpperCase()

  return (
    <span
      className={`messages-avatar ${size}`}
      style={{ backgroundColor: `${user?.avatarColor || '#6b6b7b'}22`, color: user?.avatarColor || '#6b6b7b' }}
      aria-hidden="true"
    >
      {user?.photoDataUrl ? <img src={user.photoDataUrl} alt="" /> : initials}
    </span>
  )
}

function MessagesPage({ onOpenAuth, onNavigate }) {
  const {
    backendError,
    currentProfile,
    isSignedIn,
    sendMessage,
    state,
    usersById,
  } = useSocial()
  const { t, lang } = useTranslation()
  const copy = t.social.messagesPage
  const { dateTimeFormat } = usePreferences()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')
  const listRef = useRef(null)
  const currentUserId = currentProfile?.id || ''

  const dialogs = useMemo(() => {
    if (!currentUserId) return []
    return buildMessageDialogs(state.messages, currentUserId)
  }, [currentUserId, state.messages])

  const filteredDialogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return dialogs

    return dialogs.filter((dialog) => {
      const user = usersById[dialog.userId] || userFallback(dialog.userId, t.social)
      const text = `${user.username} ${dialog.lastMessage?.body || ''}`.toLowerCase()
      return text.includes(query)
    })
  }, [dialogs, searchQuery, t.social, usersById])

  const effectiveSelectedUserId = selectedUserId || dialogs[0]?.userId || ''
  const selectedUser = effectiveSelectedUserId
    ? (usersById[effectiveSelectedUserId] || userFallback(effectiveSelectedUserId, t.social))
    : null
  const selectedMessages = useMemo(() => {
    if (!currentUserId || !effectiveSelectedUserId) return []
    return messagesBetween(state.messages, currentUserId, effectiveSelectedUserId)
  }, [currentUserId, effectiveSelectedUserId, state.messages])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [selectedMessages.length, effectiveSelectedUserId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const cleanDraft = draft.trim()
    if (!cleanDraft || !effectiveSelectedUserId) return

    setSending(true)
    setStatus('')
    const sent = await sendMessage({ toId: effectiveSelectedUserId, body: cleanDraft })
    setSending(false)

    if (sent) {
    setDraft('')
      setStatus(copy.messageSent)
    } else {
      setStatus(copy.messageFailed)
    }
  }

  if (!isSignedIn) {
    return (
      <section className="messages-page section-padding">
        <div className="container">
          <div className="messages-guest-panel">
            <MessageCircle size={28} />
            <span>{t.social.tabs.messages}</span>
            <h1>{copy.guestTitle}</h1>
            <p>{copy.guestDescription}</p>
            <button type="button" onClick={onOpenAuth}>
              <User size={17} />
              {t.social.signIn}
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="messages-page section-padding">
      <div className="container messages-container">
        <header className="messages-page-head">
          <span>{t.social.tabs.messages}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </header>

        <div className="messages-shell">
          <aside className="messages-dialogs" aria-label={copy.dialogsLabel}>
            <label className="messages-search">
              <Search size={16} />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
              />
            </label>

            <div className="messages-dialog-list">
              {filteredDialogs.map((dialog) => {
                const user = usersById[dialog.userId] || userFallback(dialog.userId, t.social)
                const mine = dialog.lastMessage?.fromId === currentUserId

                return (
                  <button
                    key={dialog.userId}
                    type="button"
                    className={`messages-dialog ${effectiveSelectedUserId === dialog.userId ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedUserId(dialog.userId)
                      setStatus('')
                    }}
                  >
                    <DialogAvatar user={user} size="sm" />
                    <span>
                      <b>{user.username}</b>
                      <small>{mine ? copy.youPrefix : ''}{dialog.lastMessage?.body || copy.noMessagesYet}</small>
                    </span>
                    <time>{messageTimeLabel(dialog.lastMessage?.createdAt, lang, dateTimeFormat)}</time>
                  </button>
                )
              })}

              {!filteredDialogs.length && (
                <div className="messages-dialog-empty">
                  <Inbox size={22} />
                  <strong>{copy.emptyTitle}</strong>
                  <span>{copy.emptyDescription}</span>
                  <button type="button" onClick={() => onNavigate?.('/p2p')}>{copy.browseP2P}</button>
                </div>
              )}
            </div>
          </aside>

          <section className="messages-thread" aria-label={copy.conversationLabel}>
            {selectedUser ? (
              <>
                <header className="messages-thread-head">
                  <DialogAvatar user={selectedUser} />
                  <div>
                    <span>{copy.chatWith}</span>
                    <h2>{selectedUser.username}</h2>
                  </div>
                </header>

                <div className="messages-thread-list" ref={listRef}>
                  {selectedMessages.map((message) => {
                    const mine = message.fromId === currentUserId

                    return (
                      <article key={message.id} className={`messages-bubble ${mine ? 'mine' : ''}`}>
                        <p>{message.body}</p>
                        <time>{messageTimeLabel(message.createdAt, lang, dateTimeFormat)}</time>
                      </article>
                    )
                  })}
                </div>

                {(status || backendError) && (
                  <div className="messages-status" aria-live="polite">
                    {status || backendError}
                  </div>
                )}

                <form className="messages-compose" onSubmit={handleSubmit}>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={copy.writePlaceholder}
                    rows={2}
                    maxLength={700}
                  />
                  <button type="submit" disabled={sending || !draft.trim()}>
                    {sending ? <Loader2 size={16} className="messages-spin" /> : <Send size={16} />}
                    {copy.send}
                  </button>
                </form>
              </>
            ) : (
              <div className="messages-thread-empty">
                <MessageCircle size={28} />
                <strong>{copy.selectDialogTitle}</strong>
                <span>{copy.selectDialogDescription}</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}

export default MessagesPage
