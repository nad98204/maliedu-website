import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary';

import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)

window.__MALI_MARK_APP_MOUNTED__?.()

window.setTimeout(() => {
  if (window.__MALI_ASSET_RECOVERY_ACTIVE__) return

  try {
    sessionStorage.removeItem('mali_dynamic_import_retry_v1')
  } catch {
    // Rendering must not depend on browser storage being available.
  }
}, 30_000)
