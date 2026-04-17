import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { useState, useEffect, useRef } from 'react'
import { useProfile } from '@/hooks/useProfile'

export default function Navbar() {
  const { session } = useAuth()
  const { profile } = useProfile()
  const isApplicant = !!(session && profile?.role === 'applicant')
  const isRecruiter = !!(session && profile?.role === 'recruiter')
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (open && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const base = 'px-2 py-1 rounded-md text-sm transition focus:outline-none focus:ring-2 focus:ring-white/40'
  const idle = 'text-white/80 hover:text-white'
  const active = 'text-white bg-white/10'
  const cls = ({ isActive }: { isActive: boolean }) => `${base} ${isActive ? active : idle}`
  const blockCls = ({ isActive }: { isActive: boolean }) => `block ${base} ${isActive ? active : idle}`

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-6xl">
      <div className="glass px-4 md:px-6 py-3 flex items-center justify-between shadow-lg">
        <Link to="/" className="font-bold text-white text-lg md:text-xl tracking-tight">
          JobWise
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/jobs" className={cls}>Jobs</NavLink>

          {!session && (
            <NavLink to="/company/dashboard" className={cls}>Company</NavLink>
          )}
          {session && isApplicant && (
            <NavLink to="/applicant/dashboard" className={cls}>My Applications</NavLink>
          )}
          {session && isRecruiter && (
            <>
              <NavLink to="/company/dashboard" className={cls}>Company</NavLink>
              <NavLink
                to="/company/post"
                className={({ isActive }) => `${base} ${isActive ? active : 'text-white bg-white/10 hover:bg-white/20'}`}
              >
                Post Job
              </NavLink>
            </>
          )}

          {session ? (
            <button type="button" onClick={() => void signOut()} className={`${base} ${idle}`}>
              Sign out
            </button>
          ) : (
            <>
              <NavLink to="/signin" className={cls}>Sign in</NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) => `${base} ${isActive ? active : 'text-white bg-white/10 hover:bg-white/20'}`}
              >
                Register
              </NavLink>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md bg-white/10 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div
          ref={panelRef}
          className="md:hidden mt-2 glass px-4 py-3 flex flex-col gap-1 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
        >
          <NavLink to="/jobs" onClick={() => setOpen(false)} className={blockCls}>Jobs</NavLink>

          {!session && (
            <NavLink to="/company/dashboard" onClick={() => setOpen(false)} className={blockCls}>Company</NavLink>
          )}
          {session && isApplicant && (
            <NavLink to="/applicant/dashboard" onClick={() => setOpen(false)} className={blockCls}>
              My Applications
            </NavLink>
          )}
          {session && isRecruiter && (
            <>
              <NavLink to="/company/dashboard" onClick={() => setOpen(false)} className={blockCls}>Company</NavLink>
              <NavLink to="/company/post" onClick={() => setOpen(false)} className={blockCls}>Post Job</NavLink>
            </>
          )}

          {session ? (
            <button
              type="button"
              onClick={() => { setOpen(false); void signOut() }}
              className={`text-left ${base} ${idle}`}
            >
              Sign out
            </button>
          ) : (
            <>
              <NavLink to="/signin" onClick={() => setOpen(false)} className={blockCls}>Login</NavLink>
              <NavLink to="/signup" onClick={() => setOpen(false)} className={blockCls}>Register</NavLink>
            </>
          )}
        </div>
      )}
    </header>
  )
}
