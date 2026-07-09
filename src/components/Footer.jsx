import { Gamepad2, Heart, ExternalLink } from 'lucide-react'
import { useTranslation } from '../i18n/useTranslation.jsx'
import './Footer.css'

const TRUST_LINKS = [
  { href: '/buyer-protection', key: 'buyerProtection' },
  { href: '/seller-policy', key: 'sellerPolicy' },
  { href: '/refund-policy', key: 'refundPolicy' },
  { href: '/content-policy', key: 'contentPolicy' },
  { href: '/dmca', key: 'dmca' },
  { href: '/privacy', key: 'privacy' },
  { href: '/terms', key: 'terms' },
  { href: '/contact', key: 'contact' },
]

function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()
  const copyrightName = t.footer.copyrightName || 'Anton Chepur'

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <Gamepad2 size={24} className="footer-icon" />
              <span>GTA VI <span className="highlight">HUB</span></span>
            </div>
            <p className="footer-description">{t.footer.description}</p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>{t.footer.game}</h4>
              <a href="/about">{t.footer.about}</a>
              <a href="/leonida/characters">{t.footer.characters}</a>
              <a href="/leonida/locations">{t.nav.locations || 'Locations'}</a>
              <a href="/leonida/weapons">{t.nav.weapons || 'Weapons'}</a>
              <a href="/leonida/vehicles">{t.nav.vehicles || 'Vehicles'}</a>
              <a href="/leonida/social-media">{t.nav.socialMedia || 'Social Media'}</a>
              <a href="/leonida#field-guide">{t.footer.media}</a>
            </div>
            <div className="footer-column">
              <h4>{t.footer.official}</h4>
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
              <h4>{t.footer.coverage}</h4>
              <a href="https://www.ign.com/games/grand-theft-auto-vi" target="_blank" rel="noopener noreferrer">
                IGN GTA VI <ExternalLink size={12} />
              </a>
            </div>
            <div className="footer-column">
              <h4>{t.footer.trust}</h4>
              {TRUST_LINKS.map((link) => (
                <a key={link.href} href={link.href}>{t.footer[link.key]}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            {t.footer.madeByFans} <Heart size={14} className="heart-icon" /> {t.footer.byFans} • © {copyrightName} {currentYear}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
