import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resendVerificationRequest } from "../features/auth/api/authApi";
import AppHeader from "../layouts/AppHeader";

export default function Dashboard() {
  const { user } = useAuth();
  const [resendState, setResendState] = useState("idle"); // idle | sending | sent

  const handleResend = async () => {
    setResendState("sending");
    try {
      await resendVerificationRequest(user.email);
    } finally {
      setResendState("sent");
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-6 py-14 rise">
        {!user?.isEmailVerified && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent/25 bg-accent/[0.04] px-4 py-3 text-[14px]">
            <span>Verify your email to unlock everything. Check your inbox — or the server console in dev.</span>
            <button
              onClick={handleResend}
              disabled={resendState !== "idle"}
              className="font-medium text-accent hover:underline disabled:opacity-60"
            >
              {resendState === "idle" && "Resend link"}
              {resendState === "sending" && "Sending…"}
              {resendState === "sent" && "Sent!"}
            </button>
          </div>
        )}

        <p className="eyebrow text-muted">Signed in as {user?.role.replace("_", " ")}</p>
        <h1 className="mt-3 font-display text-[38px] font-600 leading-tight tracking-[-0.02em]">
          Welcome, {user?.fullName?.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted">
          {user?.role === "candidate" && "Build your profile so recruiters can find you."}
          {(user?.role === "recruiter" || user?.role === "company_admin") &&
            (user?.companyId ? "Manage your company and start hiring." : "Set up your company to get started.")}
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {user?.role === "candidate" && (
            <Link to="/candidate/profile" className="rounded-lg bg-accent px-5 py-2.5 text-[14px] font-medium text-white hover:bg-accent/90 transition-colors">
              Edit my profile
            </Link>
          )}
          {(user?.role === "recruiter" || user?.role === "company_admin") && (
            <Link to="/company" className="rounded-lg bg-accent px-5 py-2.5 text-[14px] font-medium text-white hover:bg-accent/90 transition-colors">
              {user?.companyId ? "View company" : "Set up company"}
            </Link>
          )}
        </div>

        <dl className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          {[
            ["Email", user?.email],
            ["Role", user?.role],
            ["Email verified", user?.isEmailVerified ? "Yes" : "Not yet"],
          ].map(([label, value]) => (
            <div key={label} className="bg-white px-5 py-4">
              <dt className="eyebrow text-muted">{label}</dt>
              <dd className="mt-1.5 truncate text-[15px]">{value}</dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
