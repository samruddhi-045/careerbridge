import { useState } from "react";

// Chip input. Enter or comma commits; backspace on an empty field removes the
// last chip, which is what people expect from tag fields.
export default function SkillsInput({ items = [], onChange }) {
  const [text, setText] = useState("");

  const commit = () => {
    const value = text.trim().replace(/,$/, "");
    if (!value) return;
    if (!items.some((s) => s.toLowerCase() === value.toLowerCase())) onChange([...items, value]);
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Backspace" && !text && items.length) onChange(items.slice(0, -1));
  };

  return (
    <div>
      <span className="text-sm font-medium text-ink">Skills</span>
      <p className="mt-0.5 text-[13px] text-muted">
        These drive search matching, so use the names candidates would search for.
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-2 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
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
          placeholder={items.length ? "" : "React"}
          className="min-w-[120px] flex-1 bg-transparent py-0.5 text-[14px] focus:outline-none"
        />
      </div>
      <p className="mt-1.5 text-[13px] text-muted">Press Enter after each skill.</p>
    </div>
  );
}