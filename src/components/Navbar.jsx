import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { signOut } from '@/lib/auth'

export default function Navbar() {
  const { session } = useAuth()
  return (
    <nav className="border-b px-6 py-3 flex items-center justify-between">
      <Link to="/" className="font-bold">JobPortal</Link>
      <div className="flex gap-3 items-center">
        <Link to="/jobs">Jobs</Link>
        {session ? (
          <>
            <Link to="/applicant">My Dashboard</Link>
            <Link to="/company">Company</Link>
            <button onClick={() => signOut()} className="px-3 py-1 rounded-lg border">Sign out</button>
          </>
        ) : (
          <>
            <Link to="/signin">Sign in</Link>
            <Link to="/signup" className="px-3 py-1 rounded-lg bg-black text-white">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  )
}
