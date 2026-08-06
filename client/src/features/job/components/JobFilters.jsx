import { WORK_MODES, EMPLOYMENT_TYPES, EXPERIENCE_LEVELS } from "../jobConstants";

const SALARY_STEPS = [
  { value: "", label: "Any" },
  { value: "300000", label: "₹3L+" },
  { value: "600000", label: "₹6L+" },
  { value: "1000000", label: "₹10L+" },
  { value: "1500000", label: "₹15L+" },
];

function CheckGroup({ title, options, selected, onToggle }) {
  return (
    <div>
      <p className="eyebrow text-muted">{title}</p>
      <div className="mt-2.5 space-y-1.5">
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-2.5 text-[14px]">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() => onToggle(o.value)}
              className="h-4 w-4 rounded border-line accent-accent"
            />
            <span className={selected.includes(o.value) ? "text-ink" : "text-muted"}>{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Filters live in the URL (see JobSearch), not in local state, so a filtered
 * search is a shareable link and the back button behaves.
 */
export default function JobFilters({ filters, onChange, onClear, activeCount }) {
  const toggle = (key, value) => {
    const current = filters[key] || [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-medium">Filters</p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-[13px] font-medium text-accent hover:underline"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <CheckGroup
        title="Work mode"
        options={WORK_MODES}
        selected={filters.workMode || []}
        onToggle={(v) => toggle("workMode", v)}
      />

      <CheckGroup
        title="Employment"
        options={EMPLOYMENT_TYPES}
        selected={filters.employmentType || []}
        onToggle={(v) => toggle("employmentType", v)}
      />

      <CheckGroup
        title="Experience"
        options={EXPERIENCE_LEVELS}
        selected={filters.experienceLevel || []}
        onToggle={(v) => toggle("experienceLevel", v)}
      />

      <div>
        <p className="eyebrow text-muted">Minimum salary</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {SALARY_STEPS.map((s) => {
            const active = (filters.salaryMin || "") === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onChange({ ...filters, salaryMin: s.value })}
                className={`rounded-lg border px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                  active ? "border-accent bg-accent-soft text-accent" : "border-line bg-white text-muted hover:border-ink/25"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[12.5px] text-muted">
          Matches roles whose top of range reaches this.
        </p>
      </div>

      <div>
        <p className="eyebrow text-muted">City</p>
        <input
          value={filters.city || ""}
          onChange={(e) => onChange({ ...filters, city: e.target.value })}
          placeholder="Pune"
          className="mt-2.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>
    </div>
  );
}