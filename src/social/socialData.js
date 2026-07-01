export const REACTION_OPTIONS = [
  { id: 'useful', label: 'Useful', icon: '👍' },
  { id: 'interesting', label: 'Interesting', icon: '👀' },
  { id: 'doubtful', label: 'Doubtful', icon: '🤔' },
]

export const RUMOR_VOTE_OPTIONS = [
  { id: 'looks_real', label: 'Looks real' },
  { id: 'probably_fake', label: 'Probably fake' },
  { id: 'need_more_proof', label: 'Need more proof' },
  { id: 'debunked', label: 'Already debunked' },
]

export const SOCIAL_TOPICS = [
  'Release date',
  'PC version',
  'Trailers',
  'Map / Leonida',
  'Characters',
  'Vehicles',
  'Online mode',
  'Pre-orders',
  'System requirements',
]

export const SOURCE_CATEGORIES = [
  'Newswire',
  'Trailer analysis',
  'Retail listing',
  'Platform store',
  'Interview',
  'Community find',
  'Rumor',
]

export const TRAILER_ANALYSIS_THREADS = [
  {
    id: 'trailer-1',
    title: 'Trailer 1 continuity notes',
    summary: 'Scene-by-scene callbacks, street signs, and Leonida landmarks worth reviewing.',
    topic: 'Trailers',
  },
  {
    id: 'trailer-2',
    title: 'Trailer 2 gameplay clues',
    summary: 'Vehicle handling, social feed UI, water physics, and character switching hints.',
    topic: 'Trailers',
  },
]

const makeVotes = (pairs = []) =>
  RUMOR_VOTE_OPTIONS.reduce((votes, option) => {
    votes[option.id] = pairs.find(([key]) => key === option.id)?.[1] ?? []
    return votes
  }, {})

const makeReactions = (pairs = []) =>
  REACTION_OPTIONS.reduce((reactions, option) => {
    reactions[option.id] = pairs.find(([key]) => key === option.id)?.[1] ?? []
    return reactions
  }, {})

export function createSeedSocialState() {
  const users = [
    {
      id: 'user-vice-archivist',
      username: 'ViceArchivist',
      avatarColor: '#ff2d95',
      joinedAt: '2025-12-09T15:20:00.000Z',
      followedTopics: ['Release date', 'Trailers', 'Map / Leonida', 'Characters'],
      badges: ['Early Follower', 'Trailer Watcher', 'Vice City Local'],
    },
    {
      id: 'user-trailerwatch',
      username: 'TrailerWatch',
      avatarColor: '#00d9ff',
      joinedAt: '2026-02-18T11:12:00.000Z',
      followedTopics: ['Trailers', 'Vehicles', 'Online mode'],
      badges: ['Trailer Watcher'],
    },
    {
      id: 'user-maprunner',
      username: 'MapRunner',
      avatarColor: '#ffb000',
      joinedAt: '2026-03-27T20:04:00.000Z',
      followedTopics: ['Map / Leonida', 'Vehicles', 'System requirements'],
      badges: ['Vice City Local'],
    },
  ]

  return {
    version: 1,
    users,
    posts: [
      {
        id: 'post-official-window',
        authorId: 'user-vice-archivist',
        body: 'Release-date tracking should separate confirmed Rockstar language from retailer placeholder dates. The November 19, 2026 date is the one to keep pinned until the Newswire says otherwise.',
        tags: ['Release date'],
        createdAt: '2026-05-04T18:14:00.000Z',
        reactions: makeReactions([
          ['useful', ['user-trailerwatch', 'user-maprunner']],
          ['interesting', ['user-maprunner']],
        ]),
      },
      {
        id: 'post-leonida-signs',
        authorId: 'user-maprunner',
        body: 'The freeway sign sequence in Trailer 2 looks like it confirms at least two inland county routes. I added a map thread for marker comparisons.',
        linkUrl: 'https://www.youtube.com/watch?v=VQRLujxTm3c',
        tags: ['Map / Leonida', 'Trailers'],
        createdAt: '2026-05-06T09:31:00.000Z',
        reactions: makeReactions([
          ['interesting', ['user-vice-archivist', 'user-trailerwatch']],
          ['doubtful', ['user-trailerwatch']],
        ]),
      },
    ],
    rumors: [
      {
        id: 'rumor-pc-window',
        title: 'PC version may follow console launch by roughly one year',
        summary: 'Community speculation based on prior Rockstar release patterns and store metadata movement.',
        topic: 'PC version',
        sourceLabel: 'Pattern analysis',
        updatedAt: '2026-05-07T13:42:00.000Z',
        votes: makeVotes([
          ['need_more_proof', ['user-vice-archivist', 'user-maprunner']],
          ['probably_fake', ['user-trailerwatch']],
        ]),
      },
      {
        id: 'rumor-preorder-june',
        title: 'Pre-orders opening after the next trailer beat',
        summary: 'A retail employee screenshot claims boxed SKU pages are being staged for an early summer update.',
        topic: 'Pre-orders',
        sourceLabel: 'Retail screenshot',
        updatedAt: '2026-05-05T17:10:00.000Z',
        votes: makeVotes([
          ['need_more_proof', ['user-vice-archivist']],
          ['looks_real', ['user-maprunner']],
        ]),
      },
      {
        id: 'rumor-online-standalone',
        title: 'Online mode will launch as a separate download',
        summary: 'A reposted claim says GTA Online for VI may ship as a separately managed client.',
        topic: 'Online mode',
        sourceLabel: 'Community repost',
        updatedAt: '2026-05-02T08:24:00.000Z',
        votes: makeVotes([
          ['debunked', ['user-vice-archivist']],
          ['probably_fake', ['user-trailerwatch', 'user-maprunner']],
        ]),
      },
    ],
    sources: [
      {
        id: 'source-newswire-date',
        authorId: 'user-vice-archivist',
        url: 'https://www.rockstargames.com/VI',
        claim: 'The official product page lists the current launch timing and supported platforms.',
        category: 'Newswire',
        reason: 'Primary source that should anchor the release-date tracker.',
        status: 'accepted',
        createdAt: '2026-05-03T12:15:00.000Z',
      },
      {
        id: 'source-trailer-vehicle',
        authorId: 'user-trailerwatch',
        url: 'https://www.youtube.com/watch?v=VQRLujxTm3c',
        claim: 'Trailer 2 shows several branded vehicle silhouettes not shown in Trailer 1.',
        category: 'Trailer analysis',
        reason: 'Useful for the vehicle index and screenshot comparison pass.',
        status: 'accepted',
        createdAt: '2026-05-06T22:18:00.000Z',
      },
      {
        id: 'source-retail-preorder',
        authorId: 'user-maprunner',
        url: 'https://example.com/retail-preorder-placeholder',
        claim: 'A retailer page briefly exposed a GTA VI preorder SKU.',
        category: 'Retail listing',
        reason: 'Needs review before being cited because the screenshot is second-hand.',
        status: 'review',
        createdAt: '2026-05-07T10:05:00.000Z',
      },
    ],
    polls: [
      {
        id: 'poll-platform',
        question: 'Which platform will you play on?',
        options: [
          { id: 'ps5', label: 'PS5' },
          { id: 'xbox', label: 'Xbox Series X|S' },
          { id: 'pc_wait', label: 'Waiting for PC' },
        ],
        votes: {
          ps5: ['user-vice-archivist', 'user-trailerwatch'],
          xbox: ['user-maprunner'],
          pc_wait: [],
        },
      },
      {
        id: 'poll-next-topic',
        question: 'Which topic do you want us to track next?',
        options: [
          { id: 'vehicles', label: 'Vehicles' },
          { id: 'map_locations', label: 'Map locations' },
          { id: 'online_mode', label: 'Online mode' },
          { id: 'system_requirements', label: 'System requirements' },
        ],
        votes: {
          vehicles: ['user-trailerwatch'],
          map_locations: ['user-vice-archivist', 'user-maprunner'],
          online_mode: [],
          system_requirements: [],
        },
      },
    ],
    comments: [
      {
        id: 'comment-rumor-pc-1',
        targetType: 'rumor',
        targetId: 'rumor-pc-window',
        authorId: 'user-vice-archivist',
        body: 'Treating this as pattern evidence only until a platform holder or Rockstar page changes.',
        createdAt: '2026-05-07T14:01:00.000Z',
      },
      {
        id: 'comment-trailer-2-1',
        targetType: 'trailer',
        targetId: 'trailer-2',
        authorId: 'user-trailerwatch',
        body: 'The mud spray and suspension movement are the strongest gameplay-adjacent clues for me.',
        createdAt: '2026-05-06T23:02:00.000Z',
      },
      {
        id: 'comment-source-retail-1',
        targetType: 'source',
        targetId: 'source-retail-preorder',
        authorId: 'user-maprunner',
        body: 'I could not find a cached page, only the image repost. Marking for review was the right call.',
        createdAt: '2026-05-07T10:31:00.000Z',
      },
    ],
  }
}
