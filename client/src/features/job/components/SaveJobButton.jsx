import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { saveJobRequest, unsaveJobRequest } from "../api/publicJobApi";

/**
 * Optimistic toggle: flip the icon immediately, revert if the request fails.
 * A save is a low-stakes action, and waiting ~200ms for a bookmark to fill in
 * feels broken.
 *
 * Signed-out visitors get sent to login rather than a disabled button -- this
 * is the moment someone actually has a reason to make an account.
 */
export default function SaveJobButton({ jobId, initialSaved, variant = "icon" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // the whole card is a link; don't navigate on save

    if (!user) return navigate("/login", { state: { from: `/jobs/${jobId}` } });
    if (user.role !== "candidate") return;

    const next = !saved;
    setSaved(next);
    setBusy(true);
    try {
      await (next ? saveJobRequest(jobId) : unsaveJobRequest(jobId));
    } catch {
      setSaved(!next); // put it back
    } finally {
      setBusy(false);
    }
  };

  if (user && user.role !== "candidate") return null;

  const icon = (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
      <path d="M5 3.5h10a1 1 0 0 1 1 1v12l-6-3.5-6 3.5v-12a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
    </svg>
  );

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[15px] font-medium transition-colors disabled:opacity-60 ${
          saved ? "border-accent bg-accent-soft text-accent" : "border-line bg-white text-ink hover:border-ink/30"
        }`}
      >
        {icon}
        {saved ? "Saved" : "Save job"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? "Remove from saved" : "Save job"}
      className={`rounded-lg border p-2 transition-colors disabled:opacity-60 ${
        saved ? "border-accent bg-accent-soft text-accent" : "border-line bg-white text-muted hover:border-ink/30 hover:text-ink"
      }`}
    >
      {icon}
    </button>
  );
}