import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import StatusBadge from "./StatusBadge";
import { getCompanyApplicationRequest, changeApplicationStatusRequest } from "../api/recruiterApplicationApi";
import { parseApiError } from "../../auth/api/authApi";
import { relativeTime } from "../../job/jobConstants";

const NEXT_ACTIONS = {
  applied: [{ status: "screening", label: "Move to screening", primary: true }, { status: "rejected", label: "Reject" }],
  screening: [{ status: "interview", label: "Move to interview", primary: true }, { status: "rejected", label: "Reject" }],
  interview: [{ status: "offer", label: "Make an offer", primary: true }, { status: "rejected", label: "Reject" }],
  offer: [{ status: "hired", label: "Mark as hired", primary: true }, { status: "rejected", label: "Reject" }],
  hired: [],
  rejected: [],
  withdrawn: [],
};

const formatDate = (v) => (v ? new Date(v).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "");
const dateRange = (start, end) => `${formatDate(start)} – ${end ? formatDate(end) : "Present"}`;

/**
 * The applicant's full submission, in a side drawer rather than a new page —
 * a recruiter screening twenty people shouldn't lose the board each time.
 */
export default function ApplicantDrawer({ applicationId, onClose, onChanged }) {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCompanyApplicationRequest(applicationId)
      .then((res) => setApp(res.data.application))
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, [applicationId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const move = async (status) => {
    setBusy(true);
    setError("");
    try {
      await changeApplicationStatusRequest(applicationId, status);
      onChanged();
      onClose();
    } catch (err) {
      setError(parseApiError(err).message);
      setBusy(false);
    }
  };

  // The snapshot — what they actually submitted, not their resume today
  const r = app?.resumeSnapshot;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end bg-ink/60 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xl flex-col bg-paper shadow-2xl"
      >
        <header className="shrink-0 border-b border-line bg-white px-6 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-display text-[20px] font-600">
                {loading ? "Loading…" : app?.candidate?.fullName}
              </h2>
              <p className="mt-0.5 truncate text-[13.5px] text-muted">
                {app?.job?.title}
                {app && ` · applied ${relativeTime(app.appliedAt)}`}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium hover:border-ink/30"
            >
              Close
            </button>
          </div>
          {app && (
            <div className="mt-3">
              <StatusBadge status={app.status} size="lg" />
            </div>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl border border-line bg-white" />
              ))}
            </div>
          ) : app ? (
            <div className="space-y-5">
              <section className="rounded-xl border border-line bg-white p-5">
                <p className="eyebrow text-muted">Contact</p>
                <p className="mt-2 text-[15px]">{r?.contact?.email || app.candidate?.email}</p>
                {r?.contact?.phone && <p className="text-[15px]">{r.contact.phone}</p>}
                {r?.contact?.location && <p className="text-[14px] text-muted">{r.contact.location}</p>}
                {!!r?.contact?.links?.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.contact.links.map((l) => (
                      <a
                        key={l.url}
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-line px-2.5 py-1 text-[13px] font-medium text-accent hover:border-accent/40"
                      >
                        {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </section>

              {app.coverLetter && (
                <section className="rounded-xl border border-line bg-white p-5">
                  <p className="eyebrow text-muted">Cover letter</p>
                  <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed">{app.coverLetter}</p>
                </section>
              )}

              {r?.summary && (
                <section className="rounded-xl border border-line bg-white p-5">
                  <p className="eyebrow text-muted">Summary</p>
                  <p className="mt-2 text-[14.5px] leading-relaxed">{r.summary}</p>
                </section>
              )}

              {!!r?.experience?.length && (
                <section className="rounded-xl border border-line bg-white p-5">
                  <p className="eyebrow text-muted">Experience</p>
                  <div className="mt-3 space-y-4">
                    {r.experience.map((x, i) => (
                      <div key={i}>
                        <p className="text-[14.5px] font-medium">{x.title}</p>
                        <p className="text-[13.5px] text-muted">
                          {[x.company, x.location].filter(Boolean).join(" · ")} ·{" "}
                          {dateRange(x.startDate, x.endDate)}
                        </p>
                        {!!x.bullets?.length && (
                          <ul className="mt-1.5 space-y-1">
                            {x.bullets.map((b, j) => (
                              <li key={j} className="flex gap-2 text-[13.5px] leading-snug">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted/50" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!!r?.projects?.length && (
                <section className="rounded-xl border border-line bg-white p-5">
                  <p className="eyebrow text-muted">Projects</p>
                  <div className="mt-3 space-y-4">
                    {r.projects.map((x, i) => (
                      <div key={i}>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-[14.5px] font-medium">{x.name}</p>
                          {x.url && (
                            <a href={x.url} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-accent hover:underline">
                              View
                            </a>
                          )}
                        </div>
                        {x.description && <p className="text-[13.5px] text-muted">{x.description}</p>}
                        {!!x.techStack?.length && (
                          <p className="mt-0.5 text-[13px] text-accent">{x.techStack.join(" · ")}</p>
                        )}
                        {!!x.bullets?.length && (
                          <ul className="mt-1.5 space-y-1">
                            {x.bullets.map((b, j) => (
                              <li key={j} className="flex gap-2 text-[13.5px] leading-snug">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted/50" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!!r?.education?.length && (
                <section className="rounded-xl border border-line bg-white p-5">
                  <p className="eyebrow text-muted">Education</p>
                  <div className="mt-3 space-y-3">
                    {r.education.map((x, i) => (
                      <div key={i}>
                        <p className="text-[14.5px] font-medium">{x.school}</p>
                        <p className="text-[13.5px] text-muted">
                          {[x.degree, x.fieldOfStudy, x.grade].filter(Boolean).join(" · ")}
                        </p>
                        <p className="text-[13px] text-muted">{dateRange(x.startDate, x.endDate)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!!r?.skills?.length && (
                <section className="rounded-xl border border-line bg-white p-5">
                  <p className="eyebrow text-muted">Skills</p>
                  <div className="mt-3 space-y-2">
                    {r.skills.map((g, i) => (
                      <div key={i} className="flex flex-wrap items-baseline gap-2">
                        <span className="text-[13.5px] font-medium">{g.category}</span>
                        <span className="text-[13.5px] text-muted">{(g.items || []).join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {app.statusHistory?.length > 1 && (
                <section className="rounded-xl border border-line bg-white p-5">
                  <p className="eyebrow text-muted">History</p>
                  <ol className="mt-3 space-y-2">
                    {app.statusHistory.map((e, i) => (
                      <li key={i} className="flex items-center gap-3 text-[13.5px]">
                        <StatusBadge status={e.status} />
                        <span className="text-muted">{relativeTime(e.changedAt)}</span>
                        {e.note && <span className="text-muted">— {e.note}</span>}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          ) : null}
        </div>

        {app && NEXT_ACTIONS[app.status].length > 0 && (
          <footer className="shrink-0 border-t border-line bg-white px-6 py-4">
            <div className="flex flex-wrap justify-end gap-2">
              {NEXT_ACTIONS[app.status].map((a) => (
                <button
                  key={a.status}
                  type="button"
                  disabled={busy}
                  onClick={() => move(a.status)}
                  className={`rounded-lg px-4 py-2.5 text-[14.5px] font-medium transition-colors disabled:opacity-60 ${
                    a.primary
                      ? "bg-accent text-white hover:bg-accent/90"
                      : "border border-line text-muted hover:border-danger/40 hover:text-danger"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}