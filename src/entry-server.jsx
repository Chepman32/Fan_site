/* eslint-disable react-refresh/only-export-components */
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import AuthModal from './components/AuthModal'
import AboutPage from './components/AboutPage'
import GuidePage from './components/GuidePage'
import HomePage from './components/HomePage'
import LeonidaGuidePage from './components/LeonidaGuidePage'
import LeonidaHub from './components/LeonidaHub'
import LocationGuidePage from './components/LocationGuidePage'
import MarketplaceListingPage from './components/MarketplaceListingPage'
import MessagesPage from './components/MessagesPage'
import NewsArticlePage from './components/NewsArticlePage'
import P2PTradingPage from './components/P2PTradingPage'
import ProfilePage from './components/ProfilePage'
import SettingsPage from './components/SettingsPage'
import ShopPage from './components/ShopPage'
import ShopProductPage from './components/ShopProductPage'
import SocialHub from './components/SocialHub'
import TrustPage from './components/TrustPage'
import UserProfilePage from './components/UserProfilePage'
import {
  NOINDEX_PRERENDER_ROUTES,
  PRERENDER_ROUTES,
  SITEMAP_ROUTES,
  SITE_ORIGIN,
  canonicalPath,
  createSeoMetadata,
  createStaticSeoHead,
} from './seo/seoConfig'
import { indexableSeoRoutes } from './seo/routes'

const routeComponents = {
  AuthModal,
  AboutPage,
  GuidePage,
  HomePage,
  LeonidaGuidePage,
  LeonidaHub,
  LocationGuidePage,
  MarketplaceListingPage,
  MessagesPage,
  NewsArticlePage,
  P2PTradingPage,
  ProfilePage,
  SettingsPage,
  ShopPage,
  ShopProductPage,
  SocialHub,
  TrustPage,
  UserProfilePage,
}

export {
  NOINDEX_PRERENDER_ROUTES,
  PRERENDER_ROUTES,
  SITEMAP_ROUTES,
  SITE_ORIGIN,
  indexableSeoRoutes,
}

export function render(route = '/') {
  const cleanRoute = canonicalPath(route)
  const metadata = createSeoMetadata({ route: cleanRoute })
  const html = renderToString(
    <StrictMode>
      <App initialRoute={cleanRoute} initialLang="en" routeComponents={routeComponents} />
    </StrictMode>,
  )

  return {
    html,
    metadata,
    head: createStaticSeoHead(metadata),
  }
}
