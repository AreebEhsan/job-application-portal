import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";
import { useProfile } from "@/context/ProfileContext";

export default function Navbar() {
  const { session } = useAuth();
  const { profile } = useProfile();
  const isApplicant = !!(session && profile?.role === 'applicant');
  const isRecruiter = !!(session && profile?.role === 'recruiter');
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Click outside to close
  useEffect(() => {
    const onClick = (e) => {
      if (open && panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const linkBase =
    "px-2 py-1 rounded-md text-sm transition focus:outline-none focus:ring-2 focus:ring-white/40";
  const linkIdle = "text-white/80 hover:text-white";
  const linkActive = "text-white bg-white/10";

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-6xl">
      <div className="glass px-4 md:px-6 py-3 flex items-center justify-between shadow-lg">
        {/* Brand */}
        <Link to="/" className="font-bold text-white text-lg md:text-xl tracking-tight">
          JobWise
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/jobs" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
            Jobs
          </NavLink>

          {/* Role-aware links */}
          {!session && (
            <NavLink to="/company" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
              Company
            </NavLink>
          )}

          {session && isApplicant && (
            <NavLink to="/applicant" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
              My Applications
            </NavLink>
          )}

          {session && isRecruiter && (
            <>
              <NavLink to="/company" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
                Company
              </NavLink>
              <NavLink
                to="/company/post"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : "text-white bg-white/10 hover:bg-white/20"}`
                }
              >
                Post Job
              </NavLink>
            </>
          )}

          {/* Auth actions */}
          {session ? (
            <button type="button" onClick={() => signOut()} className={`${linkBase} ${linkIdle}`}>
              Sign out
            </button>
          ) : (
            <>
              <NavLink to="/signin" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}>
                Sign in
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : "text-white bg-white/10 hover:bg-white/20"}`
                }
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
          onClick={() => setOpen((v) => !v)}
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
          <NavLink to="/jobs" onClick={() => setOpen(false)} className={({ isActive }) => `block ${linkBase} ${isActive ? linkActive : linkIdle}`}>
            Jobs
          </NavLink>
          {/* Role-aware links */}
          <NavLink
            to="/jobs"
            onClick={() => setOpen(false)}
            className={({ isActive }) => `block ${linkBase} ${isActive ? linkActive : linkIdle}`}
          >
            Jobs
          </NavLink>

          {!session && (
            <NavLink
              to="/company"
              onClick={() => setOpen(false)}
              className={({ isActive }) => `block ${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              Company
            </NavLink>
          )}

          {session && isApplicant && (
            <NavLink
              to="/applicant"
              onClick={() => setOpen(false)}
              className={({ isActive }) => `block ${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              My Applications
            </NavLink>
          )}

          {session && isRecruiter && (
            <>
              <NavLink
                to="/company"
                onClick={() => setOpen(false)}
                className={({ isActive }) => `block ${linkBase} ${isActive ? linkActive : linkIdle}`}
              >
                Company
              </NavLink>
              <NavLink
                to="/company/post"
                onClick={() => setOpen(false)}
                className={({ isActive }) => `block ${linkBase} ${isActive ? linkActive : linkIdle}`}
              >
                Post Job
              </NavLink>
            </>
          )}

          {session ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className={`text-left ${linkBase} ${linkIdle}`}
            >
              Sign out
            </button>
          ) : (
            <>
              <NavLink to="/signin" onClick={() => setOpen(false)} className={({ isActive }) => `block ${linkBase} ${isActive ? linkActive : linkIdle}`}>
                Login
              </NavLink>
              <NavLink
                to="/signup"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block ${linkBase} ${isActive ? linkActive : "text-white bg-white/10 hover:bg-white/20"}`
                }
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
