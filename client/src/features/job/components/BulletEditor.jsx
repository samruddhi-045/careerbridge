/**
 * Repeatable one-line rows for responsibilities / requirements / nice-to-haves.
 *
 * These are stored as arrays rather than one textarea because Phase 4 matches a
 * resume against individual requirements -- "meets 4 of 6 requirements" is only
 * answerable when each one is its own string.
 */
export default function BulletEditor({ label, hint, items = [], onChange, placeholder }) {
  const update = (i, value) => onChange(items.map((x, idx) => (idx === i ? value : x)));
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);

  return (
    <div>
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint && <p className="mt-0.5 text-[13px] text-muted">{hint}</p>}

      <div className="mt-2 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-muted/50" />
            <textarea
              rows={2}
              value={item}
              placeholder={placeholder}
              onChange={(e) => update(i, e.target.value)}
              className="flex-1 resize-y rounded-lg border border-line bg-white px-3 py-2 text-[14px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label={`Remove ${label} item`}
              className="mt-1.5 rounded-md border border-line px-2 py-1.5 text-[13px] text-muted transition-colors hover:border-danger/40 hover:text-danger"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-2 text-[13px] font-medium text-accent hover:underline"
      >
        + Add {items.length ? "another" : "one"}
      </button>
    </div>
  );
}