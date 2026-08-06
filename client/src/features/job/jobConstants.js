// Labels for the enums the API speaks. Kept in one file so the list, the form
// and the (future) candidate search all read the same wording.

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" },
];

export const WORK_MODES = [
  { value: "onsite", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

export const EXPERIENCE_LEVELS = [
  { value: "internship", label: "Internship" },
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Principal" },
];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

export const SALARY_PERIODS = [
  { value: "yearly", label: "per year" },
  { value: "monthly", label: "per month" },
  { value: "hourly", label: "per hour" },
];

export const STATUS_TABS = [
  { value: "published", label: "Live" },
  { value: "draft", label: "Drafts" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

export const STATUS_STYLES = {
  published: "bg-accent-soft text-accent",
  draft: "bg-paper text-muted border border-line",
  closed: "bg-danger/[0.07] text-danger",
  archived: "bg-paper text-muted border border-line",
};

const labelOf = (list, value) => list.find((x) => x.value === value)?.label || value;

export const employmentLabel = (v) => labelOf(EMPLOYMENT_TYPES, v);
export const workModeLabel = (v) => labelOf(WORK_MODES, v);
export const experienceLabel = (v) => labelOf(EXPERIENCE_LEVELS, v);

const CURRENCY_SYMBOLS = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

/**
 * "₹6,00,000 – ₹9,00,000 per year", collapsing sensibly when only one bound is
 * set. Returns null when there's nothing to show, so callers can skip the row
 * entirely rather than render an empty label.
 */
export const formatSalary = (salary) => {
  if (!salary || (salary.min == null && salary.max == null)) return null;

  const symbol = CURRENCY_SYMBOLS[salary.currency] || "";
  const fmt = (n) => `${symbol}${Number(n).toLocaleString("en-IN")}`;
  const period = SALARY_PERIODS.find((p) => p.value === salary.period)?.label || "";

  if (salary.min != null && salary.max != null) return `${fmt(salary.min)} – ${fmt(salary.max)} ${period}`;
  if (salary.min != null) return `From ${fmt(salary.min)} ${period}`;
  return `Up to ${fmt(salary.max)} ${period}`;
};

export const relativeTime = (iso) => {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString();
};