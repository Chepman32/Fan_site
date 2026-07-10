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

function scheduleInitialPageView() {
  if (typeof window === 'undefined') return

  const scheduleIdle = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => logAnalyticsPageView(), { timeout: 5000 })
      return
    }

    window.setTimeout(() => logAnalyticsPageView(), 2500)
  }

  if (document.readyState === 'complete') {
    scheduleIdle()
  } else {
    window.addEventListener('load', scheduleIdle, { once: true })
  }
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

scheduleInitialPageView()
registerServiceWorker()
