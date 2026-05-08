import { Gamepad2, Heart, ExternalLink } from 'lucide-react'
import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <Gamepad2 size={24} className="footer-icon" />
              <span>GTA VI <span className="highlight">HUB</span></span>
            </div>
            <p className="footer-description">
              An unofficial fan site dedicated to Grand Theft Auto VI. 
              All game content and trademarks are property of Rockstar Games.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Game</h4>
              <a href="#game-info">About</a>
              <a href="#characters">Characters</a>
              <a href="#media">Media</a>
            </div>
            <div className="footer-column">
              <h4>Official</h4>
              <a href="https://www.rockstargames.com/VI" target="_blank" rel="noopener noreferrer">
                Rockstar Games <ExternalLink size={12} />
              </a>
              <a href="https://www.rockstargames.com/newswire" target="_blank" rel="noopener noreferrer">
                Newswire <ExternalLink size={12} />
              </a>
              <a href="https://socialclub.rockstargames.com/" target="_blank" rel="noopener noreferrer">
                Social Club <ExternalLink size={12} />
              </a>
            </div>
            <div className="footer-column">
              <h4>Community</h4>
              <a href="https://www.reddit.com/r/GTA6/" target="_blank" rel="noopener noreferrer">
                r/GTA6 <ExternalLink size={12} />
              </a>
              <a href="https://www.reddit.com/r/GrandTheftAutoVI/" target="_blank" rel="noopener noreferrer">
                r/GrandTheftAutoVI <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            Made with <Heart size={14} className="heart-icon" /> by fans • {currentYear}
          </p>
          <p className="footer-disclaimer">
            This is a fan-made project. Not affiliated with Rockstar Games or Take-Two Interactive.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
