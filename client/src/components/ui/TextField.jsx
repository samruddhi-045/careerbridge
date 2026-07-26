import { useState } from "react";

export default function TextField({
  label, name, type = "text", value, onChange, error, hint, autoComplete, autoFocus,
}) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const inputId = `field-${name}`;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="text-xs font-medium text-muted hover:text-accent transition-colors"
          >
            {reveal ? "Hide" : "Show"}
          </button>
        )}
      </div>

      <input
        id={inputId}
        name={name}
        type={isPassword && reveal ? "text" : type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={`mt-1.5 w-full rounded-lg border bg-white px-3.5 py-2.5 text-[15px] transition-colors
          placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-0
          ${error
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : "border-line focus:border-accent focus:ring-accent/20"}`}
      />

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-[13px] text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}