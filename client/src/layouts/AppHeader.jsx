import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// shared header for signed-in pages (dashboard, profile, resumes, jobs, company)
export default function AppHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/dashboard" className="font-display text-lg font-600 tracking-tight">
          CareerBridge<span className="text-accent">.</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium text-muted">
          {user?.role === "candidate" && (
            <>

            <Link to="/jobs" className="hover:text-ink transition-colors">
                Find jobs
              </Link>
              <Link to="/candidate/saved" className="hover:text-ink transition-colors">
                Saved
              </Link>
              <Link to="/candidate/profile" className="hover:text-ink transition-colors">
                My profile
              </Link>
              <Link to="/candidate/resumes" className="hover:text-ink transition-colors">
                My resumes
              </Link>
            </>
          )}
          {(user?.role === "recruiter" || user?.role === "company_admin") && (
            <>
              <Link to="/recruiter/jobs" className="hover:text-ink transition-colors">
                Jobs
              </Link>
              <Link to="/company" className="hover:text-ink transition-colors">
                Company
              </Link>
            </>
          )}
          <button
            onClick={logout}
            className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink hover:border-ink/30 transition-colors"
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}