import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { signOut } from "@/lib/auth";

export default function Navbar() {
  const { session } = useAuth();
  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto mt-3 max-w-6xl px-4">
        <div className="glass flex items-center justify-between px-6 py-3">
          <Link to="/" className="font-bold tracking-tight text-xl">JobPortal</Link>
          <nav className="flex items-center gap-4 text-white/90">
            <Link to="/jobs" className="hover:underline">Jobs</Link>
            <Link to="/company" className="hover:underline">Company</Link>
            {session ? (
              <button className="cta" onClick={() => signOut()}>Sign out</button>
            ) : (
              <>
                <Link to="/signin" className="cta">Sign in</Link>
                <Link to="/signup" className="cta">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
