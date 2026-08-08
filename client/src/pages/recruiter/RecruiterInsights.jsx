import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppHeader from "../../layouts/AppHeader";
import StatCard from "../../features/analytics/components/StatCard";
import FunnelChart from "../../features/analytics/components/FunnelChart";
import ActivityChart from "../../features/analytics/components/ActivityChart";
import EmptyAnalytics from "../../features/analytics/components/EmptyAnalytics";
import { getRecruiterAnalyticsRequest } from "../../features/analytics/api/analyticsApi";
import { listJobsRequest } from "../../features/job/api/jobApi";
import { STATUS_LABELS } from "../../features/application/applicationConstants";
import { parseApiError } from "../../features/auth/api/authApi";

export default function RecruiterInsights() {
  const [params, setParams] = useSearchParams();
  const jobId = params.get("jobId") || "";

  const [jobs, setJobs] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listJobsRequest({ limit: 50 })
      .then((res) => setJobs(res.data.jobs))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const res = await getRecruiterAnalyticsRequest(jobId ? { jobId } : {});
      setData(res.data);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = data?.totals;

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-6 py-12 rise">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-muted">Insights</p>
            <h1 className="mt-3 font-display text-[34px] font-600 leading-tight tracking-[-0.02em]">
              Hiring performance
            </h1>
            <p className="mt-2 max-w-lg text-[15px] text-muted">
              Where your pipeline is moving, where it's stuck, and which roles are pulling
              their weight.
            </p>
          </div>

          <select
            value={jobId}
            onChange={(e) => setParams(e.target.value ? { jobId: e.target.value } : {})}
            className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-[14.5px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="">All jobs</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[124px] animate-pulse rounded-xl border border-line bg-white" />
              ))}
            </div>
            <div className="h-[300px] animate-pulse rounded-xl border border-line bg-white" />
          </div>
        ) : !totals?.applications ? (
          <div className="mt-8">
            <EmptyAnalytics
              title="No applications to analyse"
              body="Once candidates start applying, this page will show where your pipeline slows down and how each role is performing."
              cta={{ to: "/recruiter/jobs", label: "Manage jobs" }}
            />
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {/* The single most actionable line on the page, so it goes first */}
            {data.bottleneck && (
              <div className="rounded-xl border border-accent/30 bg-accent-soft px-5 py-4">
                <p className="text-[14.5px] text-accent">
                  <span className="font-medium">
                    {STATUS_LABELS[data.bottleneck.stage]} is your slowest stage.
                  </span>{" "}
                  Candidates wait a median of {data.bottleneck.medianDays} days there before
                  anything happens.
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Applications" value={totals.applications} />
              <StatCard
                label="In progress"
                value={totals.active}
                accent
                hint="Not yet hired, rejected or withdrawn."
              />
              <StatCard label="Hired" value={totals.hired} />
              <StatCard
                label="Not selected"
                value={totals.rejected}
                hint={totals.withdrawn ? `${totals.withdrawn} withdrew.` : undefined}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-xl border border-line bg-white p-6">
                <h2 className="font-display text-[18px] font-600">Pipeline</h2>
                <p className="mt-1 text-[13.5px] text-muted">Where candidates sit right now.</p>
                <div className="mt-5">
                  <FunnelChart stages={data.pipeline} />
                </div>
              </section>

              <section className="rounded-xl border border-line bg-white p-6">
                <h2 className="font-display text-[18px] font-600">Time in stage</h2>
                <p className="mt-1 text-[13.5px] text-muted">
                  Median days before moving on. Candidates still waiting aren't counted.
                </p>
                <div className="mt-5 space-y-3">
                  {data.timeInStage.map((s) => (
                    <div key={s.stage} className="flex items-baseline justify-between gap-3">
                      <span className="text-[14px]">{STATUS_LABELS[s.stage]}</span>
                      <span className="text-[14px]">
                        {s.medianDays === null ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <>
                            <span className="font-medium">{s.medianDays}</span>
                            <span className="text-muted"> days</span>
                            <span className="ml-1.5 text-[12.5px] text-muted">
                              (n={s.sampleSize})
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {data.jobs.length > 0 && (
              <section className="rounded-xl border border-line bg-white p-6">
                <h2 className="font-display text-[18px] font-600">By role</h2>
                <p className="mt-1 text-[13.5px] text-muted">
                  A low interview rate usually means the posting is attracting the wrong people.
                </p>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-[14px]">
                    <thead>
                      <tr className="border-b border-line">
                        <th className="pb-2 font-medium">Role</th>
                        <th className="pb-2 text-right font-medium">Applied</th>
                        <th className="pb-2 text-right font-medium">Interviewed</th>
                        <th className="pb-2 text-right font-medium">Hired</th>
                        <th className="pb-2 text-right font-medium">Days to hire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.jobs.map((j) => (
                        <tr key={j.id} className="border-b border-line/60 last:border-0">
                          <td className="py-2.5 pr-3">
                            <Link
                              to={`/recruiter/pipeline?jobId=${j.id}`}
                              className="block max-w-[220px] truncate hover:text-accent"
                            >
                              {j.title}
                            </Link>
                          </td>
                          <td className="py-2.5 text-right text-muted">{j.applications}</td>
                          <td className="py-2.5 text-right text-muted">
                            {j.interviews}
                            <span className="ml-1 text-[12.5px]">({j.interviewRate}%)</span>
                          </td>
                          <td className="py-2.5 text-right text-muted">{j.hires}</td>
                          <td className="py-2.5 text-right text-muted">
                            {j.avgDaysToHire ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {data.activity.length > 1 && (
              <section className="rounded-xl border border-line bg-white p-6">
                <h2 className="font-display text-[18px] font-600">Applications received</h2>
                <p className="mt-1 text-[13.5px] text-muted">Last 12 weeks.</p>
                <div className="mt-5">
                  <ActivityChart data={data.activity} />
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}