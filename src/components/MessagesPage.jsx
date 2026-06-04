import { useEffect, useMemo, useRef, useState } from 'react'
import { Inbox, Loader2, MessageCircle, Search, Send, User } from 'lucide-react'
import { buildMessageDialogs, messageTimeLabel, messagesBetween } from '../messages/messageHelpers'
import { useTranslation } from '../i18n/useTranslation.jsx'
import { useSocial } from '../social/SocialContext'
import './MessagesPage.css'

function userFallback(userId) {
  return {
    id: userId,
    username: 'Unknown user',
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
  const { t } = useTranslation()
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
      const user = usersById[dialog.userId] || userFallback(dialog.userId)
      const text = `${user.username} ${dialog.lastMessage?.body || ''}`.toLowerCase()
      return text.includes(query)
    })
  }, [dialogs, searchQuery, usersById])

  const effectiveSelectedUserId = selectedUserId || dialogs[0]?.userId || ''
  const selectedUser = effectiveSelectedUserId
    ? (usersById[effectiveSelectedUserId] || userFallback(effectiveSelectedUserId))
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
      setStatus('Message sent.')
    } else {
      setStatus('Could not send the message.')
    }
  }

  if (!isSignedIn) {
    return (
      <section className="messages-page section-padding">
        <div className="container">
          <div className="messages-guest-panel">
            <MessageCircle size={28} />
            <span>{t.social.tabs.messages}</span>
            <h1>Sign in to read and send messages.</h1>
            <p>Your P2P conversations and direct messages will appear here after you sign in.</p>
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
          <h1>Messages</h1>
          <p>Keep P2P deals, delivery details, and community conversations in one place.</p>
        </header>

        <div className="messages-shell">
          <aside className="messages-dialogs" aria-label="Dialogs">
            <label className="messages-search">
              <Search size={16} />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search dialogs"
              />
            </label>

            <div className="messages-dialog-list">
              {filteredDialogs.map((dialog) => {
                const user = usersById[dialog.userId] || userFallback(dialog.userId)
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
                      <small>{mine ? 'You: ' : ''}{dialog.lastMessage?.body || 'No messages yet'}</small>
                    </span>
                    <time>{messageTimeLabel(dialog.lastMessage?.createdAt)}</time>
                  </button>
                )
              })}

              {!filteredDialogs.length && (
                <div className="messages-dialog-empty">
                  <Inbox size={22} />
                  <strong>No dialogs yet</strong>
                  <span>Open a P2P product and message the seller to start a conversation.</span>
                  <button type="button" onClick={() => onNavigate?.('/p2p')}>Browse P2P</button>
                </div>
              )}
            </div>
          </aside>

          <main className="messages-thread" aria-label="Conversation">
            {selectedUser ? (
              <>
                <header className="messages-thread-head">
                  <DialogAvatar user={selectedUser} />
                  <div>
                    <span>Chat with</span>
                    <h2>{selectedUser.username}</h2>
                  </div>
                </header>

                <div className="messages-thread-list" ref={listRef}>
                  {selectedMessages.map((message) => {
                    const mine = message.fromId === currentUserId

                    return (
                      <article key={message.id} className={`messages-bubble ${mine ? 'mine' : ''}`}>
                        <p>{message.body}</p>
                        <time>{messageTimeLabel(message.createdAt)}</time>
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
                    placeholder="Write a message..."
                    rows={2}
                    maxLength={700}
                  />
                  <button type="submit" disabled={sending || !draft.trim()}>
                    {sending ? <Loader2 size={16} className="messages-spin" /> : <Send size={16} />}
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="messages-thread-empty">
                <MessageCircle size={28} />
                <strong>Select a dialog</strong>
                <span>Your conversations will appear here.</span>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}

export default MessagesPage
