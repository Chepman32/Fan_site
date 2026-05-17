import { useEffect, useState } from 'react'
import Hero from './components/Hero'
import GameInfo from './components/GameInfo'
import Characters from './components/Characters'
import IgnGuideSections from './components/IgnGuide'
import MediaGallery from './components/MediaGallery'
import LeonidaLocations from './components/LeonidaLocations'
import LocationGuidePage from './components/LocationGuidePage'
import NewsSection from './components/NewsSection'
import SocialHub from './components/SocialHub'
import ShopPage from './components/ShopPage'
import Header from './components/Header'
import ProfilePage from './components/ProfilePage'
import UserProfilePage from './components/UserProfilePage'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'
import { logAnalyticsPageView } from './firebase/firebaseClient'
import { SocialProvider, useSocial } from './social/SocialContext'
import { LanguageProvider } from './i18n/useTranslation.jsx'
import { shopCentsToPrice, shopPriceToCents } from './shop/shopData'
import './App.css'

const APP_ROUTES = new Set(['/community', '/profile', '/shop'])
const HASH_SCROLL_CORRECTION_DELAYS = [450, 900]

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

function currentRoute() {
  const { pathname } = window.location
  if (APP_ROUTES.has(pathname)) return pathname
  if (pathname.startsWith('/profile/')) return pathname
  if (pathname.startsWith('/locations/')) return pathname
  return '/'
}

function AppContent() {
  const [authOpen, setAuthOpen] = useState(false)
  const [route, setRoute] = useState(currentRoute)
  const [cartItems, setCartItems] = useState([])
  const { currentProfile, logout } = useSocial()

  useEffect(() => {
    const handlePopState = () => {
      const nextRoute = currentRoute()
      setRoute(nextRoute)
      logAnalyticsPageView()
      if (nextRoute === '/') scrollToHash(window.location.hash)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (route === '/' && window.location.hash) scrollToHash(window.location.hash)
  }, [route])

  const navigateTo = (href) => {
    const nextUrl = new URL(href, window.location.origin)
    const isKnown = APP_ROUTES.has(nextUrl.pathname)
      || nextUrl.pathname.startsWith('/profile/')
      || nextUrl.pathname.startsWith('/locations/')
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
    currentUser: currentProfile,
    onOpenAuth: () => setAuthOpen(true),
    onLogout: logout,
    onNavigate: navigateTo,
    cartItems,
    cartTotal,
    onRemoveCartItem: removeCartItem,
  }

  if (route === '/community') {
    return (
      <div className="app">
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <SocialHub onOpenAuth={() => setAuthOpen(true)} onNavigate={navigateTo} />
        </main>
        <Footer />
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </div>
    )
  }

  if (route.startsWith('/profile/')) {
    const userId = route.slice('/profile/'.length)
    return (
      <div className="app">
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <UserProfilePage userId={userId} onNavigate={navigateTo} onOpenAuth={() => setAuthOpen(true)} />
        </main>
        <Footer />
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </div>
    )
  }

  if (route.startsWith('/locations/')) {
    const locationSlug = route.slice('/locations/'.length)
    return (
      <div className="app">
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <LocationGuidePage locationSlug={locationSlug} onNavigate={navigateTo} />
        </main>
        <Footer />
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </div>
    )
  }

  if (route === '/shop') {
    return (
      <div className="app">
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <ShopPage
            cartItems={cartItems}
            cartTotal={cartTotal}
            onAddCartItem={addCartItem}
            onRemoveCartItem={removeCartItem}
          />
        </main>
        <Footer />
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </div>
    )
  }

  if (route === '/profile') {
    return (
      <div className="app">
        <Header {...sharedHeaderProps} solid />
        <main className="page-main">
          <ProfilePage onOpenAuth={() => setAuthOpen(true)} onNavigate={navigateTo} />
        </main>
        <Footer />
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </div>
    )
  }

  return (
    <div className="app">
      <Hero
        currentUser={currentProfile}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={logout}
        onNavigate={navigateTo}
        cartItems={cartItems}
        cartTotal={cartTotal}
        onRemoveCartItem={removeCartItem}
      />
      <GameInfo />
      <Characters />
      <IgnGuideSections />
      <MediaGallery />
      <LeonidaLocations onNavigate={navigateTo} />
      <NewsSection />
      <Footer />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <SocialProvider>
        <AppContent />
      </SocialProvider>
    </LanguageProvider>
  )
}

export default App
