import { useAuth } from "../context/AuthContext";

// placeholder page just to show login/auth working, real dashboard comes later
export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-600 tracking-tight">
            CareerBridge<span className="text-accent">.</span>
          </span>
          <button
            onClick={logout}
            className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium hover:border-ink/30 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-14 rise">
        <p className="eyebrow text-muted">Signed in as {user?.role.replace("_", " ")}</p>
        <h1 className="mt-3 font-display text-[38px] font-600 leading-tight tracking-[-0.02em]">
          Welcome, {user?.fullName?.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted">
          Authentication is working. Your dashboard gets built in the next phase.
        </p>

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