import { useEffect, useState } from "react";
import AppHeader from "../../layouts/AppHeader";
import TextField from "../../components/ui/TextField";
import TextArea from "../../components/ui/TextArea";
import Button from "../../components/ui/Button";
import {
  getMyProfileRequest,
  createMyProfileRequest,
  updateMyProfileRequest,
} from "../../features/candidateProfile/api/candidateProfileApi";
import { parseApiError } from "../../features/auth/api/authApi";

const emptyExperience = { title: "", company: "", location: "", startDate: "", endDate: "", description: "" };
const emptyEducation = { school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" };
const emptyLink = { label: "", url: "" };

// ISO date from the API -> "YYYY-MM-DD" for <input type="date">
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const emptyForm = {
  headline: "",
  bio: "",
  phone: "",
  location: { city: "", country: "" },
  skills: "",
  resumeUrl: "",
  openToWork: true,
  experience: [],
  education: [],
  portfolioLinks: [],
};

const fromApi = (profile) => ({
  headline: profile.headline || "",
  bio: profile.bio || "",
  phone: profile.phone || "",
  location: { city: profile.location?.city || "", country: profile.location?.country || "" },
  skills: (profile.skills || []).join(", "),
  resumeUrl: profile.resumeUrl || "",
  openToWork: profile.openToWork ?? true,
  experience: (profile.experience || []).map((x) => ({ ...x, startDate: toDateInput(x.startDate), endDate: toDateInput(x.endDate) })),
  education: (profile.education || []).map((x) => ({ ...x, startDate: toDateInput(x.startDate), endDate: toDateInput(x.endDate) })),
  portfolioLinks: profile.portfolioLinks || [],
});

const toApiPayload = (form) => ({
  headline: form.headline,
  bio: form.bio,
  phone: form.phone,
  location: form.location,
  skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
  resumeUrl: form.resumeUrl,
  openToWork: form.openToWork,
  experience: form.experience.map((x) => ({ ...x, endDate: x.endDate || null })),
  education: form.education.map((x) => ({ ...x, endDate: x.endDate || null })),
  portfolioLinks: form.portfolioLinks,
});

export default function CandidateProfile() {
  const [form, setForm] = useState(emptyForm);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getMyProfileRequest()
      .then((res) => {
        setForm(fromApi(res.data.profile));
        setHasProfile(true);
      })
      .catch(() => setHasProfile(false))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setLocation = (key, value) => setForm((f) => ({ ...f, location: { ...f.location, [key]: value } }));

  const addRow = (field, empty) => setForm((f) => ({ ...f, [field]: [...f[field], { ...empty }] }));
  const removeRow = (field, index) =>
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));
  const updateRow = (field, index, key, value) =>
    setForm((f) => ({
      ...f,
      [field]: f[field].map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = toApiPayload(form);
      const res = hasProfile ? await updateMyProfileRequest(payload) : await createMyProfileRequest(payload);
      setHasProfile(true);
      setMessage(res.message);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-3xl px-6 py-14 rise">
        <p className="eyebrow text-muted">Candidate profile</p>
        <h1 className="mt-3 font-display text-[32px] font-600 leading-tight tracking-[-0.02em]">
          {hasProfile ? "Edit your profile" : "Create your profile"}
        </h1>
        <p className="mt-2 text-[15px] text-muted">This is what recruiters see when they review your application.</p>

        {message && (
          <div className="mt-6 rounded-lg border border-line bg-white px-4 py-3 text-[14px] text-ink">{message}</div>
        )}
        {error && (
          <div className="mt-6 rounded-lg border border-danger/25 bg-danger/[0.04] px-4 py-3 text-[14px] text-danger">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-10">
          {/* Basics */}
          <section className="space-y-5">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">Basics</h2>
            <TextField label="Headline" name="headline" value={form.headline} onChange={(e) => set("headline", e.target.value)} hint="e.g. Frontend Engineer, 4 years" />
            <TextArea label="Bio" name="bio" value={form.bio} onChange={(e) => set("bio", e.target.value)} rows={4} />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="Phone" name="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              <TextField label="Resume URL" name="resumeUrl" value={form.resumeUrl} onChange={(e) => set("resumeUrl", e.target.value)} hint="Link to a hosted PDF" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField label="City" name="city" value={form.location.city} onChange={(e) => setLocation("city", e.target.value)} />
              <TextField label="Country" name="country" value={form.location.country} onChange={(e) => setLocation("country", e.target.value)} />
            </div>
            <TextField label="Skills" name="skills" value={form.skills} onChange={(e) => set("skills", e.target.value)} hint="Comma-separated, e.g. React, Node.js, SQL" />
            <label className="flex items-center gap-2 text-[14px] text-ink">
              <input type="checkbox" checked={form.openToWork} onChange={(e) => set("openToWork", e.target.checked)} className="h-4 w-4 rounded border-line text-accent focus:ring-accent/20" />
              Open to work
            </label>
          </section>

          {/* Experience */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">Experience</h2>
              <button type="button" onClick={() => addRow("experience", emptyExperience)} className="text-[13px] font-medium text-accent hover:underline">
                + Add role
              </button>
            </div>
            {form.experience.map((row, i) => (
              <div key={i} className="space-y-4 rounded-lg border border-line p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Title" name={`exp-title-${i}`} value={row.title} onChange={(e) => updateRow("experience", i, "title", e.target.value)} />
                  <TextField label="Company" name={`exp-company-${i}`} value={row.company} onChange={(e) => updateRow("experience", i, "company", e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField label="Location" name={`exp-location-${i}`} value={row.location} onChange={(e) => updateRow("experience", i, "location", e.target.value)} />
                  <TextField label="Start date" name={`exp-start-${i}`} type="date" value={row.startDate} onChange={(e) => updateRow("experience", i, "startDate", e.target.value)} />
                  <TextField label="End date" name={`exp-end-${i}`} type="date" value={row.endDate} onChange={(e) => updateRow("experience", i, "endDate", e.target.value)} hint="Leave blank if current" />
                </div>
                <TextArea label="Description" name={`exp-desc-${i}`} value={row.description} onChange={(e) => updateRow("experience", i, "description", e.target.value)} rows={3} />
                <button type="button" onClick={() => removeRow("experience", i)} className="text-[13px] font-medium text-danger hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </section>

          {/* Education */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">Education</h2>
              <button type="button" onClick={() => addRow("education", emptyEducation)} className="text-[13px] font-medium text-accent hover:underline">
                + Add school
              </button>
            </div>
            {form.education.map((row, i) => (
              <div key={i} className="space-y-4 rounded-lg border border-line p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="School" name={`edu-school-${i}`} value={row.school} onChange={(e) => updateRow("education", i, "school", e.target.value)} />
                  <TextField label="Degree" name={`edu-degree-${i}`} value={row.degree} onChange={(e) => updateRow("education", i, "degree", e.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField label="Field of study" name={`edu-field-${i}`} value={row.fieldOfStudy} onChange={(e) => updateRow("education", i, "fieldOfStudy", e.target.value)} />
                  <TextField label="Start date" name={`edu-start-${i}`} type="date" value={row.startDate} onChange={(e) => updateRow("education", i, "startDate", e.target.value)} />
                  <TextField label="End date" name={`edu-end-${i}`} type="date" value={row.endDate} onChange={(e) => updateRow("education", i, "endDate", e.target.value)} />
                </div>
                <button type="button" onClick={() => removeRow("education", i)} className="text-[13px] font-medium text-danger hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </section>

          {/* Portfolio links */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">Portfolio links</h2>
              <button type="button" onClick={() => addRow("portfolioLinks", emptyLink)} className="text-[13px] font-medium text-accent hover:underline">
                + Add link
              </button>
            </div>
            {form.portfolioLinks.map((row, i) => (
              <div key={i} className="grid gap-4 rounded-lg border border-line p-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
                <TextField label="Label" name={`link-label-${i}`} value={row.label} onChange={(e) => updateRow("portfolioLinks", i, "label", e.target.value)} />
                <TextField label="URL" name={`link-url-${i}`} value={row.url} onChange={(e) => updateRow("portfolioLinks", i, "url", e.target.value)} />
                <button type="button" onClick={() => removeRow("portfolioLinks", i)} className="pb-2.5 text-[13px] font-medium text-danger hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </section>

          <Button type="submit" loading={saving}>{hasProfile ? "Save changes" : "Create profile"}</Button>
        </form>
      </main>
    </div>
  );
}
