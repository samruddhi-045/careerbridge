// metadata only -- importing ../templates here would pull the PDF engine
// into the main bundle
import { TEMPLATE_META } from "../templates/meta";

/**
 * A segmented control rather than three description cards. The cards were
 * honest about what each template does, but they consumed most of the column
 * and squeezed the preview -- and the preview shows you what a template looks
 * like far better than a sentence can. The description of the selected one
 * stays, on a single line.
 */
export default function TemplatePicker({ value, onChange }) {
  const selected = TEMPLATE_META.find((t) => t.id === value) || TEMPLATE_META[0];

  return (
    <div>
      <div className="flex gap-1 rounded-lg border border-line bg-white p-1">
        {TEMPLATE_META.map((t) => {
          const isActive = t.id === selected.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              aria-pressed={isActive}
              title={t.description}
              className={`flex-1 rounded-md px-3 py-1.5 text-[13.5px] font-medium transition-colors ${
                isActive ? "bg-accent text-white" : "text-muted hover:bg-paper hover:text-ink"
              }`}
            >
              {t.name}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[12.5px] leading-snug text-muted">{selected.description}</p>
    </div>
  );
}