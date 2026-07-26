export default function TextArea({ label, name, value, onChange, error, hint, rows = 4 }) {
  const inputId = `field-${name}`;

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-medium text-ink">{label}</label>
      <textarea
        id={inputId}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        className={`mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] transition-colors
          placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-0
          ${error
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : "border-line focus:border-accent focus:ring-accent/20"}`}
      />
      {error ? (
        <p className="mt-1.5 text-[13px] text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
