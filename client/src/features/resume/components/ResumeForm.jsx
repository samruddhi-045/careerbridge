import TextField from "../../../components/ui/TextField";
import TextArea from "../../../components/ui/TextArea";
import {
  SectionCard,
  EntryCard,
  AddButton,
  EmptyHint,
  BulletList,
  TagInput,
  uid,
} from "./builderUi";

export const emptyEntries = {
  experience: () => ({ _key: uid(), title: "", company: "", location: "", startDate: "", endDate: "", bullets: [""] }),
  projects: () => ({ _key: uid(), name: "", description: "", url: "", techStack: [], bullets: [""] }),
  education: () => ({ _key: uid(), school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "" }),
  skills: () => ({ _key: uid(), category: "", items: [] }),
  certifications: () => ({ _key: uid(), name: "", issuer: "", issueDate: "", url: "" }),
  links: () => ({ _key: uid(), label: "", url: "" }),
};

const move = (arr, from, to) => {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export default function ResumeForm({ draft, setDraft }) {
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const setContact = (key, value) =>
    setDraft((d) => ({ ...d, contact: { ...d.contact, [key]: value } }));

  // One set of list operations reused by every repeatable section.
  const ops = (key) => ({
    add: () => set(key, [...draft[key], emptyEntries[key]()]),
    remove: (i) => set(key, draft[key].filter((_, idx) => idx !== i)),
    patch: (i, patch) =>
      set(key, draft[key].map((item, idx) => (idx === i ? { ...item, ...patch } : item))),
    up: (i) => (i > 0 ? () => set(key, move(draft[key], i, i - 1)) : null),
    down: (i) => (i < draft[key].length - 1 ? () => set(key, move(draft[key], i, i + 1)) : null),
  });

  // Section reordering, driven by draft.sectionOrder.
  const sectionMove = (name) => {
    const order = draft.sectionOrder;
    const i = order.indexOf(name);
    return {
      onMoveUp: i > 0 ? () => set("sectionOrder", move(order, i, i - 1)) : null,
      onMoveDown: i < order.length - 1 ? () => set("sectionOrder", move(order, i, i + 1)) : null,
    };
  };

  const linkOps = {
    add: () => setContact("links", [...draft.contact.links, emptyEntries.links()]),
    remove: (i) => setContact("links", draft.contact.links.filter((_, idx) => idx !== i)),
    patch: (i, patch) =>
      setContact(
        "links",
        draft.contact.links.map((l, idx) => (idx === i ? { ...l, ...patch } : l))
      ),
  };

  const sections = {
    summary: () => (
      <SectionCard
        key="summary"
        title="Summary"
        subtitle="Two or three lines. What you do, and what you're looking for."
        {...sectionMove("summary")}
      >
        <TextArea
          label="Professional summary"
          name="summary"
          rows={4}
          value={draft.summary}
          onChange={(e) => set("summary", e.target.value)}
          hint="Skip the buzzwords — say what you've actually built."
        />
      </SectionCard>
    ),

    experience: () => {
      const o = ops("experience");
      return (
        <SectionCard
          key="experience"
          title="Experience"
          subtitle="Internships count. Leave the end date empty if you're still there."
          {...sectionMove("experience")}
        >
          {draft.experience.length === 0 && (
            <EmptyHint>No roles yet. Internships, freelance and part-time work all belong here.</EmptyHint>
          )}
          <div className="space-y-4">
            {draft.experience.map((item, i) => (
              <EntryCard
                key={item._key}
                label={`Role ${i + 1}`}
                onRemove={() => o.remove(i)}
                onMoveUp={o.up(i)}
                onMoveDown={o.down(i)}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Job title"
                    name={`exp-title-${item._key}`}
                    value={item.title}
                    onChange={(e) => o.patch(i, { title: e.target.value })}
                  />
                  <TextField
                    label="Company"
                    name={`exp-company-${item._key}`}
                    value={item.company}
                    onChange={(e) => o.patch(i, { company: e.target.value })}
                  />
                  <TextField
                    label="Location"
                    name={`exp-location-${item._key}`}
                    value={item.location}
                    onChange={(e) => o.patch(i, { location: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <TextField
                      label="Start"
                      type="date"
                      name={`exp-start-${item._key}`}
                      value={item.startDate}
                      onChange={(e) => o.patch(i, { startDate: e.target.value })}
                    />
                    <TextField
                      label="End"
                      type="date"
                      name={`exp-end-${item._key}`}
                      value={item.endDate}
                      onChange={(e) => o.patch(i, { endDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* The checkbox is UI only. There's no "current" field stored --
                    an empty end date already means "still here". */}
                <label className="flex cursor-pointer items-center gap-2 text-[14px] text-muted">
                  <input
                    type="checkbox"
                    checked={!item.endDate}
                    onChange={(e) => o.patch(i, { endDate: e.target.checked ? "" : item.startDate })}
                    className="h-4 w-4 rounded border-line accent-accent"
                  />
                  I currently work here
                </label>

                <BulletList
                  bullets={item.bullets}
                  onChange={(bullets) => o.patch(i, { bullets })}
                  placeholder="Shipped X, which did Y for Z users"
                />
              </EntryCard>
            ))}
          </div>
          <div className="mt-4">
            <AddButton onClick={o.add}>+ Add a role</AddButton>
          </div>
        </SectionCard>
      );
    },

    projects: () => {
      const o = ops("projects");
      return (
        <SectionCard
          key="projects"
          title="Projects"
          subtitle="With little work history, this is the section that carries the resume."
          {...sectionMove("projects")}
        >
          {draft.projects.length === 0 && (
            <EmptyHint>Add the two or three things you're proudest of building.</EmptyHint>
          )}
          <div className="space-y-4">
            {draft.projects.map((item, i) => (
              <EntryCard
                key={item._key}
                label={`Project ${i + 1}`}
                onRemove={() => o.remove(i)}
                onMoveUp={o.up(i)}
                onMoveDown={o.down(i)}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Project name"
                    name={`proj-name-${item._key}`}
                    value={item.name}
                    onChange={(e) => o.patch(i, { name: e.target.value })}
                  />
                  <TextField
                    label="Link"
                    name={`proj-url-${item._key}`}
                    value={item.url}
                    onChange={(e) => o.patch(i, { url: e.target.value })}
                    hint="Repo or live demo"
                  />
                </div>
                <TextArea
                  label="One-line description"
                  name={`proj-desc-${item._key}`}
                  rows={2}
                  value={item.description}
                  onChange={(e) => o.patch(i, { description: e.target.value })}
                />
                <TagInput
                  label="Tech stack"
                  items={item.techStack}
                  onChange={(techStack) => o.patch(i, { techStack })}
                  placeholder="React"
                />
                <BulletList
                  bullets={item.bullets}
                  onChange={(bullets) => o.patch(i, { bullets })}
                  placeholder="Built the auth layer with JWT refresh rotation"
                />
              </EntryCard>
            ))}
          </div>
          <div className="mt-4">
            <AddButton onClick={o.add}>+ Add a project</AddButton>
          </div>
        </SectionCard>
      );
    },

    education: () => {
      const o = ops("education");
      return (
        <SectionCard key="education" title="Education" {...sectionMove("education")}>
          {draft.education.length === 0 && <EmptyHint>Add your degree or diploma.</EmptyHint>}
          <div className="space-y-4">
            {draft.education.map((item, i) => (
              <EntryCard
                key={item._key}
                label={`Education ${i + 1}`}
                onRemove={() => o.remove(i)}
                onMoveUp={o.up(i)}
                onMoveDown={o.down(i)}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="School"
                    name={`edu-school-${item._key}`}
                    value={item.school}
                    onChange={(e) => o.patch(i, { school: e.target.value })}
                  />
                  <TextField
                    label="Degree"
                    name={`edu-degree-${item._key}`}
                    value={item.degree}
                    onChange={(e) => o.patch(i, { degree: e.target.value })}
                    hint="B.E., B.Tech, BSc…"
                  />
                  <TextField
                    label="Field of study"
                    name={`edu-field-${item._key}`}
                    value={item.fieldOfStudy}
                    onChange={(e) => o.patch(i, { fieldOfStudy: e.target.value })}
                  />
                  <TextField
                    label="Grade"
                    name={`edu-grade-${item._key}`}
                    value={item.grade}
                    onChange={(e) => o.patch(i, { grade: e.target.value })}
                    hint="Optional — 8.4 CGPA, 78%"
                  />
                  <TextField
                    label="Start"
                    type="date"
                    name={`edu-start-${item._key}`}
                    value={item.startDate}
                    onChange={(e) => o.patch(i, { startDate: e.target.value })}
                  />
                  <TextField
                    label="End"
                    type="date"
                    name={`edu-end-${item._key}`}
                    value={item.endDate}
                    onChange={(e) => o.patch(i, { endDate: e.target.value })}
                    hint="Expected date is fine"
                  />
                </div>
              </EntryCard>
            ))}
          </div>
          <div className="mt-4">
            <AddButton onClick={o.add}>+ Add education</AddButton>
          </div>
        </SectionCard>
      );
    },

    skills: () => {
      const o = ops("skills");
      return (
        <SectionCard
          key="skills"
          title="Skills"
          subtitle="Group them — Languages, Frameworks, Tools."
          {...sectionMove("skills")}
        >
          {draft.skills.length === 0 && <EmptyHint>Add a group to get started.</EmptyHint>}
          <div className="space-y-4">
            {draft.skills.map((group, i) => (
              <EntryCard
                key={group._key}
                label={`Group ${i + 1}`}
                onRemove={() => o.remove(i)}
                onMoveUp={o.up(i)}
                onMoveDown={o.down(i)}
              >
                <TextField
                  label="Category"
                  name={`skill-cat-${group._key}`}
                  value={group.category}
                  onChange={(e) => o.patch(i, { category: e.target.value })}
                  hint="Languages, Frameworks, Tools…"
                />
                <TagInput
                  label="Skills"
                  items={group.items}
                  onChange={(items) => o.patch(i, { items })}
                  placeholder="JavaScript"
                />
              </EntryCard>
            ))}
          </div>
          <div className="mt-4">
            <AddButton onClick={o.add}>+ Add a skill group</AddButton>
          </div>
        </SectionCard>
      );
    },

    certifications: () => {
      const o = ops("certifications");
      return (
        <SectionCard key="certifications" title="Certifications" {...sectionMove("certifications")}>
          {draft.certifications.length === 0 && (
            <EmptyHint>Optional. Courses and certificates go here.</EmptyHint>
          )}
          <div className="space-y-4">
            {draft.certifications.map((item, i) => (
              <EntryCard
                key={item._key}
                label={`Certification ${i + 1}`}
                onRemove={() => o.remove(i)}
                onMoveUp={o.up(i)}
                onMoveDown={o.down(i)}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Name"
                    name={`cert-name-${item._key}`}
                    value={item.name}
                    onChange={(e) => o.patch(i, { name: e.target.value })}
                  />
                  <TextField
                    label="Issuer"
                    name={`cert-issuer-${item._key}`}
                    value={item.issuer}
                    onChange={(e) => o.patch(i, { issuer: e.target.value })}
                  />
                  <TextField
                    label="Issued"
                    type="date"
                    name={`cert-date-${item._key}`}
                    value={item.issueDate}
                    onChange={(e) => o.patch(i, { issueDate: e.target.value })}
                  />
                  <TextField
                    label="Link"
                    name={`cert-url-${item._key}`}
                    value={item.url}
                    onChange={(e) => o.patch(i, { url: e.target.value })}
                  />
                </div>
              </EntryCard>
            ))}
          </div>
          <div className="mt-4">
            <AddButton onClick={o.add}>+ Add a certification</AddButton>
          </div>
        </SectionCard>
      );
    },
  };

  return (
    <div className="space-y-5">
      {/* Contact is always first and isn't part of sectionOrder -- a resume
          without a name and an email at the top isn't a resume. */}
      <SectionCard title="Contact" subtitle="Shown at the top of every template.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Full name"
            name="contact-fullName"
            value={draft.contact.fullName}
            onChange={(e) => setContact("fullName", e.target.value)}
          />
          <TextField
            label="Email"
            name="contact-email"
            type="email"
            value={draft.contact.email}
            onChange={(e) => setContact("email", e.target.value)}
          />
          <TextField
            label="Phone"
            name="contact-phone"
            value={draft.contact.phone}
            onChange={(e) => setContact("phone", e.target.value)}
          />
          <TextField
            label="Location"
            name="contact-location"
            value={draft.contact.location}
            onChange={(e) => setContact("location", e.target.value)}
            hint="City, Country"
          />
        </div>

        <div className="mt-5">
          <span className="text-sm font-medium text-ink">Links</span>
          <div className="mt-1.5 space-y-2">
            {draft.contact.links.map((link, i) => (
              <div key={link._key} className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={link.label}
                  onChange={(e) => linkOps.patch(i, { label: e.target.value })}
                  placeholder="GitHub"
                  className="rounded-lg border border-line bg-white px-3 py-2 text-[14px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:w-40"
                />
                <input
                  value={link.url}
                  onChange={(e) => linkOps.patch(i, { url: e.target.value })}
                  placeholder="https://github.com/you"
                  className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-[14px] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => linkOps.remove(i)}
                  className="rounded-lg border border-line px-3 py-2 text-[13px] font-medium text-muted transition-colors hover:border-danger/40 hover:text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={linkOps.add}
            className="mt-2 text-[13px] font-medium text-accent hover:underline"
          >
            + Add link
          </button>
        </div>
      </SectionCard>

      {/* Everything else renders in the candidate's chosen order. */}
      {draft.sectionOrder.map((name) => sections[name]?.() ?? null)}
    </div>
  );
}