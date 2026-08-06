import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppHeader from "../../layouts/AppHeader";
import JobCard from "../../features/job/components/JobCard";
import { listSavedJobsRequest } from "../../features/job/api/publicJobApi";
import { parseApiError } from "../../features/auth/api/authApi";

export default function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const res = await listSavedJobsRequest();
      setJobs(res.data.jobs);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-6 py-12 rise">
        <p className="eyebrow text-muted">Shortlist</p>
        <h1 className="mt-3 font-display text-[34px] font-600 leading-tight tracking-[-0.02em]">
          Saved jobs
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Roles you've bookmarked. Unsaving one removes it from here immediately.
        </p>

        {error && (
          <div className="mt-6 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">
            {error}
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-[150px] animate-pulse rounded-xl border border-line bg-white" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-white/50 px-6 py-16 text-center">
              <p className="font-display text-[19px] font-600">Nothing saved yet</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[14px] text-muted">
                Bookmark roles while you browse and they'll collect here.
              </p>
              <Link
                to="/jobs"
                className="mt-5 inline-block rounded-lg bg-accent px-4 py-2.5 text-[15px] font-medium text-white hover:bg-accent/90"
              >
                Browse jobs
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}