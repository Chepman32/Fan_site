import { useState } from 'react'
import Hero from './components/Hero'
import GameInfo from './components/GameInfo'
import Characters from './components/Characters'
import MediaGallery from './components/MediaGallery'
import LeonidaLocations from './components/LeonidaLocations'
import NewsSection from './components/NewsSection'
import SocialHub from './components/SocialHub'
import AuthModal from './components/AuthModal'
import Footer from './components/Footer'
import { SocialProvider, useSocial } from './social/SocialContext'
import './App.css'

function AppContent() {
  const [authOpen, setAuthOpen] = useState(false)
  const { currentProfile, logout } = useSocial()

  return (
    <div className="app">
      <Hero
        currentUser={currentProfile}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={logout}
      />
      <GameInfo />
      <Characters />
      <MediaGallery />
      <LeonidaLocations />
      <NewsSection />
      <SocialHub onOpenAuth={() => setAuthOpen(true)} />
      <Footer />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  )
}

function App() {
  return (
    <SocialProvider>
      <AppContent />
    </SocialProvider>
  )
}

export default App
