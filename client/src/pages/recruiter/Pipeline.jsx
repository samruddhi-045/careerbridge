import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppHeader from "../../layouts/AppHeader";
import PipelineBoard from "../../features/application/components/PipelineBoard";
import ApplicantDrawer from "../../features/application/components/ApplicantDrawer";
import { listJobsRequest } from "../../features/job/api/jobApi";
import {
  listCompanyApplicationsRequest,
  changeApplicationStatusRequest,
} from "../../features/application/api/recruiterApplicationApi";
import { parseApiError } from "../../features/auth/api/authApi";

export default function Pipeline() {
  const [params, setParams] = useSearchParams();
  const jobId = params.get("jobId") || "";

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  // Job filter comes from the recruiter's own published/closed jobs
  useEffect(() => {
    listJobsRequest({ limit: 50 })
      .then((res) => setJobs(res.data.jobs))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const res = await listCompanyApplicationsRequest(jobId ? { jobId } : {});
      setApplications(res.data.applications);
      setCounts(res.data.counts || {});
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Optimistic move: the card jumps columns immediately, and reverts if the
   * server refuses. Dragging something and watching it sit still for 300ms
   * feels broken, and this is a drag-heavy screen.
   */
  const move = async (application, status) => {
    const previous = applications;
    setApplications((list) =>
      list.map((a) => (a.id === application.id ? { ...a, status } : a))
    );

    try {
      await changeApplicationStatusRequest(application.id, status);
      // Refresh in the background so the counts stay honest
      load();
    } catch (err) {
      setApplications(previous);
      setError(parseApiError(err).message);
    }
  };

  const total = applications.length;

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-[1400px] px-6 py-10 rise">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-muted">Hiring</p>
            <h1 className="mt-3 font-display text-[32px] font-600 leading-tight tracking-[-0.02em]">
              Pipeline
            </h1>
            <p className="mt-2 max-w-lg text-[15px] text-muted">
              Drag a candidate to move them through your stages. Click one to read what they
              submitted.
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

        <div className="mt-8">
          {loading ? (
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-[400px] w-[260px] shrink-0 animate-pulse rounded-xl border border-line bg-white" />
              ))}
            </div>
          ) : total === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-white/50 px-6 py-20 text-center">
              <p className="font-display text-[19px] font-600">No applications yet</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[14px] text-muted">
                {jobId
                  ? "Nobody has applied to this role yet."
                  : "Once candidates start applying, they'll appear here ready to screen."}
              </p>
              <Link
                to="/recruiter/jobs"
                className="mt-5 inline-block rounded-lg border border-line bg-white px-4 py-2.5 text-[15px] font-medium hover:border-ink/30"
              >
                Manage jobs
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-3 text-[13.5px] text-muted">
                {total} {total === 1 ? "applicant" : "applicants"}
                {counts.withdrawn ? ` · ${counts.withdrawn} withdrew` : ""}
              </p>
              <PipelineBoard applications={applications} onMove={move} onOpen={setOpenId} />
            </>
          )}
        </div>
      </main>

      {openId && (
        <ApplicantDrawer
          applicationId={openId}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}