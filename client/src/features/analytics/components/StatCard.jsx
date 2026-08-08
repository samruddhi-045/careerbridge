/**
 * One headline number.
 *
 * `hint` matters more than it looks: a bare "23%" tells nobody whether that's
 * good. The context line is what turns a metric into something actionable.
 */
export default function StatCard({ label, value, suffix, hint, accent }) {
  const isEmpty = value === null || value === undefined;

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="eyebrow text-muted">{label}</p>
      <p
        className={`mt-2 font-display text-[30px] font-600 leading-none tracking-[-0.02em] ${
          accent ? "text-accent" : ""
        }`}
      >
        {isEmpty ? <span className="text-[20px] text-muted">—</span> : value}
        {!isEmpty && suffix && (
          <span className="ml-0.5 text-[17px] font-medium text-muted">{suffix}</span>
        )}
      </p>
      {hint && <p className="mt-2 text-[13px] leading-snug text-muted">{hint}</p>}
    </div>
  );
}