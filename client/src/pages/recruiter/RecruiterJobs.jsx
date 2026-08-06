import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../../layouts/AppHeader";
import { parseApiError } from "../../features/auth/api/authApi";
import { listJobsRequest, changeJobStatusRequest, deleteJobRequest } from "../../features/job/api/jobApi";
import {
  STATUS_TABS,
  STATUS_STYLES,
  employmentLabel,
  workModeLabel,
  formatSalary,
  relativeTime,
} from "../../features/job/jobConstants";

/**
 * Which actions are offered for a job in each state.
 *
 * The server enforces the same transition map -- this just avoids showing
 * buttons that would be rejected. Client-side gating is UX; the API is the
 * actual rule.
 */
const ACTIONS = {
  draft: [
    { label: "Publish", status: "published", primary: true },
    { label: "Archive", status: "archived" },
  ],
  published: [
    { label: "Close", status: "closed" },
    { label: "Archive", status: "archived" },
  ],
  closed: [
    { label: "Reopen", status: "published", primary: true },
    { label: "Archive", status: "archived" },
  ],
  archived: [],
};

export default function RecruiterJobs() {
  const [tab, setTab] = useState("published");
  const [jobs, setJobs] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const load = useCallback(async (status) => {
    setLoading(true);
    try {
      setError("");
      const res = await listJobsRequest({ status });
      setJobs(res.data.jobs);
      setCounts(res.data.counts || {});
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [load, tab]);

  const runAction = async (id, action) => {
    setBusyId(id);
    setError("");
    try {
      await action();
      await load(tab);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-6 py-12 rise">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-muted">Hiring</p>
            <h1 className="mt-3 font-display text-[34px] font-600 leading-tight tracking-[-0.02em]">
              Jobs
            </h1>
            <p className="mt-2 max-w-lg text-[15px] text-muted">
              Post a role, keep it as a draft until it's ready, then publish it to candidates.
            </p>
          </div>
          <Link
            to="/recruiter/jobs/new"
            className="rounded-lg bg-accent px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-accent/90"
          >
            Post a job
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">
            {error}
          </div>
        )}

        {/* Status tabs, with counts straight from the API's aggregation */}
        <div className="mt-8 flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1">
          {STATUS_TABS.map((t) => {
            const isActive = t.value === tab;
            const count = counts[t.value] || 0;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={`flex-1 rounded-md px-3 py-2 text-[14px] font-medium transition-colors ${
                  isActive ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink"
                }`}
              >
                {t.label}
                <span className={isActive ? "text-white/60" : "text-muted/60"}> {count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[110px] animate-pulse rounded-xl border border-line bg-white" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-white/50 px-6 py-14 text-center">
              <p className="font-display text-[19px] font-600">
                {tab === "published" ? "No live jobs" : `No ${tab} jobs`}
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-[14px] text-muted">
                {tab === "published"
                  ? "Publish a draft, or post a new role to start receiving applications."
                  : "Nothing here yet."}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => {
                const isBusy = busyId === job.id;
                const salary = formatSalary(job.salary);

                return (
                  <li
                    key={job.id}
                    className="rounded-xl border border-line bg-white p-5 transition-colors hover:border-ink/20"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/recruiter/jobs/${job.id}`}
                            className="text-[17px] font-medium hover:text-accent"
                          >
                            {job.title}
                          </Link>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${STATUS_STYLES[job.status]}`}
                          >
                            {job.status}
                          </span>
                        </div>

                        <p className="mt-1 text-[14px] text-muted">
                          {[
                            employmentLabel(job.employmentType),
                            workModeLabel(job.workMode),
                            [job.location?.city, job.location?.country].filter(Boolean).join(", "),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>

                        {salary && <p className="mt-1 text-[14px] text-ink">{salary}</p>}

                        {!!job.skills?.length && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {job.skills.map((s) => (
                              <span
                                key={s}
                                className="rounded-md bg-paper px-2 py-0.5 text-[12.5px] text-muted"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="mt-3 text-[13px] text-muted">
                          {job.applicationCount} application{job.applicationCount === 1 ? "" : "s"}
                          {" · "}
                          {job.status === "published" && job.publishedAt
                            ? `published ${relativeTime(job.publishedAt)}`
                            : `created ${relativeTime(job.createdAt)}`}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Link
                          to={`/recruiter/jobs/${job.id}`}
                          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition-colors hover:border-ink/30"
                        >
                          Edit
                        </Link>

                        {ACTIONS[job.status].map((a) => (
                          <button
                            key={a.status}
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              runAction(job.id, () => changeJobStatusRequest(job.id, a.status))
                            }
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                              a.primary
                                ? "bg-accent text-white hover:bg-accent/90"
                                : "border border-line hover:border-ink/30"
                            }`}
                          >
                            {a.label}
                          </button>
                        ))}

                        {/* Drafts are the only thing that can be deleted -- a
                            published job may have applications attached. */}
                        {job.status === "draft" &&
                          (confirmId === job.id ? (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => runAction(job.id, () => deleteJobRequest(job.id))}
                                className="rounded-lg bg-danger px-3 py-1.5 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-60"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmId(null)}
                                className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:border-ink/30"
                              >
                                Keep
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmId(job.id)}
                              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:border-danger/40 disabled:opacity-60"
                            >
                              Delete
                            </button>
                          ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}