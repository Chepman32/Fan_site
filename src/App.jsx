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
import Header from './components/Header'
import ProfilePage from './components/ProfilePage'
import UserProfilePage from './components/UserProfilePage'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'
import { SocialProvider, useSocial } from './social/SocialContext'
import { LanguageProvider } from './i18n/useTranslation.jsx'
import './App.css'

const APP_ROUTES = new Set(['/community', '/profile'])

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
  const { currentProfile, logout } = useSocial()

  useEffect(() => {
    const handlePopState = () => setRoute(currentRoute())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const scrollToHash = (hash) => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    window.setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  const navigateTo = (href) => {
    const nextUrl = new URL(href, window.location.origin)
    const isKnown = APP_ROUTES.has(nextUrl.pathname)
      || nextUrl.pathname.startsWith('/profile/')
      || nextUrl.pathname.startsWith('/locations/')
    const nextRoute = isKnown ? nextUrl.pathname : '/'

    window.history.pushState(null, '', `${nextUrl.pathname}${nextUrl.hash}`)
    setRoute(nextRoute)
    scrollToHash(nextUrl.hash)
  }

  const sharedHeaderProps = {
    currentUser: currentProfile,
    onOpenAuth: () => setAuthOpen(true),
    onLogout: logout,
    onNavigate: navigateTo,
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
          <UserProfilePage userId={userId} onNavigate={navigateTo} />
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
