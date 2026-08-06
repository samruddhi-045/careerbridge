import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppHeader from "../../layouts/AppHeader";
import TextField from "../../components/ui/TextField";
import TextArea from "../../components/ui/TextArea";
import Button from "../../components/ui/Button";
import SelectField from "../../features/job/components/SelectField";
import BulletEditor from "../../features/job/components/BulletEditor";
import SkillsInput from "../../features/job/components/SkillsInput";
import { parseApiError } from "../../features/auth/api/authApi";
import {
  createJobRequest,
  getJobRequest,
  updateJobRequest,
  changeJobStatusRequest,
} from "../../features/job/api/jobApi";
import {
  EMPLOYMENT_TYPES,
  WORK_MODES,
  EXPERIENCE_LEVELS,
  CURRENCIES,
  SALARY_PERIODS,
  STATUS_STYLES,
} from "../../features/job/jobConstants";

const emptyJob = {
  title: "",
  description: "",
  responsibilities: [""],
  requirements: [""],
  niceToHaves: [],
  skills: [],
  employmentType: "full_time",
  workMode: "onsite",
  experienceLevel: "entry",
  location: { city: "", country: "" },
  salary: { min: "", max: "", currency: "INR", period: "yearly", isVisible: true },
  openings: 1,
  closesAt: "",
};

const toDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");

const fromApi = (job) => ({
  title: job.title || "",
  description: job.description || "",
  responsibilities: job.responsibilities?.length ? job.responsibilities : [""],
  requirements: job.requirements?.length ? job.requirements : [""],
  niceToHaves: job.niceToHaves || [],
  skills: job.skills || [],
  employmentType: job.employmentType,
  workMode: job.workMode,
  experienceLevel: job.experienceLevel,
  location: { city: job.location?.city || "", country: job.location?.country || "" },
  salary: {
    min: job.salary?.min ?? "",
    max: job.salary?.max ?? "",
    currency: job.salary?.currency || "INR",
    period: job.salary?.period || "yearly",
    isVisible: job.salary?.isVisible ?? true,
  },
  openings: job.openings || 1,
  closesAt: toDateInput(job.closesAt),
});

const cleanList = (arr) => arr.map((s) => s.trim()).filter(Boolean);

// "" must become null, not 0 -- an empty salary field means "not specified",
// and 0 would render as a real ₹0 minimum.
const toNumberOrNull = (v) => (v === "" || v == null ? null : Number(v));

const toPayload = (form) => ({
  title: form.title.trim(),
  description: form.description.trim(),
  responsibilities: cleanList(form.responsibilities),
  requirements: cleanList(form.requirements),
  niceToHaves: cleanList(form.niceToHaves),
  skills: form.skills,
  employmentType: form.employmentType,
  workMode: form.workMode,
  experienceLevel: form.experienceLevel,
  location: form.location,
  salary: {
    min: toNumberOrNull(form.salary.min),
    max: toNumberOrNull(form.salary.max),
    currency: form.salary.currency,
    period: form.salary.period,
    isVisible: form.salary.isVisible,
  },
  openings: Number(form.openings) || 1,
  closesAt: form.closesAt || null,
});

export default function JobForm() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyJob);
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    if (isNew) return;
    getJobRequest(id)
      .then((res) => {
        setForm(fromApi(res.data.job));
        setStatus(res.data.job.status);
      })
      .catch((err) => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setNested = (group, key, value) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));

  /**
   * Explicit save, not autosave.
   *
   * The resume builder autosaves because it's a private document. A job posting
   * is different: publishing is a deliberate act with an audience, and a
   * recruiter half-way through a sentence shouldn't have that hit the database.
   * Drafts exist precisely so "save and come back" is a real option.
   */
  const save = async (publish = false) => {
    setSaving(true);
    setError("");
    setFieldErrors({});
    setSavedNote("");

    try {
      const payload = toPayload(form);

      if (isNew) {
        const res = await createJobRequest({ ...payload, status: publish ? "published" : "draft" });
        navigate(`/recruiter/jobs/${res.data.job.id || res.data.job._id}`, { replace: true });
        setSavedNote(publish ? "Published" : "Draft saved");
        return;
      }

      await updateJobRequest(id, payload);

      // Status lives behind its own endpoint because the server validates
      // which transitions are legal.
      if (publish && status !== "published") {
        const res = await changeJobStatusRequest(id, "published");
        setStatus(res.data.job.status);
      }

      setSavedNote(publish ? "Published" : "Changes saved");
      setTimeout(() => setSavedNote(""), 2500);
    } catch (err) {
      const parsed = parseApiError(err);
      setFieldErrors(parsed.fieldErrors);
      if (!Object.keys(parsed.fieldErrors).length) setError(parsed.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="flex min-h-[60vh] items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <div className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-6 py-3">
          <Link
            to="/recruiter/jobs"
            className="text-[14px] font-medium text-muted transition-colors hover:text-ink"
          >
            ← Jobs
          </Link>

          <div className="min-w-0 flex-1">
            <span className="truncate text-[15px] font-medium">
              {form.title || (isNew ? "New job" : "Untitled job")}
            </span>
            {!isNew && (
              <span
                className={`ml-2 rounded-md px-2 py-0.5 text-[12px] font-medium capitalize ${STATUS_STYLES[status]}`}
              >
                {status}
              </span>
            )}
          </div>

          {savedNote && <span className="text-[13px] text-muted">{savedNote}</span>}

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => save(false)}
              disabled={saving}
              className="rounded-lg border border-line bg-white px-3.5 py-2 text-[14px] font-medium transition-colors hover:border-ink/30 disabled:opacity-60"
            >
              {status === "draft" ? "Save draft" : "Save"}
            </button>
            {status !== "published" && (
              <button
                type="button"
                onClick={() => save(true)}
                disabled={saving}
                className="rounded-lg bg-accent px-3.5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-60"
              >
                Publish
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">
            {error}
          </div>
        )}

        <div className="space-y-5">
          {/* Basics */}
          <section className="rounded-xl border border-line bg-white">
            <header className="border-b border-line px-5 py-4">
              <h2 className="font-display text-[17px] font-600">The role</h2>
            </header>
            <div className="space-y-5 px-5 py-5">
              <TextField
                label="Job title"
                name="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                error={fieldErrors.title}
                autoFocus={isNew}
                hint="What candidates search for — 'Frontend Developer', not 'Ninja Rockstar'."
              />
              <TextArea
                label="Short description"
                name="description"
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                hint="Two or three lines on the team and what this person will own."
              />
              <div className="grid gap-5 sm:grid-cols-3">
                <SelectField
                  label="Employment type"
                  name="employmentType"
                  value={form.employmentType}
                  onChange={(e) => set("employmentType", e.target.value)}
                  options={EMPLOYMENT_TYPES}
                />
                <SelectField
                  label="Work mode"
                  name="workMode"
                  value={form.workMode}
                  onChange={(e) => set("workMode", e.target.value)}
                  options={WORK_MODES}
                />
                <SelectField
                  label="Experience"
                  name="experienceLevel"
                  value={form.experienceLevel}
                  onChange={(e) => set("experienceLevel", e.target.value)}
                  options={EXPERIENCE_LEVELS}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="City"
                  name="city"
                  value={form.location.city}
                  onChange={(e) => setNested("location", "city", e.target.value)}
                />
                <TextField
                  label="Country"
                  name="country"
                  value={form.location.country}
                  onChange={(e) => setNested("location", "country", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Structured detail */}
          <section className="rounded-xl border border-line bg-white">
            <header className="border-b border-line px-5 py-4">
              <h2 className="font-display text-[17px] font-600">What the job involves</h2>
              <p className="mt-0.5 text-[13px] text-muted">
                One point per line. Kept separate so candidates can be matched against them later.
              </p>
            </header>
            <div className="space-y-6 px-5 py-5">
              <BulletEditor
                label="Responsibilities"
                items={form.responsibilities}
                onChange={(v) => set("responsibilities", v)}
                placeholder="Build and ship features across the React frontend"
              />
              <BulletEditor
                label="Requirements"
                hint="The things a candidate genuinely needs. Keep this list honest and short."
                items={form.requirements}
                onChange={(v) => set("requirements", v)}
                placeholder="1+ years working with React in production"
              />
              <BulletEditor
                label="Nice to have"
                items={form.niceToHaves}
                onChange={(v) => set("niceToHaves", v)}
                placeholder="Experience with TypeScript"
              />
              <SkillsInput items={form.skills} onChange={(v) => set("skills", v)} />
            </div>
          </section>

          {/* Compensation */}
          <section className="rounded-xl border border-line bg-white">
            <header className="border-b border-line px-5 py-4">
              <h2 className="font-display text-[17px] font-600">Compensation & logistics</h2>
            </header>
            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-4 sm:grid-cols-4">
                <TextField
                  label="Minimum"
                  name="salaryMin"
                  type="number"
                  value={form.salary.min}
                  onChange={(e) => setNested("salary", "min", e.target.value)}
                />
                <TextField
                  label="Maximum"
                  name="salaryMax"
                  type="number"
                  value={form.salary.max}
                  onChange={(e) => setNested("salary", "max", e.target.value)}
                  error={fieldErrors["salary.max"]}
                />
                <SelectField
                  label="Currency"
                  name="currency"
                  value={form.salary.currency}
                  onChange={(e) => setNested("salary", "currency", e.target.value)}
                  options={CURRENCIES}
                />
                <SelectField
                  label="Period"
                  name="period"
                  value={form.salary.period}
                  onChange={(e) => setNested("salary", "period", e.target.value)}
                  options={SALARY_PERIODS}
                />
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 text-[14px] text-muted">
                <input
                  type="checkbox"
                  checked={form.salary.isVisible}
                  onChange={(e) => setNested("salary", "isVisible", e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line accent-accent"
                />
                <span>
                  Show salary to candidates
                  <span className="block text-[13px] text-muted/80">
                    Hidden ranges still power salary filters, so candidates who filter by pay can
                    still find this role.
                  </span>
                </span>
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Number of openings"
                  name="openings"
                  type="number"
                  value={form.openings}
                  onChange={(e) => set("openings", e.target.value)}
                />
                <TextField
                  label="Applications close"
                  name="closesAt"
                  type="date"
                  value={form.closesAt}
                  onChange={(e) => set("closesAt", e.target.value)}
                  hint="Optional"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => save(false)} loading={saving}>
            {status === "draft" ? "Save draft" : "Save changes"}
          </Button>
          {status !== "published" && (
            <Button type="button" onClick={() => save(true)} loading={saving}>
              Publish job
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}