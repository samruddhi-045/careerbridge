import { useState } from "react";

// Small shared primitives for the builder. Kept in one file because none of
// them are useful outside it.

export const uid = () => Math.random().toString(36).slice(2, 10);

const arrow = "h-3.5 w-3.5";

function MoveButtons({ onMoveUp, onMoveDown, label }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!onMoveUp}
        aria-label={`Move ${label} up`}
        className="rounded-md border border-line p-1.5 text-muted transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-30 disabled:hover:border-line"
      >
        <svg className={arrow} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={!onMoveDown}
        aria-label={`Move ${label} down`}
        className="rounded-md border border-line p-1.5 text-muted transition-colors hover:border-ink/30 hover:text-ink disabled:opacity-30 disabled:hover:border-line"
      >
        <svg className={arrow} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 3v10M8 13l4.5-4.5M8 13L3.5 8.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

/** A whole resume section (Experience, Projects, ...) */
export function SectionCard({ title, subtitle, onMoveUp, onMoveDown, children }) {
  return (
    <section className="rounded-xl border border-line bg-white">
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display text-[17px] font-600 tracking-[-0.01em]">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
        </div>
        <MoveButtons onMoveUp={onMoveUp} onMoveDown={onMoveDown} label={title} />
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

/** One repeatable entry inside a section (one job, one project, ...) */
export function EntryCard({ label, onRemove, onMoveUp, onMoveDown, children }) {
  return (
    <div className="rounded-lg border border-line/80 bg-paper/40 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="eyebrow text-muted">{label}</span>
        <div className="flex items-center gap-2">
          <MoveButtons onMoveUp={onMoveUp} onMoveDown={onMoveDown} label={label} />
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md border border-line px-2.5 py-1 text-[13px] font-medium text-danger transition-colors hover:border-danger/40"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg border border-dashed border-line py-2.5 text-[14px] font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent"
    >
      {children}
    </button>
  );
}

export function EmptyHint({ children }) {
  return <p className="mb-4 text-[14px] text-muted">{children}</p>;
}

/**
 * Bullets are edited as individual rows, not one textarea, because that's how
 * they're stored -- and in Phase 4 "rewrite this bullet" needs to address one.
 */
export function BulletList({ bullets = [], onChange, placeholder }) {
  const update = (i, text) => onChange(bullets.map((b, idx) => (idx === i ? text : b)));
  const remove = (i) => onChange(bullets.filter((_, idx) => idx !== i));
  const add = () => onChange([...bullets, ""]);

  return (
    <div>
      <span className="text-sm font-medium text-ink">Bullet points</span>
      <div className="mt-1.5 space-y-2">
        {bullets.map((bullet, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-muted/50" />
            <textarea
              rows={2}
              value={bullet}
              placeholder={placeholder}
              onChange={(e) => update(i, e.target.value)}
              className="flex-1 resize-y rounded-lg border border-line bg-white px-3 py-2 text-[14px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove bullet"
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
        + Add bullet
      </button>
    </div>
  );
}

/** Chip input for skills and tech stacks. Enter or comma commits a value. */
export function TagInput({ label, items = [], onChange, placeholder }) {
  const [text, setText] = useState("");

  const commit = () => {
    const value = text.trim().replace(/,$/, "");
    if (!value) return;
    if (!items.includes(value)) onChange([...items, value]);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    }
    // Backspace on an empty input removes the last chip -- standard behaviour
    // people expect from tag fields.
    if (e.key === "Backspace" && !text && items.length) {
      onChange(items.slice(0, -1));
    }
  };

  return (
    <div>
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-1 text-[13px] font-medium text-accent"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((x) => x !== item))}
              aria-label={`Remove ${item}`}
              className="text-accent/60 hover:text-accent"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commit}
          placeholder={items.length ? "" : placeholder}
          className="min-w-[120px] flex-1 bg-transparent py-0.5 text-[14px] focus:outline-none"
        />
      </div>
      <p className="mt-1.5 text-[13px] text-muted">Press Enter after each one.</p>
    </div>
  );
}