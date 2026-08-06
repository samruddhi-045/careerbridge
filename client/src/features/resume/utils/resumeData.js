/**
 * Turns builder draft state into the shape templates consume.
 *
 * Templates should never contain formatting logic -- if "Jun 2025 – Present"
 * were built inside each template, fixing a date bug would mean editing every
 * one of them. They receive display-ready strings and only decide layout.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const formatMonth = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

/** "Jun 2025 – Present" / "Aug 2022 – May 2026" */
export const formatRange = (start, end) => {
  const from = formatMonth(start);
  if (!from) return "";
  return `${from} – ${end ? formatMonth(end) : "Present"}`;
};

const clean = (arr = []) => arr.map((s) => (typeof s === "string" ? s.trim() : s)).filter(Boolean);

/**
 * Also drops entries that are still blank, so a half-added row in the builder
 * doesn't render as an empty block in the preview.
 */
export const toTemplateData = (draft) => ({
  contact: {
    fullName: draft.contact.fullName?.trim() || "",
    email: draft.contact.email?.trim() || "",
    phone: draft.contact.phone?.trim() || "",
    location: draft.contact.location?.trim() || "",
    links: (draft.contact.links || []).filter((l) => l.label && l.url),
  },
  summary: draft.summary?.trim() || "",
  experience: (draft.experience || [])
    .filter((x) => x.title || x.company)
    .map((x) => ({
      title: x.title,
      company: x.company,
      location: x.location,
      dates: formatRange(x.startDate, x.endDate),
      bullets: clean(x.bullets),
    })),
  projects: (draft.projects || [])
    .filter((x) => x.name)
    .map((x) => ({
      name: x.name,
      description: x.description,
      url: x.url,
      techStack: clean(x.techStack),
      bullets: clean(x.bullets),
    })),
  education: (draft.education || [])
    .filter((x) => x.school)
    .map((x) => ({
      school: x.school,
      // "B.E. — Computer Engineering", collapsing gracefully if one is missing
      degree: [x.degree, x.fieldOfStudy].filter(Boolean).join(" — "),
      grade: x.grade,
      dates: formatRange(x.startDate, x.endDate),
    })),
  skills: (draft.skills || []).filter((g) => g.category && g.items?.length),
  certifications: (draft.certifications || [])
    .filter((c) => c.name)
    .map((c) => ({
      name: c.name,
      issuer: c.issuer,
      date: formatMonth(c.issueDate),
      url: c.url,
    })),
  sectionOrder: draft.sectionOrder || [],
});

/** True when there's nothing worth rendering for a section. */
export const isEmptySection = (data, name) => {
  if (name === "summary") return !data.summary;
  return !(data[name] || []).length;
};