/**
 * Applications per week. A bar chart hand-rolled rather than pulled from a
 * chart library — twelve bars and a hover label don't justify the dependency.
 */
export default function ActivityChart({ data }) {
  if (!data?.length) return null;

  const max = Math.max(...data.map((d) => d.count));

  const label = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div>
      <div className="flex h-[110px] items-end gap-1.5">
        {data.map((d) => (
          <div key={d.week} className="group relative flex-1">
            <div
              className="w-full rounded-t bg-accent/70 transition-colors group-hover:bg-accent"
              style={{ height: `${Math.max((d.count / max) * 100, 4)}%`, minHeight: "4px" }}
            />
            {/* Hover label rather than an axis — twelve dates along the bottom
                would be unreadable at this width. */}
            <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[12px] text-white group-hover:block">
              {d.count} · {label(d.week)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[12px] text-muted">
        <span>{label(data[0].week)}</span>
        <span>{label(data[data.length - 1].week)}</span>
      </div>
    </div>
  );
}