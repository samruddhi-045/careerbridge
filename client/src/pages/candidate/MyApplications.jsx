import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../../layouts/AppHeader";
import StatusBadge from "../../features/application/components/StatusBadge";
import StageProgress from "../../features/application/components/StageProgress";
import {
  listMyApplicationsRequest,
  withdrawApplicationRequest,
} from "../../features/application/api/applicationApi";
import { APPLICATION_TABS, isTerminal } from "../../features/application/applicationConstants";
import { relativeTime, workModeLabel } from "../../features/job/jobConstants";
import { parseApiError } from "../../features/auth/api/authApi";

export default function MyApplications() {
  const [tab, setTab] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async (status) => {
    setLoading(true);
    try {
      setError("");
      const res = await listMyApplicationsRequest(status ? { status } : {});
      setApplications(res.data.applications);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [load, tab]);

  const withdraw = async (id) => {
    setBusyId(id);
    setError("");
    try {
      await withdrawApplicationRequest(id);
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

      <main className="mx-auto max-w-3xl px-6 py-12 rise">
        <p className="eyebrow text-muted">Tracker</p>
        <h1 className="mt-3 font-display text-[34px] font-600 leading-tight tracking-[-0.02em]">
          My applications
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted">
          Every role you've applied to and where it stands. Stages update as the hiring team
          moves you along.
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-1 rounded-lg border border-line bg-white p-1">
          {APPLICATION_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`flex-1 rounded-md px-3 py-2 text-[14px] font-medium transition-colors ${
                t.value === tab ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[160px] animate-pulse rounded-xl border border-line bg-white" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-white/50 px-6 py-16 text-center">
              <p className="font-display text-[19px] font-600">
                {tab ? "Nothing at this stage" : "No applications yet"}
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-[14px] text-muted">
                {tab
                  ? "Try another tab to see the rest."
                  : "When you apply to a role, it'll show up here with its progress."}
              </p>
              {!tab && (
                <Link
                  to="/jobs"
                  className="mt-5 inline-block rounded-lg bg-accent px-4 py-2.5 text-[15px] font-medium text-white hover:bg-accent/90"
                >
                  Browse jobs
                </Link>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {applications.map((app) => {
                const isBusy = busyId === app.id;
                const expanded = expandedId === app.id;
                const place = [app.job?.location?.city, app.job?.location?.country]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <li key={app.id} className="rounded-xl border border-line bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {app.job ? (
                            <Link
                              to={`/jobs/${app.job.id}`}
                              className="text-[17px] font-medium hover:text-accent"
                            >
                              {app.job.title}
                            </Link>
                          ) : (
                            <span className="text-[17px] font-medium text-muted">
                              Job no longer listed
                            </span>
                          )}
                          <StatusBadge status={app.status} />
                        </div>

                        <p className="mt-1 text-[14px] text-muted">
                          {app.job?.company?.name}
                          {place && ` · ${place}`}
                          {app.job?.workMode && ` · ${workModeLabel(app.job.workMode)}`}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {/* Withdrawing is only offered while the application is
                            actually live — a rejected one has nothing to withdraw. */}
                        {!isTerminal(app.status) &&
                          (confirmId === app.id ? (
                            <>
                              <span className="text-[13px] text-muted">Withdraw?</span>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => withdraw(app.id)}
                                className="rounded-lg bg-danger px-3 py-1.5 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-60"
                              >
                                Yes
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
                              onClick={() => setConfirmId(app.id)}
                              className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-ink/30 hover:text-ink"
                            >
                              Withdraw
                            </button>
                          ))}
                      </div>
                    </div>

                    <div className="mt-5">
                      <StageProgress status={app.status} timeline={app.timeline} />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                      <p className="text-[13px] text-muted">
                        Applied {relativeTime(app.appliedAt)}
                        {app.resumeName && ` · ${app.resumeName}`}
                      </p>
                      {app.timeline?.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : app.id)}
                          className="text-[13px] font-medium text-accent hover:underline"
                        >
                          {expanded ? "Hide history" : "View history"}
                        </button>
                      )}
                    </div>

                    {expanded && (
                      <ol className="mt-3 space-y-2 border-t border-line pt-3">
                        {app.timeline.map((event, i) => (
                          <li key={i} className="flex items-center gap-3 text-[13.5px]">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                            <StatusBadge status={event.status} />
                            <span className="text-muted">{relativeTime(event.changedAt)}</span>
                          </li>
                        ))}
                      </ol>
                    )}
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