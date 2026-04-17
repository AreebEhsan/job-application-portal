import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'
import '@fontsource-variable/inter'
import './styles/globals.css'
import AppRouter from '@/routes'
import { AuthProvider } from '@/context/AuthContext'
import { ProfileProvider } from '@/context/ProfileContext'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  environment: import.meta.env.MODE,
  // Only initialize if a DSN is configured
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min — data is fresh for 1 minute before refetch
      gcTime: 1000 * 60 * 5, // 5 min cache retention after unmount
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Missing #root element')

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <AppRouter />
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
