import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center rise">
      <p className="eyebrow text-muted">Job application portal</p>
      <h1 className="mt-4 font-display text-[44px] font-600 leading-[1.05] tracking-[-0.03em] sm:text-[56px]">
        CareerBridge<span className="text-accent">.</span>
      </h1>
      <p className="mt-4 max-w-md text-[16px] text-muted">
        Where candidates track every application, and hiring teams run one clean pipeline.
      </p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        {user ? (
          <Link to="/dashboard" className="rounded-lg bg-accent px-6 py-2.5 text-[15px] font-medium text-white hover:bg-accent/90 transition-colors">
            Go to dashboard
          </Link>
        ) : (
          <>
            <Link to="/signup/candidate" className="rounded-lg bg-accent px-6 py-2.5 text-[15px] font-medium text-white hover:bg-accent/90 transition-colors">
              Find a job
            </Link>
            <Link to="/signup/recruiter" className="rounded-lg border border-line bg-white px-6 py-2.5 text-[15px] font-medium hover:border-ink/30 transition-colors">
              Hire talent
            </Link>
            <Link to="/login" className="px-6 py-2.5 text-[15px] font-medium text-muted hover:text-ink transition-colors">
              Sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}