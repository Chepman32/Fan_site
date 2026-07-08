import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { logAnalyticsPageView } from './firebase/firebaseClient'
import ErrorBoundary from './monitoring/ErrorBoundary.jsx'
import { installCriticalErrorLogging } from './monitoring/errorLogger'

installCriticalErrorLogging()

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
