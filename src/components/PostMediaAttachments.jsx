import { telegramPostMediaUrl } from '../storage/telegramStorage'
import './PostAttachment.css'

function PostMediaAttachments({ post }) {
  const attachments = Array.isArray(post?.attachments) ? post.attachments : []
  if (!post?.id || attachments.length === 0) return null

  return (
    <div
      className={`post-media-grid media-count-${Math.min(attachments.length, 4)}`}
      aria-label="Post media"
    >
      {attachments.map((attachment, index) => {
        const source = telegramPostMediaUrl(post.id, attachment)
        const poster = attachment.thumbnailFileId
          ? telegramPostMediaUrl(post.id, { fileId: attachment.thumbnailFileId })
          : ''
        const key = attachment.fileUniqueId || attachment.fileId || `${attachment.name}-${index}`

        return (
          <div className="post-media-item" key={key}>
            {attachment.type?.startsWith('video/') ? (
              <video
                controls
                playsInline
                preload={poster ? 'metadata' : 'auto'}
                poster={poster || undefined}
                src={source}
                aria-label={attachment.name || `Video ${index + 1}`}
              />
            ) : (
              <img
                src={source}
                alt={attachment.name || `Post image ${index + 1}`}
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default PostMediaAttachments
