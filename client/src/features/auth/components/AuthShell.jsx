import { Link } from "react-router-dom";

// shared layout for login/signup pages, left side shows the steps for that role
export default function AuthShell({ eyebrow, steps = [], activeStep = 0, children }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[minmax(0,44%)_1fr]">
      {/* Left rail */}
      <aside className="relative flex flex-col justify-between bg-ink px-8 py-8 text-paper lg:px-12 lg:py-12">
        <Link to="/" className="font-display text-lg font-600 tracking-tight">
          CareerBridge<span className="text-accent">.</span>
        </Link>

        <div className="hidden lg:block">
          <p className="eyebrow text-paper/40">{eyebrow}</p>
          <ol className="mt-7 space-y-0">
            {steps.map((step, i) => {
              const active = i === activeStep;
              return (
                <li key={step} className="flex gap-4 rise" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] transition-colors
                        ${active ? "bg-accent text-white" : "border border-paper/20 text-paper/40"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {i < steps.length - 1 && <span className="my-1 w-px flex-1 bg-paper/15" />}
                  </div>
                  <span
                    className={`pb-7 pt-1 text-[15px] transition-colors ${
                      active ? "text-paper" : "text-paper/45"
                    }`}
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="hidden text-[13px] text-paper/35 lg:block">
          Built for candidates and hiring teams.
        </p>
      </aside>

      {/* Form side */}
      <main className="flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-[400px] rise">{children}</div>
      </main>
    </div>
  );
}