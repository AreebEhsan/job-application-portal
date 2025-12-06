import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getWhoAmI } from '@/lib/profile'

const ProfileContext = createContext({ profile: null, loading: true, refreshProfile: async () => {} })

export function ProfileProvider({ children }) {
  const { session, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (currentSession) => {
    if (!currentSession) {
      setProfile(null)
      setLoading(false)
      return
    }
    try {
      const who = await getWhoAmI()
      // Debug: inspect what the server thinks our profile is
      // eslint-disable-next-line no-console
      console.log('ProfileContext.loadProfile whoami():', who)
      setProfile(who)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load profile via whoami()', error)
      setProfile(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    if (!session) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    loadProfile(session)
  }, [session, authLoading])

  const refreshProfile = async () => {
    if (!session) return
    setLoading(true)
    await loadProfile(session)
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => useContext(ProfileContext)
