import { Link } from "react-router-dom";
import SaveJobButton from "./SaveJobButton";
import { employmentLabel, workModeLabel, formatSalary, relativeTime } from "../jobConstants";

export default function JobCard({ job }) {
  const salary = formatSalary(job.salary);
  const place = [job.location?.city, job.location?.country].filter(Boolean).join(", ");

  return (
    <li className="group relative rounded-xl border border-line bg-white p-5 transition-colors hover:border-ink/25">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Stretched link: the whole card is clickable, but the save button
              sits above it in z-order so it stays independently clickable. */}
          <Link to={`/jobs/${job.id}`} className="after:absolute after:inset-0">
            <h3 className="text-[17px] font-medium leading-snug group-hover:text-accent">
              {job.title}
            </h3>
          </Link>

          <p className="mt-1 text-[14px] text-muted">
            {job.company?.name}
            {place && ` · ${place}`}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-paper px-2 py-0.5 text-[12.5px] text-muted">
              {workModeLabel(job.workMode)}
            </span>
            <span className="rounded-md bg-paper px-2 py-0.5 text-[12.5px] text-muted">
              {employmentLabel(job.employmentType)}
            </span>
            {job.skills.slice(0, 4).map((s) => (
              <span key={s} className="rounded-md bg-accent-soft px-2 py-0.5 text-[12.5px] text-accent">
                {s}
              </span>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {salary ? (
              <span className="text-[14px] font-medium text-ink">{salary}</span>
            ) : (
              <span className="text-[14px] text-muted">Salary not disclosed</span>
            )}
            <span className="text-[13px] text-muted">
              posted {relativeTime(job.publishedAt)}
            </span>
          </div>
        </div>

        <div className="relative z-10 shrink-0">
          <SaveJobButton jobId={job.id} initialSaved={job.isSaved} />
        </div>
      </div>
    </li>
  );
}