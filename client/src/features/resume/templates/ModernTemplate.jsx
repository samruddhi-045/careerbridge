import { Document, Page, Text, View, Link, StyleSheet } from "@react-pdf/renderer";
import { isEmptySection } from "../utils/resumeData";

const ACCENT = "#2f4a8f";

const s = StyleSheet.create({
  page: { flexDirection: "row", fontFamily: "Helvetica", fontSize: 9.5, color: "#1c1c1c", lineHeight: 1.45 },

  sidebar: { width: "32%", backgroundColor: "#f2f4f9", paddingVertical: 34, paddingHorizontal: 20 },
  main: { width: "68%", paddingVertical: 34, paddingHorizontal: 26 },

  name: { fontSize: 19, fontFamily: "Helvetica-Bold", color: ACCENT, lineHeight: 1.15 },
  sidebarLabel: { fontSize: 8.5, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, color: ACCENT, marginTop: 18, marginBottom: 5 },
  sidebarText: { fontSize: 9, color: "#333", marginBottom: 2.5 },
  link: { color: "#333", textDecoration: "none", fontSize: 9, marginBottom: 2.5 },

  skillGroup: { marginBottom: 7 },
  skillCategory: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 1.5 },

  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, color: ACCENT, marginTop: 15, marginBottom: 6 },
  firstSection: { marginTop: 0 },
  entry: { marginBottom: 9 },
  entryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  entryTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  entrySub: { fontSize: 9.5, color: ACCENT, marginTop: 1 },
  entryMeta: { fontSize: 8.5, color: "#777", marginTop: 1 },
  entryDates: { fontSize: 8.5, color: "#777", marginLeft: 10 },
  bulletRow: { flexDirection: "row", marginTop: 2.5 },
  bulletDot: { width: 8, fontSize: 9 },
  bulletText: { flex: 1 },
  summary: { fontSize: 9.5 },
});

const Bullets = ({ items }) =>
  items.map((text, i) => (
    <View key={i} style={s.bulletRow}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{text}</Text>
    </View>
  ));

/**
 * Two-column layout. Skills and certifications are pinned to the sidebar by
 * design, so sectionOrder only governs the main column here -- a deliberate
 * trade: you get a visually distinct template, and lose reordering for those
 * two sections. Classic and Compact honour the full order.
 */
export default function ModernTemplate({ data }) {
  const { contact } = data;
  const mainSections = data.sectionOrder.filter((n) => n !== "skills" && n !== "certifications");

  const sections = {
    summary: (first) => (
      <View key="summary">
        <Text style={[s.sectionTitle, first && s.firstSection]}>Profile</Text>
        <Text style={s.summary}>{data.summary}</Text>
      </View>
    ),
    experience: (first) => (
      <View key="experience">
        <Text style={[s.sectionTitle, first && s.firstSection]}>Experience</Text>
        {data.experience.map((x, i) => (
          <View key={i} style={s.entry} wrap={false}>
            <View style={s.entryTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.entryTitle}>{x.title}</Text>
                <Text style={s.entrySub}>{x.company}</Text>
                {!!x.location && <Text style={s.entryMeta}>{x.location}</Text>}
              </View>
              <Text style={s.entryDates}>{x.dates}</Text>
            </View>
            <Bullets items={x.bullets} />
          </View>
        ))}
      </View>
    ),
    projects: (first) => (
      <View key="projects">
        <Text style={[s.sectionTitle, first && s.firstSection]}>Projects</Text>
        {data.projects.map((x, i) => (
          <View key={i} style={s.entry} wrap={false}>
            <View style={s.entryTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.entryTitle}>{x.name}</Text>
                {!!x.description && <Text style={s.entryMeta}>{x.description}</Text>}
                {!!x.techStack.length && <Text style={s.entrySub}>{x.techStack.join(" · ")}</Text>}
              </View>
              {!!x.url && (
                <Link src={x.url} style={[s.entryDates, { color: ACCENT, textDecoration: "none" }]}>
                  View
                </Link>
              )}
            </View>
            <Bullets items={x.bullets} />
          </View>
        ))}
      </View>
    ),
    education: (first) => (
      <View key="education">
        <Text style={[s.sectionTitle, first && s.firstSection]}>Education</Text>
        {data.education.map((x, i) => (
          <View key={i} style={s.entry} wrap={false}>
            <View style={s.entryTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.entryTitle}>{x.school}</Text>
                {!!x.degree && <Text style={s.entrySub}>{x.degree}</Text>}
                {!!x.grade && <Text style={s.entryMeta}>{x.grade}</Text>}
              </View>
              <Text style={s.entryDates}>{x.dates}</Text>
            </View>
          </View>
        ))}
      </View>
    ),
  };

  let firstUsed = false;

  return (
    <Document title={contact.fullName || "Resume"}>
      <Page size="A4" style={s.page}>
        <View style={s.sidebar}>
          <Text style={s.name}>{contact.fullName}</Text>

          <Text style={s.sidebarLabel}>Contact</Text>
          {!!contact.email && <Text style={s.sidebarText}>{contact.email}</Text>}
          {!!contact.phone && <Text style={s.sidebarText}>{contact.phone}</Text>}
          {!!contact.location && <Text style={s.sidebarText}>{contact.location}</Text>}
          {contact.links.map((l) => (
            <Link key={l.url} src={l.url} style={s.link}>
              {l.label}
            </Link>
          ))}

          {!isEmptySection(data, "skills") && (
            <>
              <Text style={s.sidebarLabel}>Skills</Text>
              {data.skills.map((g, i) => (
                <View key={i} style={s.skillGroup}>
                  <Text style={s.skillCategory}>{g.category}</Text>
                  <Text style={s.sidebarText}>{g.items.join(", ")}</Text>
                </View>
              ))}
            </>
          )}

          {!isEmptySection(data, "certifications") && (
            <>
              <Text style={s.sidebarLabel}>Certifications</Text>
              {data.certifications.map((c, i) => (
                <View key={i} style={{ marginBottom: 5 }}>
                  <Text style={s.skillCategory}>{c.name}</Text>
                  <Text style={s.sidebarText}>{[c.issuer, c.date].filter(Boolean).join(" · ")}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={s.main}>
          {mainSections.map((name) => {
            if (isEmptySection(data, name)) return null;
            const isFirst = !firstUsed;
            firstUsed = true;
            return sections[name]?.(isFirst) ?? null;
          })}
        </View>
      </Page>
    </Document>
  );
}