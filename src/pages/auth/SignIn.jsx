import { useEffect, useState } from 'react'
import { signIn } from '@/lib/auth'
import { Link, useNavigate } from 'react-router-dom'
import { getWhoAmI } from '@/lib/profile'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/hooks/useProfile'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { session } = useAuth()
  const { profile } = useProfile()

  // If already signed in, send to correct dashboard
  useEffect(() => {
    if (!session || !profile) return
    if (profile.role === 'applicant') navigate('/applicant', { replace: true })
    else if (profile.role === 'recruiter') navigate('/company', { replace: true })
  }, [session, profile, navigate])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      let who = null
      try {
        who = await getWhoAmI()
      } catch (_err) {
        // If whoami fails, fall back to role selection
      }
      if (!who) {
        navigate('/select-role', { replace: true })
      } else if (who.role === 'applicant') {
        navigate('/applicant/dashboard', { replace: true })
      } else if (who.role === 'recruiter') {
        navigate('/company/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          className="input"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="input"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-black text-white w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-sm">No account? <Link className="underline" to="/signup">Sign up</Link></p>
    </div>
  )
}
