import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { logAnalyticsPageView } from './firebase/firebaseClient'
import ErrorBoundary from './monitoring/ErrorBoundary.jsx'
import { installCriticalErrorLogging } from './monitoring/errorLogger'

installCriticalErrorLogging()

function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

const rootElement = document.getElementById('root')
const app = (
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app)
} else {
  createRoot(rootElement).render(app)
}

logAnalyticsPageView()
registerServiceWorker()
