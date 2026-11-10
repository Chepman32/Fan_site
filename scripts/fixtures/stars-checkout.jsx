// Only served by the isolated test server in test-stars-browser.mjs.
import { createRoot } from 'react-dom/client'
import { LanguageProvider } from '../../src/i18n/useTranslation.jsx'
import ShopCheckoutPanel from '../../src/components/ShopCheckoutPanel.jsx'
import StarsOrders from '../../src/components/StarsOrders.jsx'
import '../../src/index.css'

const guest = new URLSearchParams(window.location.search).has('guest')
createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <main style={{ maxWidth: 720, margin: 'auto', padding: 16, minHeight: '100vh' }}>
      <h1>Shop payment test</h1>
      <ShopCheckoutPanel cartItems={[{ id: 'overlay', title: 'Ocean View Kit', price: 2.6 }]} cartTotal={2.6}
        onOpenAuth={() => { document.getElementById('auth-result').textContent = 'Sign-in opened' }} />
      <p id="auth-result" role="status" />
      {!guest && <StarsOrders />}
    </main>
  </LanguageProvider>,
)
