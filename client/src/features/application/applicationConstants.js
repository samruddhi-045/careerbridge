// The stages a candidate moves through, in order. rejected and withdrawn sit
// outside this — they're endings, not steps.
export const PIPELINE_STAGES = [
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "hired", label: "Hired" },
];

export const STATUS_LABELS = {
  applied: "Applied",
  screening: "In screening",
  interview: "Interviewing",
  offer: "Offer",
  hired: "Hired",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

/**
 * Deliberately neutral colours for rejected and withdrawn.
 *
 * A red "REJECTED" badge on a page someone opens hoping for good news is
 * needlessly harsh, and rejection is the most common outcome in any job
 * search. Muted grey states the fact without shouting it.
 */
export const STATUS_STYLES = {
  applied: "bg-paper text-muted border border-line",
  screening: "bg-accent-soft text-accent",
  interview: "bg-accent-soft text-accent",
  offer: "bg-accent text-white",
  hired: "bg-accent text-white",
  rejected: "bg-paper text-muted border border-line",
  withdrawn: "bg-paper text-muted border border-line",
};

export const isTerminal = (status) => ["hired", "rejected", "withdrawn"].includes(status);
export const isClosedOut = (status) => ["rejected", "withdrawn"].includes(status);

export const stageIndex = (status) =>
  PIPELINE_STAGES.findIndex((s) => s.value === status);

export const APPLICATION_TABS = [
  { value: "", label: "All" },
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
];