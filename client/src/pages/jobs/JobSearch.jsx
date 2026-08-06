import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PublicHeader from "../../layouts/PublicHeader";
import JobCard from "../../features/job/components/JobCard";
import JobFilters from "../../features/job/components/JobFilters";
import { searchJobsRequest } from "../../features/job/api/publicJobApi";
import { parseApiError } from "../../features/auth/api/authApi";

const MULTI_KEYS = ["workMode", "employmentType", "experienceLevel"];

/**
 * Filter state lives in the URL, not useState.
 *
 * That makes a filtered search shareable, bookmarkable, and correct with the
 * back button -- all of which people expect from a job board and none of which
 * you get from component state.
 */
const readFilters = (params) => {
  const filters = { salaryMin: params.get("salaryMin") || "", city: params.get("city") || "" };
  MULTI_KEYS.forEach((k) => {
    const raw = params.get(k);
    filters[k] = raw ? raw.split(",").filter(Boolean) : [];
  });
  return filters;
};

const writeParams = (filters, q, page) => {
  const next = {};
  if (q) next.q = q;
  if (page > 1) next.page = String(page);
  MULTI_KEYS.forEach((k) => {
    if (filters[k]?.length) next[k] = filters[k].join(",");
  });
  if (filters.salaryMin) next.salaryMin = filters.salaryMin;
  if (filters.city?.trim()) next.city = filters.city.trim();
  return next;
};

export default function JobSearch() {
  const [params, setParams] = useSearchParams();

  const q = params.get("q") || "";
  const page = Number(params.get("page")) || 1;
  const filters = useMemo(() => readFilters(params), [params]);

  const [queryInput, setQueryInput] = useState(q);
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // keep the input in sync when the URL changes from outside (back button)
  useEffect(() => setQueryInput(q), [q]);

  const activeCount =
    MULTI_KEYS.reduce((n, k) => n + (filters[k]?.length || 0), 0) +
    (filters.salaryMin ? 1 : 0) +
    (filters.city?.trim() ? 1 : 0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const res = await searchJobsRequest(Object.fromEntries(params));
      setJobs(res.data.jobs);
      setMeta(res.meta);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  // Changing a filter resets to page 1 -- staying on page 4 of a different
  // result set is how people end up staring at "no results".
  const applyFilters = (next) => setParams(writeParams(next, q, 1));

  const submitSearch = (e) => {
    e.preventDefault();
    setParams(writeParams(filters, queryInput.trim(), 1));
  };

  const goToPage = (n) => {
    setParams(writeParams(filters, q, n));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <PublicHeader />

      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <h1 className="font-display text-[30px] font-600 leading-tight tracking-[-0.02em]">
            Find your next role
          </h1>

          <form onSubmit={submitSearch} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Job title, skill, or company"
              className="flex-1 rounded-lg border border-line bg-white px-4 py-3 text-[15px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent/90"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        {/* Mobile: filters collapse behind a button rather than pushing results
            below the fold. */}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="mb-4 w-full rounded-lg border border-line bg-white px-4 py-2.5 text-[14px] font-medium lg:hidden"
        >
          {showFilters ? "Hide filters" : `Filters${activeCount ? ` (${activeCount})` : ""}`}
        </button>

        <aside className={`${showFilters ? "" : "hidden"} mb-8 lg:mb-0 lg:block`}>
          <div className="lg:sticky lg:top-6">
            <JobFilters
              filters={filters}
              onChange={applyFilters}
              onClear={() => setParams(q ? { q } : {})}
              activeCount={activeCount}
            />
          </div>
        </aside>

        <section>
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <p className="text-[14px] text-muted">
              {loading
                ? "Searching…"
                : `${meta.total} ${meta.total === 1 ? "job" : "jobs"}${q ? ` for "${q}"` : ""}`}
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[150px] animate-pulse rounded-xl border border-line bg-white" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line bg-white/50 px-6 py-16 text-center">
              <p className="font-display text-[19px] font-600">No jobs match that</p>
              <p className="mx-auto mt-1.5 max-w-sm text-[14px] text-muted">
                {activeCount > 0
                  ? "Try removing a filter or two."
                  : "Nothing has been posted yet. Check back soon."}
              </p>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => setParams(q ? { q } : {})}
                  className="mt-4 rounded-lg border border-line bg-white px-4 py-2 text-[14px] font-medium hover:border-ink/30"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </ul>

              {meta.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                    className="rounded-lg border border-line bg-white px-3.5 py-2 text-[14px] font-medium disabled:opacity-40 hover:border-ink/30"
                  >
                    Previous
                  </button>
                  <span className="px-2 text-[14px] text-muted">
                    Page {page} of {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= meta.totalPages}
                    onClick={() => goToPage(page + 1)}
                    className="rounded-lg border border-line bg-white px-3.5 py-2 text-[14px] font-medium disabled:opacity-40 hover:border-ink/30"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}