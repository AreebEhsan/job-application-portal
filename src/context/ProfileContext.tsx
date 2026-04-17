/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getWhoAmI } from '@/lib/profile'
import type { Profile } from '@/lib/types'

interface ProfileContextValue {
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

export const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
})

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    try {
      const who = await getWhoAmI()
      setProfile(who)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!session) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    void loadProfile()
  }, [session, authLoading, loadProfile])

  const refreshProfile = useCallback(async () => {
    if (!session) return
    setLoading(true)
    await loadProfile()
  }, [session, loadProfile])

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}
