import Hero from './components/Hero'
import GameInfo from './components/GameInfo'
import Characters from './components/Characters'
import MediaGallery from './components/MediaGallery'
import NewsSection from './components/NewsSection'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <div className="app">
      <Hero />
      <GameInfo />
      <Characters />
      <MediaGallery />
      <NewsSection />
      <Footer />
    </div>
  )
}

export default App
