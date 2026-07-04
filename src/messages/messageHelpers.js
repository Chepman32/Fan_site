export function participantKey(firstUserId, secondUserId) {
  return [firstUserId, secondUserId].sort().join('__')
}

export function messagesBetween(messages, currentUserId, otherUserId) {
  const key = participantKey(currentUserId, otherUserId)

  return messages
    .filter((message) => {
      const participantIds = message.participantIds || [message.fromId, message.toId].filter(Boolean)
      return participantKey(participantIds[0], participantIds[1]) === key
    })
    .sort((first, second) => new Date(first.createdAt ?? 0) - new Date(second.createdAt ?? 0))
}

export function buildMessageDialogs(messages, currentUserId) {
  const dialogs = new Map()

  messages.forEach((message) => {
    const participantIds = message.participantIds || [message.fromId, message.toId].filter(Boolean)
    const otherUserId = participantIds.find((participantId) => participantId !== currentUserId)

    if (!otherUserId) return

    const currentDialog = dialogs.get(otherUserId) || {
      userId: otherUserId,
      messages: [],
      lastMessage: null,
    }
    const nextMessages = [...currentDialog.messages, message]
      .sort((first, second) => new Date(first.createdAt ?? 0) - new Date(second.createdAt ?? 0))

    dialogs.set(otherUserId, {
      userId: otherUserId,
      messages: nextMessages,
      lastMessage: nextMessages[nextMessages.length - 1],
    })
  })

  return Array.from(dialogs.values()).sort((first, second) => {
    return new Date(second.lastMessage?.createdAt ?? 0) - new Date(first.lastMessage?.createdAt ?? 0)
  })
}

export function messageTimeLabel(dateValue, language = 'en-US', dateTimeFormat = 'locale') {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Now'

  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()

  const locale = dateTimeFormat === 'mdy' ? 'en-US' : dateTimeFormat === 'dmy' ? 'en-GB' : language
  return new Intl.DateTimeFormat(locale, {
    month: isToday ? undefined : 'short',
    day: isToday ? undefined : 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
