import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { listResumesRequest } from "../../resume/api/resumeApi";
import { applyToJobRequest } from "../api/applicationApi";
import { parseApiError } from "../../auth/api/authApi";

const MAX_COVER_LETTER = 5000;

/**
 * Portaled to <body>, like the resume preview overlay.
 *
 * The job detail page has a sticky action panel with backdrop-blur, which
 * creates its own stacking context -- an in-place modal would end up painting
 * underneath it no matter how high its z-index went.
 */
export default function ApplyModal({ job, onClose, onApplied }) {
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listResumesRequest()
      .then((res) => {
        setResumes(res.data.resumes);
        // Preselect the most recently edited — it's almost always the one
        // they're about to pick anyway.
        if (res.data.resumes.length) setResumeId(res.data.resumes[0].id);
      })
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, submitting]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await applyToJobRequest(job.id, { resumeId, coverLetter: coverLetter.trim() });
      onApplied();
    } catch (err) {
      setError(parseApiError(err).message);
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/70 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Apply to ${job.title}`}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-paper sm:rounded-2xl"
      >
        <header className="shrink-0 border-b border-line bg-white px-6 py-4">
          <p className="eyebrow text-muted">Apply</p>
          <h2 className="mt-1 font-display text-[20px] font-600 leading-snug">{job.title}</h2>
          <p className="mt-0.5 text-[14px] text-muted">{job.company?.name}</p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-[62px] animate-pulse rounded-lg border border-line bg-white" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-white/60 px-5 py-10 text-center">
              <p className="font-display text-[17px] font-600">You need a resume first</p>
              <p className="mx-auto mt-1.5 max-w-xs text-[14px] text-muted">
                Build one — it takes a few minutes, and you can reuse it for every application
                after this.
              </p>
              <Link
                to="/candidate/resumes"
                className="mt-4 inline-block rounded-lg bg-accent px-4 py-2.5 text-[15px] font-medium text-white hover:bg-accent/90"
              >
                Create a resume
              </Link>
            </div>
          ) : (
            <form id="apply-form" onSubmit={submit}>
              <fieldset>
                <legend className="text-sm font-medium text-ink">Which resume?</legend>
                <p className="mt-0.5 text-[13px] text-muted">
                  A copy is attached to this application, so editing it later won't change what
                  the recruiter sees.
                </p>

                <div className="mt-3 space-y-2">
                  {resumes.map((r) => {
                    const selected = r.id === resumeId;
                    return (
                      <label
                        key={r.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 transition-colors ${
                          selected ? "border-accent bg-accent-soft" : "border-line bg-white hover:border-ink/25"
                        }`}
                      >
                        <input
                          type="radio"
                          name="resume"
                          value={r.id}
                          checked={selected}
                          onChange={() => setResumeId(r.id)}
                          className="h-4 w-4 accent-accent"
                        />
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[15px] font-medium ${selected ? "text-accent" : ""}`}>
                            {r.name}
                          </span>
                          <span className="block text-[13px] text-muted">{r.templateId} template</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-6">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="coverLetter" className="text-sm font-medium text-ink">
                    Cover letter
                  </label>
                  <span className="text-[12.5px] text-muted">Optional</span>
                </div>
                <p className="mt-0.5 text-[13px] text-muted">
                  A few lines on why this role. Skip it if you'd rather let the resume speak.
                </p>
                <textarea
                  id="coverLetter"
                  rows={6}
                  value={coverLetter}
                  maxLength={MAX_COVER_LETTER}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder={`Hi ${job.company?.name || "there"} team,`}
                  className="mt-2 w-full resize-y rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                {coverLetter.length > MAX_COVER_LETTER - 500 && (
                  <p className="mt-1.5 text-right text-[12.5px] text-muted">
                    {MAX_COVER_LETTER - coverLetter.length} characters left
                  </p>
                )}
              </div>
            </form>
          )}
        </div>

        <footer className="shrink-0 border-t border-line bg-white px-6 py-4">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-line px-4 py-2.5 text-[15px] font-medium transition-colors hover:border-ink/30 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="apply-form"
              disabled={submitting || loading || !resumeId}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              Submit application
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}