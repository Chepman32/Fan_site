import { ExternalLink, Link as LinkIcon, Play } from 'lucide-react'
import { getPostAttachment } from '../social/postLinks'
import './PostAttachment.css'

function PostAttachment({ post }) {
  const attachment = getPostAttachment(post)
  if (!attachment) return null

  if (attachment.type === 'video') {
    return (
      <div className="post-attachment">
        <div className="post-attachment-header">
          <span>
            <Play size={14} />
            {attachment.provider}
          </span>
          <a href={attachment.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${attachment.provider} video`}>
            <ExternalLink size={14} />
          </a>
        </div>
        <div className="post-video-frame">
          <iframe
            title={`${attachment.provider} video`}
            src={attachment.embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    )
  }

  return (
    <a className="post-link-card" href={attachment.sourceUrl} target="_blank" rel="noopener noreferrer">
      <LinkIcon size={16} />
      <span>{attachment.host}</span>
      <ExternalLink size={14} />
    </a>
  )
}

export default PostAttachment
