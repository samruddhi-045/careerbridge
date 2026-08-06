import { Document, Page, Text, View, Link, StyleSheet } from "@react-pdf/renderer";
import { isEmptySection } from "../utils/resumeData";

/**
 * Dense single column. Tighter leading and smaller type so a candidate with a
 * lot of projects still fits on one page -- which is what most junior resumes
 * are trying to do.
 */
const s = StyleSheet.create({
  page: { paddingVertical: 32, paddingHorizontal: 40, fontFamily: "Helvetica", fontSize: 9, color: "#222", lineHeight: 1.35 },
  header: { borderBottomWidth: 1.5, borderBottomColor: "#222", paddingBottom: 7, marginBottom: 4 },
  name: { fontSize: 17, fontFamily: "Helvetica-Bold", letterSpacing: -0.2 },
  contactRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 3, fontSize: 8.5, color: "#555" },
  contactItem: { marginRight: 9 },
  link: { color: "#555", textDecoration: "none", marginRight: 9 },
  sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.9, marginTop: 11, marginBottom: 4 },
  entry: { marginBottom: 6 },
  entryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  entryTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  inlineSub: { fontSize: 9, color: "#444" },
  entryDates: { fontSize: 8.5, color: "#777", marginLeft: 10 },
  bulletRow: { flexDirection: "row", marginTop: 1.5 },
  bulletDot: { width: 7, fontSize: 8.5 },
  bulletText: { flex: 1 },
  skillRow: { flexDirection: "row", marginBottom: 2 },
  skillCategory: { fontFamily: "Helvetica-Bold", width: 82 },
  skillItems: { flex: 1 },
});

const Bullets = ({ items }) =>
  items.map((text, i) => (
    <View key={i} style={s.bulletRow}>
      <Text style={s.bulletDot}>–</Text>
      <Text style={s.bulletText}>{text}</Text>
    </View>
  ));

export default function CompactTemplate({ data }) {
  const { contact } = data;

  const sections = {
    summary: () => (
      <View key="summary">
        <Text style={s.sectionTitle}>Summary</Text>
        <Text>{data.summary}</Text>
      </View>
    ),
    experience: () => (
      <View key="experience">
        <Text style={s.sectionTitle}>Experience</Text>
        {data.experience.map((x, i) => (
          <View key={i} style={s.entry} wrap={false}>
            <View style={s.entryTop}>
              {/* Title and company on one line keeps each role to fewer rows */}
              <Text style={{ flex: 1 }}>
                <Text style={s.entryTitle}>{x.title}</Text>
                <Text style={s.inlineSub}>
                  {[x.company, x.location].filter(Boolean).length ? "  ·  " : ""}
                  {[x.company, x.location].filter(Boolean).join(" · ")}
                </Text>
              </Text>
              <Text style={s.entryDates}>{x.dates}</Text>
            </View>
            <Bullets items={x.bullets} />
          </View>
        ))}
      </View>
    ),
    projects: () => (
      <View key="projects">
        <Text style={s.sectionTitle}>Projects</Text>
        {data.projects.map((x, i) => (
          <View key={i} style={s.entry} wrap={false}>
            <View style={s.entryTop}>
              <Text style={{ flex: 1 }}>
                <Text style={s.entryTitle}>{x.name}</Text>
                {!!x.techStack.length && (
                  <Text style={s.inlineSub}>{`  ·  ${x.techStack.join(", ")}`}</Text>
                )}
              </Text>
              {!!x.url && (
                <Link src={x.url} style={[s.entryDates, s.link]}>
                  Link
                </Link>
              )}
            </View>
            {!!x.description && <Text style={s.inlineSub}>{x.description}</Text>}
            <Bullets items={x.bullets} />
          </View>
        ))}
      </View>
    ),
    education: () => (
      <View key="education">
        <Text style={s.sectionTitle}>Education</Text>
        {data.education.map((x, i) => (
          <View key={i} style={s.entryTop}>
            <Text style={{ flex: 1 }}>
              <Text style={s.entryTitle}>{x.school}</Text>
              <Text style={s.inlineSub}>
                {[x.degree, x.grade].filter(Boolean).length ? "  ·  " : ""}
                {[x.degree, x.grade].filter(Boolean).join(" · ")}
              </Text>
            </Text>
            <Text style={s.entryDates}>{x.dates}</Text>
          </View>
        ))}
      </View>
    ),
    skills: () => (
      <View key="skills">
        <Text style={s.sectionTitle}>Skills</Text>
        {data.skills.map((g, i) => (
          <View key={i} style={s.skillRow}>
            <Text style={s.skillCategory}>{g.category}</Text>
            <Text style={s.skillItems}>{g.items.join(", ")}</Text>
          </View>
        ))}
      </View>
    ),
    certifications: () => (
      <View key="certifications">
        <Text style={s.sectionTitle}>Certifications</Text>
        {data.certifications.map((c, i) => (
          <View key={i} style={s.entryTop}>
            <Text style={{ flex: 1 }}>{[c.name, c.issuer].filter(Boolean).join(" · ")}</Text>
            <Text style={s.entryDates}>{c.date}</Text>
          </View>
        ))}
      </View>
    ),
  };

  return (
    <Document title={contact.fullName || "Resume"}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.name}>{contact.fullName}</Text>
          <View style={s.contactRow}>
            {[contact.email, contact.phone, contact.location].filter(Boolean).map((item, i) => (
              <Text key={i} style={s.contactItem}>
                {item}
              </Text>
            ))}
            {contact.links.map((l) => (
              <Link key={l.url} src={l.url} style={s.link}>
                {l.label}
              </Link>
            ))}
          </View>
        </View>

        {data.sectionOrder.map((name) =>
          isEmptySection(data, name) ? null : sections[name]?.() ?? null
        )}
      </Page>
    </Document>
  );
}