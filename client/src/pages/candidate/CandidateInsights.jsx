import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../../layouts/AppHeader";
import StatCard from "../../features/analytics/components/StatCard";
import FunnelChart from "../../features/analytics/components/FunnelChart";
import ActivityChart from "../../features/analytics/components/ActivityChart";
import EmptyAnalytics from "../../features/analytics/components/EmptyAnalytics";
import { getCandidateAnalyticsRequest } from "../../features/analytics/api/analyticsApi";
import { parseApiError } from "../../features/auth/api/authApi";

export default function CandidateInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getCandidateAnalyticsRequest()
      .then((res) => setData(res.data))
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  const totals = data?.totals;

  // The best-performing resume, but only when there's something to compare
  // against — "your best resume" is meaningless with one resume.
  const bestResume =
    data?.resumes?.length > 1
      ? [...data.resumes].sort((a, b) => b.responseRate - a.responseRate)[0]
      : null;

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-4xl px-6 py-12 rise">
        <p className="eyebrow text-muted">Insights</p>
        <h1 className="mt-3 font-display text-[34px] font-600 leading-tight tracking-[-0.02em]">
          How your search is going
        </h1>
        <p className="mt-2 max-w-lg text-[15px] text-muted">
          Where your applications stand, how often you hear back, and which resume is doing
          the most work.
        </p>

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
              title="Nothing to measure yet"
              body="Once you've applied to a few roles, this page will show your response rate, where applications stall, and which resume performs best."
              cta={{ to: "/jobs", label: "Browse jobs" }}
            />
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Applications" value={totals.applications} />
              <StatCard
                label="Response rate"
                value={totals.responseRate}
                suffix="%"
                accent
                hint={data.insight}
              />
              <StatCard
                label="Median reply time"
                value={totals.medianDaysToResponse}
                suffix=" days"
                hint={
                  totals.medianDaysToResponse === null
                    ? "No responses yet to measure."
                    : "From applying to first update."
                }
              />
              <StatCard
                label="Interviews"
                value={totals.interviews}
                hint={totals.offers ? `${totals.offers} reached offer stage.` : undefined}
              />
            </div>

            <section className="rounded-xl border border-line bg-white p-6">
              <h2 className="font-display text-[18px] font-600">Your funnel</h2>
              <p className="mt-1 text-[13.5px] text-muted">
                Counts every application that reached each stage, including ones that later
                ended.
              </p>
              <div className="mt-5">
                <FunnelChart stages={data.funnel} />
              </div>
            </section>

            {data.resumes.length > 0 && (
              <section className="rounded-xl border border-line bg-white p-6">
                <h2 className="font-display text-[18px] font-600">Resume performance</h2>
                <p className="mt-1 text-[13.5px] text-muted">
                  {bestResume
                    ? `"${bestResume.name}" is getting the most replies. Consider using it more.`
                    : "Apply with a second resume to compare how they perform."}
                </p>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-[14px]">
                    <thead>
                      <tr className="border-b border-line">
                        <th className="pb-2 font-medium">Resume</th>
                        <th className="pb-2 text-right font-medium">Sent</th>
                        <th className="pb-2 text-right font-medium">Replies</th>
                        <th className="pb-2 text-right font-medium">Interviews</th>
                        <th className="pb-2 text-right font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.resumes.map((r) => (
                        <tr key={r.id} className="border-b border-line/60 last:border-0">
                          <td className="py-2.5 pr-3">
                            <span className="block max-w-[200px] truncate">{r.name}</span>
                          </td>
                          <td className="py-2.5 text-right text-muted">{r.applications}</td>
                          <td className="py-2.5 text-right text-muted">{r.responses}</td>
                          <td className="py-2.5 text-right text-muted">{r.interviews}</td>
                          <td className="py-2.5 text-right font-medium">{r.responseRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Link
                  to="/candidate/resumes"
                  className="mt-4 inline-block text-[13.5px] font-medium text-accent hover:underline"
                >
                  Edit your resumes
                </Link>
              </section>
            )}

            {data.activity.length > 1 && (
              <section className="rounded-xl border border-line bg-white p-6">
                <h2 className="font-display text-[18px] font-600">Applications over time</h2>
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