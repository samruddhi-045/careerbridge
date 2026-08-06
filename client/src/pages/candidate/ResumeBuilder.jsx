import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppHeader from "../../layouts/AppHeader";
import ResumeForm from "../../features/resume/components/ResumeForm";
import TemplatePicker from "../../features/resume/components/TemplatePicker";
import { uid } from "../../features/resume/components/builderUi";
import useAutosave from "../../features/resume/hooks/useAutosave";
import { getResumeRequest, updateResumeRequest } from "../../features/resume/api/resumeApi";
import { parseApiError } from "../../features/auth/api/authApi";

/**
 * react-pdf is ~1.4MB. Loaded normally it lands in the main bundle, so someone
 * visiting the login page downloads a PDF engine they'll never use. lazy()
 * splits it into its own chunk that's fetched only when this page opens.
 */
const ResumePreview = lazy(() => import("../../features/resume/components/ResumePreview"));

const PreviewFallback = () => (
  <div className="flex h-full min-h-[520px] items-center justify-center rounded-xl border border-line bg-white">
    <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
  </div>
);

// ---- API <-> form translation -------------------------------------------
// <input type="date"> only speaks "YYYY-MM-DD"; Mongo hands back full ISO
// strings. Converting in one place at each boundary keeps the date handling
// out of every individual field.
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

/**
 * _key exists only on the client. React needs a stable key per entry, and the
 * server's subdocument _ids can't provide one: the update validator strips
 * unknown fields, so nested _ids don't survive a round trip and Mongoose mints
 * new ones on every save. A locally generated key stays put for the whole
 * editing session, which is exactly what a React key needs to do.
 */
const withKeys = (arr = []) => arr.map((item) => ({ ...item, _key: uid() }));

const fromApi = (resume) => ({
  name: resume.name,
  templateId: resume.templateId,
  contact: {
    fullName: resume.contact?.fullName || "",
    email: resume.contact?.email || "",
    phone: resume.contact?.phone || "",
    location: resume.contact?.location || "",
    links: withKeys(resume.contact?.links),
  },
  summary: resume.summary || "",
  experience: withKeys(resume.experience).map((x) => ({
    ...x,
    location: x.location || "",
    startDate: toDateInput(x.startDate),
    endDate: toDateInput(x.endDate),
    bullets: x.bullets?.length ? x.bullets : [],
  })),
  projects: withKeys(resume.projects).map((x) => ({
    ...x,
    description: x.description || "",
    url: x.url || "",
    techStack: x.techStack || [],
    bullets: x.bullets?.length ? x.bullets : [],
  })),
  education: withKeys(resume.education).map((x) => ({
    ...x,
    degree: x.degree || "",
    fieldOfStudy: x.fieldOfStudy || "",
    grade: x.grade || "",
    startDate: toDateInput(x.startDate),
    endDate: toDateInput(x.endDate),
  })),
  skills: withKeys(resume.skills).map((x) => ({ ...x, items: x.items || [] })),
  certifications: withKeys(resume.certifications).map((x) => ({
    ...x,
    issuer: x.issuer || "",
    url: x.url || "",
    issueDate: toDateInput(x.issueDate),
  })),
  sectionOrder: resume.sectionOrder || [],
});

// Strip _key, drop empty bullets, and turn "" dates into null so the API gets
// exactly the shape its validator expects.
const strip = ({ _key, _id, ...rest }) => rest;
const cleanBullets = (bullets = []) => bullets.map((b) => b.trim()).filter(Boolean);
const orNull = (value) => (value ? value : null);

const toApiPayload = (draft) => ({
  name: draft.name,
  templateId: draft.templateId,
  contact: {
    fullName: draft.contact.fullName,
    email: draft.contact.email,
    phone: draft.contact.phone,
    location: draft.contact.location,
    links: draft.contact.links.map(strip).filter((l) => l.label && l.url),
  },
  summary: draft.summary,
  // Entries missing a required field would fail validation and block every
  // later save, so incomplete rows are held back until they're filled in.
  experience: draft.experience
    .filter((x) => x.title && x.company && x.startDate)
    .map((x) => ({ ...strip(x), endDate: orNull(x.endDate), bullets: cleanBullets(x.bullets) })),
  projects: draft.projects
    .filter((x) => x.name)
    .map((x) => ({ ...strip(x), bullets: cleanBullets(x.bullets) })),
  education: draft.education
    .filter((x) => x.school && x.startDate)
    .map((x) => ({ ...strip(x), endDate: orNull(x.endDate) })),
  skills: draft.skills.filter((x) => x.category).map(strip),
  certifications: draft.certifications
    .filter((x) => x.name)
    .map((x) => ({ ...strip(x), issueDate: orNull(x.issueDate) })),
  sectionOrder: draft.sectionOrder,
});

const statusLabel = {
  idle: "",
  pending: "Unsaved changes",
  saving: "Saving…",
  saved: "All changes saved",
  error: "Couldn't save",
};

export default function ResumeBuilder() {
  const { id } = useParams();
  const [draft, setDraft] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [editingName, setEditingName] = useState(false);
  // On small screens there isn't room for both panes, so they become tabs.
  const [mobileTab, setMobileTab] = useState("edit");

  useEffect(() => {
    getResumeRequest(id)
      .then((res) => setDraft(fromApi(res.data.resume)))
      .catch((err) => setLoadError(parseApiError(err).message));
  }, [id]);

  // useCallback so the autosave effect doesn't re-run on every keystroke.
  const save = useCallback(
    async (current) => {
      try {
        await updateResumeRequest(id, toApiPayload(current));
      } catch (err) {
        throw new Error(parseApiError(err).message);
      }
    },
    [id]
  );

  const { status, error, flush } = useAutosave(draft, save);

  if (loadError) {
    return (
      <div className="min-h-screen">
        <AppHeader />
        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h1 className="font-display text-[26px] font-600">{loadError}</h1>
          <Link
            to="/candidate/resumes"
            className="mt-4 inline-block text-[15px] font-medium text-accent hover:underline"
          >
            Back to my resumes
          </Link>
        </main>
      </div>
    );
  }

  if (!draft) {
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

      {/* Sticky bar: the resume name and the save state stay visible while
          you scroll a long form. */}
      <div className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-6 py-3">
          <Link
            to="/candidate/resumes"
            className="text-[14px] font-medium text-muted transition-colors hover:text-ink"
          >
            ← Resumes
          </Link>

          <div className="min-w-0 flex-1">
            {editingName ? (
              <input
                autoFocus
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                onBlur={() => setEditingName(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                className="w-full rounded-lg border border-accent bg-white px-2.5 py-1 text-[15px] font-medium focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="max-w-full truncate rounded-lg px-2.5 py-1 text-[15px] font-medium transition-colors hover:bg-white"
                title="Rename"
              >
                {draft.name}
              </button>
            )}
          </div>

          <span
            className={`shrink-0 text-[13px] ${status === "error" ? "text-danger" : "text-muted"}`}
            aria-live="polite"
          >
            {status === "error" ? error || statusLabel.error : statusLabel[status]}
          </span>

          {status === "error" && (
            <button
              onClick={flush}
              className="shrink-0 rounded-lg border border-danger/30 px-3 py-1.5 text-[13px] font-medium text-danger hover:border-danger/60"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Pane switcher, only on small screens */}
      <div className="mx-auto flex max-w-[1400px] gap-2 px-6 pt-4 lg:hidden">
        {["edit", "preview"].map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
              mobileTab === tab
                ? "border-accent bg-accent-soft text-accent"
                : "border-line bg-white text-muted"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <main className="mx-auto max-w-[1400px] px-6 pb-6 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-6">
        <div className={mobileTab === "edit" ? "" : "hidden lg:block"}>
          <ResumeForm draft={draft} setDraft={setDraft} />

          <p className="mt-8 text-center text-[13px] text-muted">
            Changes save automatically. Use the arrows on each section to reorder them.
          </p>
        </div>

        {/* Sticky so the preview stays in view while the form scrolls */}
        <aside
          className={`${mobileTab === "preview" ? "" : "hidden lg:block"} lg:sticky lg:top-[60px] lg:h-[calc(100vh-72px)]`}
        >
          <div className="flex h-full flex-col gap-3">
            <TemplatePicker
              value={draft.templateId}
              onChange={(templateId) => setDraft((d) => ({ ...d, templateId }))}
            />
            {/* min-h-0 lets this shrink to the sticky column height; without it
                the viewer overflows and the whole page grows a scrollbar. */}
            <div className="min-h-[70vh] flex-1 lg:min-h-0">
              <Suspense fallback={<PreviewFallback />}>
                <ResumePreview draft={draft} />
              </Suspense>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}