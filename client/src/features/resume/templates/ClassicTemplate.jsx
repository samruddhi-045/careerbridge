import { Document, Page, Text, View, Link, StyleSheet } from "@react-pdf/renderer";
import { isEmptySection } from "../utils/resumeData";

/**
 * react-pdf does NOT use HTML or CSS. These are its own primitives, styled
 * with a flexbox subset -- no grid, no Tailwind, no cascade. Every template
 * carries its own complete StyleSheet.
 *
 * Helvetica, Times-Roman and Courier are built in, so they need no font
 * loading and can't fail at render time.
 */
const s = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 48, fontFamily: "Times-Roman", fontSize: 10.5, color: "#1a1a1a", lineHeight: 1.45 },
  name: { fontSize: 22, fontFamily: "Times-Bold", letterSpacing: -0.3 },
  contactRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 5, fontSize: 9.5, color: "#444" },
  contactItem: { marginRight: 10 },
  link: { color: "#444", textDecoration: "none" },
  sectionTitle: { fontSize: 11, fontFamily: "Times-Bold", textTransform: "uppercase", letterSpacing: 1.1, marginTop: 16, marginBottom: 6, paddingBottom: 3, borderBottomWidth: 0.8, borderBottomColor: "#999" },
  entry: { marginBottom: 9 },
  entryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  entryTitle: { fontFamily: "Times-Bold", fontSize: 11 },
  entrySub: { fontSize: 10, color: "#333", marginTop: 1 },
  entryDates: { fontSize: 9.5, color: "#666", marginLeft: 12 },
  bulletRow: { flexDirection: "row", marginTop: 3, paddingRight: 6 },
  bulletDot: { width: 10, fontSize: 10 },
  bulletText: { flex: 1 },
  skillRow: { flexDirection: "row", marginBottom: 3 },
  skillCategory: { fontFamily: "Times-Bold", width: 95 },
  skillItems: { flex: 1 },
  summary: { marginTop: 2 },
});

const Bullets = ({ items }) =>
  items.map((text, i) => (
    <View key={i} style={s.bulletRow}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{text}</Text>
    </View>
  ));

export default function ClassicTemplate({ data }) {
  const { contact } = data;

  const sections = {
    summary: () => (
      <View key="summary">
        <Text style={s.sectionTitle}>Summary</Text>
        <Text style={s.summary}>{data.summary}</Text>
      </View>
    ),
    experience: () => (
      <View key="experience">
        <Text style={s.sectionTitle}>Experience</Text>
        {data.experience.map((x, i) => (
          <View key={i} style={s.entry} wrap={false}>
            <View style={s.entryTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.entryTitle}>{x.title}</Text>
                <Text style={s.entrySub}>{[x.company, x.location].filter(Boolean).join(" · ")}</Text>
              </View>
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
              <View style={{ flex: 1 }}>
                <Text style={s.entryTitle}>{x.name}</Text>
                {!!x.description && <Text style={s.entrySub}>{x.description}</Text>}
                {!!x.techStack.length && (
                  <Text style={[s.entrySub, { color: "#666" }]}>{x.techStack.join(" · ")}</Text>
                )}
              </View>
              {!!x.url && (
                <Link src={x.url} style={[s.entryDates, s.link]}>
                  View
                </Link>
              )}
            </View>
            <Bullets items={x.bullets} />
          </View>
        ))}
      </View>
    ),
    education: () => (
      <View key="education">
        <Text style={s.sectionTitle}>Education</Text>
        {data.education.map((x, i) => (
          <View key={i} style={s.entry} wrap={false}>
            <View style={s.entryTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.entryTitle}>{x.school}</Text>
                <Text style={s.entrySub}>
                  {[x.degree, x.grade].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <Text style={s.entryDates}>{x.dates}</Text>
            </View>
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
            <Text style={{ flex: 1 }}>{[c.name, c.issuer].filter(Boolean).join(" — ")}</Text>
            <Text style={s.entryDates}>{c.date}</Text>
          </View>
        ))}
      </View>
    ),
  };

  return (
    <Document title={contact.fullName || "Resume"}>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{contact.fullName}</Text>
        <View style={s.contactRow}>
          {[contact.email, contact.phone, contact.location].filter(Boolean).map((item, i) => (
            <Text key={i} style={s.contactItem}>
              {item}
            </Text>
          ))}
          {contact.links.map((l) => (
            <Link key={l.url} src={l.url} style={[s.contactItem, s.link]}>
              {l.label}
            </Link>
          ))}
        </View>

        {data.sectionOrder.map((name) =>
          isEmptySection(data, name) ? null : sections[name]?.() ?? null
        )}
      </Page>
    </Document>
  );
}