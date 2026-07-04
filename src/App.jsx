import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import NewsSection from './components/NewsSection'
import Header from './components/Header'
import Footer from './components/Footer'
import { logAnalyticsPageView } from './firebase/firebaseClient'
import { SocialProvider, useSocial } from './social/SocialContext'
import { LanguageProvider, useTranslation } from './i18n/useTranslation.jsx'
import { PreferencesProvider, usePreferences } from './preferences/AppPreferences.jsx'
import { shopCentsToPrice, shopPriceToCents } from './shop/paymentConfig'
import SeoHead from './seo/SeoHead'
import { createSeoMetadata } from './seo/seoConfig'
import './App.css'

const AuthModal = lazy(() => import('./components/AuthModal'))
const AboutPage = lazy(() => import('./components/AboutPage'))
const LeonidaGuidePage = lazy(() => import('./components/LeonidaGuidePage'))
const LeonidaHub = lazy(() => import('./components/LeonidaHub'))
const LocationGuidePage = lazy(() => import('./components/LocationGuidePage'))
const MessagesPage = lazy(() => import('./components/MessagesPage'))
const NewsArticlePage = lazy(() => import('./components/NewsArticlePage'))
const P2PTradingPage = lazy(() => import('./components/P2PTradingPage'))
const ProfilePage = lazy(() => import('./components/ProfilePage'))
const SettingsPage = lazy(() => import('./components/SettingsPage'))
const ShopPage = lazy(() => import('./components/ShopPage'))
const SocialHub = lazy(() => import('./components/SocialHub'))
const UserProfilePage = lazy(() => import('./components/UserProfilePage'))

const APP_ROUTES = new Set(['/about', '/community', '/profile', '/settings', '/shop', '/p2p', '/messages', '/news', '/leonida'])
const HASH_SCROLL_CORRECTION_DELAYS = [450, 900]
const DEFAULT_ROUTE_COMPONENTS = {
  AuthModal,
  AboutPage,
  LeonidaGuidePage,
  LeonidaHub,
  LocationGuidePage,
  MessagesPage,
  NewsArticlePage,
  P2PTradingPage,
  ProfilePage,
  SettingsPage,
  ShopPage,
  SocialHub,
  UserProfilePage,
}

function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      Loading...
    </div>
  )
}

function LazyRoute({ children }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      {children}
    </Suspense>
  )
}

function LazyAuthModal({ open, onClose, Component = AuthModal }) {
  if (!open) return null

  return (
    <Suspense fallback={null}>
      <Component onClose={onClose} />
    </Suspense>
  )
}

function getFixedHeaderOffset() {
  const headerHeight = document.querySelector('.navbar')?.getBoundingClientRect().height || 0
  return Math.ceil(headerHeight + 16)
}

function getHashScrollTarget(hash) {
  const section = document.getElementById(hash.slice(1))
  return section?.querySelector('.section-title') || section
}

function scrollHashTargetIntoView(hash, behavior) {
  const target = getHashScrollTarget(hash)
  if (!target) return false

  const targetTop = target.getBoundingClientRect().top + window.scrollY - getFixedHeaderOffset()
  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior,
  })
  return true
}

function scrollToHash(hash) {
  if (!hash) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  let attemptCount = 0
  const tryInitialScroll = () => {
    attemptCount += 1
    if (scrollHashTargetIntoView(hash, 'smooth') || attemptCount >= 12) return
    window.requestAnimationFrame(tryInitialScroll)
  }

  window.requestAnimationFrame(tryInitialScroll)
  HASH_SCROLL_CORRECTION_DELAYS.forEach((delay) => {
    window.setTimeout(() => scrollHashTargetIntoView(hash, 'auto'), delay)
  })
}

function currentRoute(fallbackRoute = '/') {
  if (typeof window === 'undefined') return fallbackRoute

  const { pathname } = window.location
  if (APP_ROUTES.has(pathname)) return pathname
  if (pathname.startsWith('/leonida/')) return pathname
  if (pathname.startsWith('/profile/')) return pathname
  if (pathname.startsWith('/locations/')) return pathname
  if (pathname.startsWith('/news/')) return pathname
  return '/'
}

function AppContent({ initialRoute = '/', routeComponents = DEFAULT_ROUTE_COMPONENTS }) {
  const [authOpen, setAuthOpen] = useState(false)
  const [route, setRoute] = useState(() => currentRoute(initialRoute))
  const [cartItems, setCartItems] = useState([])
  const appliedPreferencesUserIdRef = useRef('')
  const {
    accountSettings,
    accountSettingsLoading,
    currentProfile,
    isSignedIn,
    logout,
    state,
  } = useSocial()
  const { lang, setLang } = useTranslation()
  const { applyAccountPreferences } = usePreferences()
  const {
    AuthModal: AuthModalComponent,
    AboutPage: AboutPageComponent,
    LeonidaGuidePage: LeonidaGuidePageComponent,
    LeonidaHub: LeonidaHubComponent,
    LocationGuidePage: LocationGuidePageComponent,
    MessagesPage: MessagesPageComponent,
    NewsArticlePage: NewsArticlePageComponent,
    P2PTradingPage: P2PTradingPageComponent,
    ProfilePage: ProfilePageComponent,
    SettingsPage: SettingsPageComponent,
    ShopPage: ShopPageComponent,
    SocialHub: SocialHubComponent,
    UserProfilePage: UserProfilePageComponent,
  } = routeComponents
  const seoMetadata = useMemo(
    () => createSeoMetadata({ route, state, currentProfile }),
    [currentProfile, route, state],
  )

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = currentRoute()
      setRoute(nextRoute)
      logAnalyticsPageView()
      if (window.location.hash) scrollToHash(window.location.hash)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (window.location.hash) scrollToHash(window.location.hash)
  }, [route])

  useEffect(() => {
    const userId = currentProfile?.id || ''
    if (!isSignedIn) {
      appliedPreferencesUserIdRef.current = ''
      return
    }
    if (accountSettingsLoading || !userId || appliedPreferencesUserIdRef.current === userId) return

    appliedPreferencesUserIdRef.current = userId
    applyAccountPreferences(accountSettings)
    if (accountSettings.preferredLanguage && accountSettings.preferredLanguage !== lang) {
      setLang(accountSettings.preferredLanguage)
    }
  }, [accountSettings, accountSettingsLoading, applyAccountPreferences, currentProfile?.id, isSignedIn, lang, setLang])

  const navigateTo = (href) => {
    const nextUrl = new URL(href, window.location.origin)
    const isKnown = APP_ROUTES.has(nextUrl.pathname)
      || nextUrl.pathname.startsWith('/leonida/')
      || nextUrl.pathname.startsWith('/profile/')
      || nextUrl.pathname.startsWith('/locations/')
      || nextUrl.pathname.startsWith('/news/')
    const nextRoute = isKnown ? nextUrl.pathname : '/'

    window.history.pushState(null, '', `${nextUrl.pathname}${nextUrl.hash}`)
    setRoute(nextRoute)
    logAnalyticsPageView(`${nextUrl.pathname}${nextUrl.hash}`)
    scrollToHash(nextUrl.hash)
  }

  const addCartItem = (product) => {
    setCartItems((items) => {
      if (items.some((item) => item.id === product.id)) return items
      return [...items, product]
    })
  }

  const removeCartItem = (productId) => {
    setCartItems((items) => items.filter((item) => item.id !== productId))
  }

  const cartTotal = shopCentsToPrice(
    cartItems.reduce((total, item) => total + shopPriceToCents(item.price), 0),
  )

  const sharedHeaderProps = {
    routePath: route,
    currentUser: currentProfile,
    onOpenAuth: () => setAuthOpen(true),
    onOpenSettings: () => navigateTo('/settings'),
    onLogout: logout,
    onNavigate: navigateTo,
    cartItems,
    cartTotal,
    onRemoveCartItem: removeCartItem,
    settingsOpen: route === '/settings',
  }
  const overlays = (
    <LazyAuthModal open={authOpen} onClose={() => setAuthOpen(false)} Component={AuthModalComponent} />
  )

  if (route === '/community') {
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <SocialHubComponent onOpenAuth={() => setAuthOpen(true)} onNavigate={navigateTo} />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route.startsWith('/profile/')) {
    const userId = route.slice('/profile/'.length)
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <UserProfilePageComponent userId={userId} onNavigate={navigateTo} onOpenAuth={() => setAuthOpen(true)} />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route === '/about') {
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <AboutPageComponent />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route === '/leonida') {
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <LeonidaHubComponent onNavigate={navigateTo} />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route.startsWith('/leonida/locations/')) {
    const locationSlug = route.slice('/leonida/locations/'.length)
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <LocationGuidePageComponent locationSlug={locationSlug} onNavigate={navigateTo} />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route.startsWith('/leonida/')) {
    const sectionId = route.slice('/leonida/'.length)
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <LeonidaGuidePageComponent sectionId={sectionId} onNavigate={navigateTo} />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route.startsWith('/locations/')) {
    const locationSlug = route.slice('/locations/'.length)
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <LocationGuidePageComponent locationSlug={locationSlug} onNavigate={navigateTo} />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route === '/news') {
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <NewsSection onNavigate={navigateTo} />
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route.startsWith('/news/')) {
    const newsSlug = route.slice('/news/'.length)
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <NewsArticlePageComponent slug={newsSlug} onNavigate={navigateTo} />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route === '/shop') {
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <ShopPageComponent
              cartItems={cartItems}
              cartTotal={cartTotal}
              onAddCartItem={addCartItem}
              onRemoveCartItem={removeCartItem}
            />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route === '/settings') {
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <SettingsPageComponent onOpenAuth={() => setAuthOpen(true)} onNavigate={navigateTo} />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route === '/' || route === '/p2p') {
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <P2PTradingPageComponent onOpenAuth={() => setAuthOpen(true)} />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route === '/messages') {
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <MessagesPageComponent onOpenAuth={() => setAuthOpen(true)} onNavigate={navigateTo} />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  if (route === '/profile') {
    return (
      <div className="app">
        <SeoHead metadata={seoMetadata} lang={lang} />
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LazyRoute>
            <ProfilePageComponent
              onOpenAuth={() => setAuthOpen(true)}
              onOpenSettings={() => navigateTo('/settings')}
              onNavigate={navigateTo}
            />
          </LazyRoute>
        </main>
        <Footer />
        {overlays}
      </div>
    )
  }

  return (
    <div className="app">
      <SeoHead metadata={seoMetadata} lang={lang} />
      <Header {...sharedHeaderProps} solid />
      <main className="page-main">
        <LazyRoute>
          <P2PTradingPageComponent onOpenAuth={() => setAuthOpen(true)} />
        </LazyRoute>
      </main>
      <Footer />
      {overlays}
    </div>
  )
}

function App({ initialRoute = '/', initialLang = 'en', routeComponents }) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <PreferencesProvider>
        <SocialProvider>
          <AppContent initialRoute={initialRoute} routeComponents={routeComponents} />
        </SocialProvider>
      </PreferencesProvider>
    </LanguageProvider>
  )
}

export default App
