import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, MessageCircle, Send, X } from 'lucide-react'
import { messagesBetween, messageTimeLabel } from '../messages/messageHelpers'
import { useSocial } from '../social/SocialContext'
import './MessageConversationModal.css'

function ChatAvatar({ user, size = 'md' }) {
  const initials = (user?.username || 'U').slice(0, 2).toUpperCase()

  return (
    <span
      className={`chat-avatar ${size}`}
      style={{ backgroundColor: `${user?.avatarColor || '#00d9ff'}22`, color: user?.avatarColor || '#00d9ff' }}
      aria-hidden="true"
    >
      {user?.photoDataUrl ? <img src={user.photoDataUrl} alt="" /> : initials}
    </span>
  )
}

function MessageConversationModal({
  recipient,
  contextLabel = '',
  initialBody = '',
  onClose,
}) {
  const { backendError, currentProfile, sendMessage, state } = useSocial()
  const [body, setBody] = useState(initialBody)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')
  const messageListRef = useRef(null)
  const currentUserId = currentProfile?.id || ''
  const recipientId = recipient?.id || ''

  const threadMessages = useMemo(() => {
    if (!currentUserId || !recipientId) return []
    return messagesBetween(state.messages, currentUserId, recipientId)
  }, [currentUserId, recipientId, state.messages])

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' })
  }, [threadMessages.length])

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const cleanBody = body.trim()
    if (!cleanBody || !recipientId) return

    setSending(true)
    setStatus('')
    const sent = await sendMessage({ toId: recipientId, body: cleanBody })
    setSending(false)

    if (sent) {
      setBody('')
      setStatus('Message sent.')
    } else {
      setStatus('Could not send the message.')
    }
  }

  return (
    <div className="chat-modal-backdrop" onClick={onClose}>
      <section
        className="chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="chat-modal-head">
          <ChatAvatar user={recipient} />
          <div>
            <span>Conversation</span>
            <h2 id="chat-modal-title">{recipient?.username || 'Seller'}</h2>
            {contextLabel && <p>{contextLabel}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close conversation">
            <X size={18} />
          </button>
        </header>

        <div className="chat-modal-list" ref={messageListRef}>
          {threadMessages.length === 0 ? (
            <div className="chat-empty-state">
              <MessageCircle size={24} />
              <strong>Start the conversation</strong>
              <span>Ask about payment, delivery, what is included, or anything you need before making a deal.</span>
            </div>
          ) : (
            threadMessages.map((message) => {
              const mine = message.fromId === currentUserId

              return (
                <article key={message.id} className={`chat-bubble ${mine ? 'mine' : ''}`}>
                  <p>{message.body}</p>
                  <span>{messageTimeLabel(message.createdAt)}</span>
                </article>
              )
            })
          )}
        </div>

        {(status || backendError) && (
          <div className="chat-modal-status" aria-live="polite">
            {status || backendError}
          </div>
        )}

        <form className="chat-modal-form" onSubmit={handleSubmit}>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a message..."
            maxLength={700}
            rows={3}
          />
          <button type="submit" disabled={sending || !body.trim()}>
            {sending ? <Loader2 size={16} className="chat-spin" /> : <Send size={16} />}
            Send
          </button>
        </form>
      </section>
    </div>
  )
}

export default MessageConversationModal
