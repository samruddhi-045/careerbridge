import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Header for pages a signed-out visitor can reach (job search, job detail).
 * Adapts rather than duplicating: signed in, it links back into the app;
 * signed out, it offers sign in / sign up.
 */
export default function PublicHeader() {
  const { user } = useAuth();

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="font-display text-lg font-600 tracking-tight">
          CareerBridge<span className="text-accent">.</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-muted">
          <Link to="/jobs" className="hover:text-ink transition-colors">
            Browse jobs
          </Link>

          {user ? (
            <>
              {user.role === "candidate" && (
                <Link to="/candidate/saved" className="hover:text-ink transition-colors">
                  Saved
                </Link>
              )}
              <Link
                to="/dashboard"
                className="rounded-lg bg-ink px-3.5 py-2 text-white transition-colors hover:bg-ink/90"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-ink transition-colors">
                Sign in
              </Link>
              <Link
                to="/signup/candidate"
                className="rounded-lg bg-accent px-3.5 py-2 text-white transition-colors hover:bg-accent/90"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}