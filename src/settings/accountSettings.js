export const MESSAGE_PERMISSIONS = ['everyone', 'registered', 'nobody']
export const ACCOUNT_THEMES = ['system', 'dark', 'light']
export const CONTENT_DENSITIES = ['comfortable', 'compact']
export const DATE_TIME_FORMATS = ['locale', 'mdy', 'dmy']
export const COMMUNITY_FEEDS = ['latest', 'trending', 'followed']
export const ACCOUNT_LANGUAGES = ['', 'en', 'zh', 'ru', 'it', 'id', 'pl', 'hi', 'ms']

export const DEFAULT_ACCOUNT_SETTINGS = Object.freeze({
  messagePermission: 'everyone',
  showActivityStatus: true,
  blockedUserIds: [],
  mutedUserIds: [],
  mutedTopics: [],
  hideSpoilers: true,
  autoplayVideos: false,
  defaultTronPayoutAddress: '',
  salePayoutAlerts: true,
  confirmWalletBeforeListing: true,
  theme: 'system',
  reducedMotion: false,
  contentDensity: 'comfortable',
  preferredLanguage: '',
  dateTimeFormat: 'locale',
  translateVehicleNames: false,
  defaultCommunityFeed: 'latest',
})

function enumValue(value, values, fallback) {
  return values.includes(value) ? value : fallback
}

function stringList(value, maxItems = 200, maxLength = 80) {
  if (!Array.isArray(value)) return []
  return [...new Set(value
    .map((item) => String(item || '').trim().slice(0, maxLength))
    .filter(Boolean))]
    .slice(0, maxItems)
}

export function normalizeAccountSettings(value = {}) {
  return {
    ...DEFAULT_ACCOUNT_SETTINGS,
    messagePermission: enumValue(value.messagePermission, MESSAGE_PERMISSIONS, DEFAULT_ACCOUNT_SETTINGS.messagePermission),
    showActivityStatus: value.showActivityStatus !== false,
    blockedUserIds: stringList(value.blockedUserIds),
    mutedUserIds: stringList(value.mutedUserIds),
    mutedTopics: stringList(value.mutedTopics, 50, 60),
    hideSpoilers: value.hideSpoilers !== false,
    autoplayVideos: value.autoplayVideos === true,
    defaultTronPayoutAddress: String(value.defaultTronPayoutAddress || '').trim().slice(0, 128),
    salePayoutAlerts: value.salePayoutAlerts !== false,
    confirmWalletBeforeListing: value.confirmWalletBeforeListing !== false,
    theme: enumValue(value.theme, ACCOUNT_THEMES, DEFAULT_ACCOUNT_SETTINGS.theme),
    reducedMotion: value.reducedMotion === true,
    contentDensity: enumValue(value.contentDensity, CONTENT_DENSITIES, DEFAULT_ACCOUNT_SETTINGS.contentDensity),
    preferredLanguage: enumValue(String(value.preferredLanguage || '').trim(), ACCOUNT_LANGUAGES, ''),
    dateTimeFormat: enumValue(value.dateTimeFormat, DATE_TIME_FORMATS, DEFAULT_ACCOUNT_SETTINGS.dateTimeFormat),
    translateVehicleNames: value.translateVehicleNames === true,
    defaultCommunityFeed: enumValue(value.defaultCommunityFeed, COMMUNITY_FEEDS, DEFAULT_ACCOUNT_SETTINGS.defaultCommunityFeed),
  }
}

export function normalizeAccountSettingsPatch(patch = {}) {
  const normalized = normalizeAccountSettings(patch)
  return Object.keys(patch).reduce((result, key) => {
    if (key in DEFAULT_ACCOUNT_SETTINGS) result[key] = normalized[key]
    return result
  }, {})
}
