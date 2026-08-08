import { Link } from "react-router-dom";

/**
 * Zeros are worse than nothing.
 *
 * A dashboard full of 0% and "—" reads as broken rather than empty, so before
 * there's data we say what to do instead of rendering an accurate but
 * demoralising set of nulls.
 */
export default function EmptyAnalytics({ title, body, cta }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white/50 px-6 py-20 text-center">
      <p className="font-display text-[19px] font-600">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[14px] text-muted">{body}</p>
      {cta && (
        <Link
          to={cta.to}
          className="mt-5 inline-block rounded-lg bg-accent px-4 py-2.5 text-[15px] font-medium text-white hover:bg-accent/90"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}