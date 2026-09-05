import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary';

import { HelmetProvider } from 'react-helmet-async';

const application = (
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
)

const root = document.getElementById('root')
if (document.querySelector('meta[name="landing-hydrated-html"]')) {
  hydrateRoot(root, application)
} else {
  createRoot(root).render(application)
}

window.__MALI_MARK_APP_MOUNTED__?.()

try {
  const mountedUrl = new URL(window.location.href)
  if (mountedUrl.searchParams.has('_asset_retry') || mountedUrl.searchParams.has('_asset_reset')) {
    mountedUrl.searchParams.delete('_asset_retry')
    mountedUrl.searchParams.delete('_asset_reset')
    window.history.replaceState(window.history.state, '', mountedUrl.toString())
  }
} catch {
  // URL cleanup is cosmetic and must never block the application.
}

window.setTimeout(() => {
  if (window.__MALI_ASSET_RECOVERY_ACTIVE__) return

  try {
    sessionStorage.removeItem('mali_dynamic_import_retry_v1')
  } catch {
    // Rendering must not depend on browser storage being available.
  }
}, 30_000)
