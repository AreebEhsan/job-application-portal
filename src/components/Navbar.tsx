import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/auth'
import { useState, useEffect, useRef } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { AnimatePresence, motion } from 'framer-motion'

export default function Navbar() {
  const { session } = useAuth()
  const { profile } = useProfile()
  const isApplicant = !!(session && profile?.role === 'applicant')
  const isRecruiter = !!(session && profile?.role === 'recruiter')
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

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

  const linkBase =
    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50'
  const idle   = 'text-white/65 hover:text-white hover:bg-white/8'
  const active = 'text-white bg-white/10'
  const cls    = ({ isActive }: { isActive: boolean }) => `${linkBase} ${isActive ? active : idle}`
  const blk    = ({ isActive }: { isActive: boolean }) => `block ${linkBase} ${isActive ? active : idle}`

  return (
    <header className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[94%] max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`glass px-4 md:px-6 py-2.5 flex items-center justify-between transition-all duration-300 ${
          scrolled ? 'shadow-navbar' : ''
        }`}
        style={scrolled ? { background: 'rgba(8,8,18,0.85)' } : {}}
      >
        {/* Logo */}
        <Link
          to="/"
          className="font-bold text-white text-lg tracking-tight flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50 rounded-md"
        >
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-black">
            J
          </span>
          <span className="text-gradient font-extrabold">JobWise</span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-1 text-sm">
          <NavLink to="/jobs" className={cls}>Jobs</NavLink>

          {!session && (
            <NavLink to="/company/dashboard" className={cls}>For Companies</NavLink>
          )}
          {session && isApplicant && (
            <NavLink to="/applicant/dashboard" className={cls}>My Applications</NavLink>
          )}
          {session && isRecruiter && (
            <>
              <NavLink to="/company/dashboard" className={cls}>Dashboard</NavLink>
              <NavLink
                to="/company/post"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? active : 'text-violet-300 bg-violet-600/15 border border-violet-500/25 hover:bg-violet-600/25'}`
                }
              >
                Post Job
              </NavLink>
            </>
          )}
        </nav>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-2">
          {session ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className={`${linkBase} ${idle}`}
            >
              Sign out
            </button>
          ) : (
            <>
              <NavLink to="/signin" className={cls}>Sign in</NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? active : 'btn-primary px-4 py-1.5'}`
                }
              >
                Get started
              </NavLink>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          className="md:hidden w-9 h-9 rounded-lg bg-white/8 border border-white/10 text-white flex items-center justify-center hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </motion.div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            key="mobile-menu"
            initial={{ opacity: 0, y: -8, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.96 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top' }}
            className="md:hidden mt-2 glass px-3 py-2.5 flex flex-col gap-0.5"
            role="dialog"
            aria-modal="true"
          >
            <NavLink to="/jobs" onClick={() => setOpen(false)} className={blk}>Jobs</NavLink>
            {!session && (
              <NavLink to="/company/dashboard" onClick={() => setOpen(false)} className={blk}>For Companies</NavLink>
            )}
            {session && isApplicant && (
              <NavLink to="/applicant/dashboard" onClick={() => setOpen(false)} className={blk}>My Applications</NavLink>
            )}
            {session && isRecruiter && (
              <>
                <NavLink to="/company/dashboard" onClick={() => setOpen(false)} className={blk}>Dashboard</NavLink>
                <NavLink to="/company/post" onClick={() => setOpen(false)} className={blk}>Post Job</NavLink>
              </>
            )}
            <div className="my-1 border-t border-white/8" />
            {session ? (
              <button
                type="button"
                onClick={() => { setOpen(false); void signOut() }}
                className={`text-left ${linkBase} ${idle}`}
              >
                Sign out
              </button>
            ) : (
              <>
                <NavLink to="/signin" onClick={() => setOpen(false)} className={blk}>Sign in</NavLink>
                <NavLink to="/signup" onClick={() => setOpen(false)} className={blk}>Register</NavLink>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
