import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PublicHeader from "../../layouts/PublicHeader";
import SaveJobButton from "../../features/job/components/SaveJobButton";
import { useAuth } from "../../context/AuthContext";
import { getPublicJobRequest } from "../../features/job/api/publicJobApi";
import { parseApiError } from "../../features/auth/api/authApi";
import {
  employmentLabel,
  workModeLabel,
  experienceLabel,
  formatSalary,
  relativeTime,
} from "../../features/job/jobConstants";

const BulletSection = ({ title, items }) =>
  items?.length ? (
    <section className="mt-8">
      <h2 className="font-display text-[18px] font-600">{title}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  ) : null;

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicJobRequest(id)
      .then((res) => setJob(res.data.job))
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <main className="flex min-h-[60vh] items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <PublicHeader />
        <main className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="font-display text-[26px] font-600">{error}</h1>
          <Link to="/jobs" className="mt-4 inline-block text-[15px] font-medium text-accent hover:underline">
            Browse other jobs
          </Link>
        </main>
      </div>
    );
  }

  const salary = formatSalary(job.salary);
  const place = [job.location?.city, job.location?.country].filter(Boolean).join(", ");
  const isClosed = job.status === "closed";
  const isPastDeadline = job.closesAt && new Date(job.closesAt) < new Date();
  const canApply = !isClosed && !isPastDeadline;

  // Applying needs a candidate account. Signed-out visitors go to login and
  // come back here -- this is the moment signing up has a point.
  const handleApply = () => {
    if (!user) return navigate("/login", { state: { from: `/jobs/${id}` } });
    // wired up in the next slice
  };

  return (
    <div className="min-h-screen">
      <PublicHeader />

      <main className="mx-auto max-w-4xl px-6 py-10 rise">
        <Link to="/jobs" className="text-[14px] font-medium text-muted hover:text-ink">
          ← All jobs
        </Link>

        <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-10">
          <div>
            <h1 className="font-display text-[32px] font-600 leading-tight tracking-[-0.02em]">
              {job.title}
            </h1>
            <p className="mt-2 text-[16px] text-muted">
              {job.company?.name}
              {place && ` · ${place}`}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {[workModeLabel(job.workMode), employmentLabel(job.employmentType), experienceLabel(job.experienceLevel)].map(
                (label) => (
                  <span key={label} className="rounded-md bg-paper px-2.5 py-1 text-[13px] text-muted">
                    {label}
                  </span>
                )
              )}
            </div>

            {isClosed && (
              <div className="mt-5 rounded-lg border border-line bg-paper px-4 py-3 text-[14px] text-muted">
                This role is no longer accepting applications.
              </div>
            )}

            {job.description && (
              <p className="mt-7 whitespace-pre-line text-[15px] leading-relaxed">{job.description}</p>
            )}

            <BulletSection title="What you'll do" items={job.responsibilities} />
            <BulletSection title="What we're looking for" items={job.requirements} />
            <BulletSection title="Nice to have" items={job.niceToHaves} />

            {!!job.skills?.length && (
              <section className="mt-8">
                <h2 className="font-display text-[18px] font-600">Skills</h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.skills.map((s) => (
                    <span key={s} className="rounded-md bg-accent-soft px-2.5 py-1 text-[13.5px] font-medium text-accent">
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {job.company?.description && (
              <section className="mt-10 rounded-xl border border-line bg-white p-6">
                <h2 className="font-display text-[18px] font-600">About {job.company.name}</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{job.company.description}</p>
                {job.company.website && (
                  <a
                    href={job.company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-[14px] font-medium text-accent hover:underline"
                  >
                    Visit website
                  </a>
                )}
              </section>
            )}
          </div>

          {/* Sticky action panel: on a long posting the Apply button shouldn't
              be something you have to scroll back up to find. */}
          <aside className="mt-10 lg:mt-0">
            <div className="lg:sticky lg:top-6">
              <div className="rounded-xl border border-line bg-white p-5">
                <p className="eyebrow text-muted">Compensation</p>
                <p className="mt-1.5 text-[16px] font-medium">
                  {salary || <span className="font-normal text-muted">Not disclosed</span>}
                </p>

                <dl className="mt-5 space-y-3 text-[14px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Openings</dt>
                    <dd>{job.openings}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">Posted</dt>
                    <dd>{relativeTime(job.publishedAt)}</dd>
                  </div>
                  {job.closesAt && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Closes</dt>
                      <dd>{new Date(job.closesAt).toLocaleDateString()}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-5 space-y-2">
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={!canApply}
                    className="w-full rounded-lg bg-accent px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {canApply ? "Apply now" : "Applications closed"}
                  </button>
                  <div className="[&>button]:w-full [&>button]:justify-center">
                    <SaveJobButton jobId={job.id} initialSaved={job.isSaved} variant="full" />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}