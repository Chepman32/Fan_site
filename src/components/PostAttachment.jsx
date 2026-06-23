import { ExternalLink, Link as LinkIcon } from 'lucide-react'
import { getPostAttachment } from '../social/postLinks'
import './PostAttachment.css'

function PostAttachment({ post }) {
  const attachment = getPostAttachment(post)
  if (!attachment) return null

  if (attachment.type === 'video') {
    return (
      <div className="post-attachment video-only">
        <div className="post-video-frame">
          <iframe
            title={`${attachment.provider} video`}
            src={attachment.embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>
    )
  }

  return (
    <a className="post-link-card" href={attachment.sourceUrl} target="_blank" rel="noopener noreferrer">
      <span className="post-link-preview-media" aria-hidden="true">
        <img
          src={attachment.faviconUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(event) => { event.currentTarget.style.display = 'none' }}
        />
        <LinkIcon size={22} />
      </span>
      <span className="post-link-preview-copy">
        <span className="post-link-preview-title">{attachment.title}</span>
        <span className="post-link-preview-description">{attachment.description}</span>
        <span className="post-link-preview-host">{attachment.host}</span>
      </span>
      <ExternalLink className="post-link-preview-open" size={16} />
    </a>
  )
}

export default PostAttachment
