import { useEffect, useState } from 'react'
import { Newspaper, Loader, MessageSquare, ArrowUpRight, Clock } from 'lucide-react'
import './NewsSection.css'

// Fallback news data in case API fails
const FALLBACK_NEWS = [
  {
    title: 'GTA VI Release Date Set for November 19, 2026',
    author: 'Rockstar Games',
    subreddit: 'GTA6',
    score: 45200,
    num_comments: 3890,
    created_utc: Date.now() / 1000 - 86400 * 2,
    permalink: '/r/GTA6/comments/1gta6_release/',
    url: 'https://www.rockstargames.com/VI',
  },
  {
    title: 'New GTA VI Screenshots Show Stunning Vice City Detail',
    author: 'gaming_news',
    subreddit: 'GTA6',
    score: 28500,
    num_comments: 2140,
    created_utc: Date.now() / 1000 - 86400 * 5,
    permalink: '/r/GTA6/comments/1gta6_screenshots/',
    url: 'https://www.reddit.com/r/GTA6',
  },
  {
    title: 'Analysis: GTA VI Map Size Compared to Previous Games',
    author: 'map_master',
    subreddit: 'GTA6',
    score: 18900,
    num_comments: 1650,
    created_utc: Date.now() / 1000 - 86400 * 7,
    permalink: '/r/GTA6/comments/1gta6_map/',
    url: 'https://www.reddit.com/r/GTA6',
  },
  {
    title: 'Jason and Lucia Relationship Dynamic Explained by Leakers',
    author: 'vice_city_insider',
    subreddit: 'GTA6',
    score: 22100,
    num_comments: 1980,
    created_utc: Date.now() / 1000 - 86400 * 10,
    permalink: '/r/GTA6/comments/1gta6_characters/',
    url: 'https://www.reddit.com/r/GTA6',
  },
  {
    title: 'GTA VI Pre-Orders Expected to Break Records',
    author: 'industry_analyst',
    subreddit: 'GTA6',
    score: 15600,
    num_comments: 1200,
    created_utc: Date.now() / 1000 - 86400 * 12,
    permalink: '/r/GTA6/comments/1gta6_preorders/',
    url: 'https://www.reddit.com/r/GTA6',
  },
]

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() / 1000) - timestamp)
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`
    }
  }
  return 'Just now'
}

function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

function NewsSection() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReddit = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/reddit/hot')

        if (!response.ok) {
          throw new Error('Reddit API unavailable')
        }

        const data = await response.json()
        const redditPosts = data.data.children.map(child => child.data)
        setPosts(redditPosts)
      } catch (err) {
        console.log('Reddit fetch failed, using fallback:', err)
        setPosts(FALLBACK_NEWS)
      } finally {
        setLoading(false)
      }
    }

    fetchReddit()
  }, [])

  return (
    <section id="news" className="section-padding news-section">
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <Newspaper size={14} />
            <span>COMMUNITY</span>
          </div>
          <h2 className="section-title">
            LATEST <span className="gradient-text">UPDATES</span>
          </h2>
        </div>

        {loading && (
          <div className="loading-state">
            <Loader size={32} className="animate-spin" />
            <p>Loading latest news...</p>
          </div>
        )}

        {!loading && (
          <div className="news-grid">
            {posts.map((post, index) => (
              <a
                key={index}
                href={`https://www.reddit.com${post.permalink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="news-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="news-header">
                  <span className="news-subreddit">r/{post.subreddit}</span>
                  <span className="news-time">
                    <Clock size={12} />
                    {formatTimeAgo(post.created_utc)}
                  </span>
                </div>
                <h3 className="news-title">{post.title}</h3>
                <div className="news-footer">
                  <div className="news-stats">
                    <span className="news-stat">
                      <ArrowUpRight size={14} />
                      {formatNumber(post.score)}
                    </span>
                    <span className="news-stat">
                      <MessageSquare size={14} />
                      {formatNumber(post.num_comments)}
                    </span>
                  </div>
                  <span className="news-author">u/{post.author}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default NewsSection
