import { useState } from "react";
import ModuleContainer from "../../ModuleContainer";
import styles from "./RegistrarDashboard.module.css";
import type { ModuleId } from "../../../types";

interface RegistrarDashboardProps {
  onNavigate: (id: ModuleId) => void;
}

interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  category: string;
}

const DEFAULT_CHECKLISTS: ChecklistItem[] = [
  // Graduation Application Processing
  { id: "g1", text: "Verify degree requirements met (transcript audit)", done: false, category: "Graduation Apps" },
  { id: "g2", text: "Check GPA meets program minimum", done: false, category: "Graduation Apps" },
  { id: "g3", text: "Confirm residency credits satisfied", done: false, category: "Graduation Apps" },
  { id: "g4", text: "Review outstanding incomplete grades", done: false, category: "Graduation Apps" },
  { id: "g5", text: "Verify application fee paid", done: false, category: "Graduation Apps" },
  { id: "g6", text: "Confirm student intent (in-absentia or attend)", done: false, category: "Graduation Apps" },
  // Ceremony
  { id: "c1", text: "Confirm cap & gown order submitted", done: false, category: "Ceremony" },
  { id: "c2", text: "Send ceremony details email to graduates", done: false, category: "Ceremony" },
  { id: "c3", text: "Coordinate with venue / facilities", done: false, category: "Ceremony" },
  { id: "c4", text: "Prepare name cards / pronunciation guide", done: false, category: "Ceremony" },
  { id: "c5", text: "Final headcount to facilities", done: false, category: "Ceremony" },
  // Transcripts
  { id: "t1", text: "Process pending transcript requests", done: false, category: "Transcripts" },
  { id: "t2", text: "Verify holds cleared before release", done: false, category: "Transcripts" },
  { id: "t3", text: "Confirm official seal / signature", done: false, category: "Transcripts" },
  // Admissions
  { id: "a1", text: "Review pending admissions applications", done: false, category: "Admissions" },
  { id: "a2", text: "Request missing documents", done: false, category: "Admissions" },
  { id: "a3", text: "Send acceptance / denial letters", done: false, category: "Admissions" },
];

const CATEGORY_ICONS: Record<string, string> = {
  "Graduation Apps": "🎓",
  "Ceremony": "🏛️",
  "Transcripts": "📜",
  "Admissions": "📝",
};

const EMAIL_TEMPLATES = [
  {
    id: "grad_confirm",
    title: "Graduation Application Received",
    body: `Dear [STUDENT NAME],

Thank you for submitting your graduation application for [TERM].

Your application is currently under review. We will complete our degree audit and notify you of the results within [X] business days.

Please ensure that:
• All coursework is completed by the end of the semester
• Any outstanding holds are resolved
• Your contact information is up-to-date in the student portal

If you have any questions, please don't hesitate to contact our office.

Best regards,
[YOUR NAME]
Graduation Coordinator
Office of the Registrar`,
  },
  {
    id: "transcript_ready",
    title: "Official Transcript Ready",
    body: `Dear [STUDENT NAME],

Your official transcript request (Request #[NUMBER]) has been processed and is ready.

[DELIVERY METHOD]:
• Secure PDF: [LINK]
• Mailed to: [ADDRESS]

Please note that official transcripts are sealed and should not be opened if you receive a physical copy.

Contact our office if you have any questions.

Best regards,
[YOUR NAME]
Office of the Registrar`,
  },
  {
    id: "missing_docs",
    title: "Missing Documents — Action Required",
    body: `Dear [STUDENT NAME],

We are writing regarding your [APPLICATION TYPE] application.

To continue processing your application, we require the following documents:

☐ [DOCUMENT 1]
☐ [DOCUMENT 2]
☐ [DOCUMENT 3]

Please submit these documents to our office or upload them to the student portal by [DEADLINE DATE].

If we do not receive the required documents by this date, your application may be delayed.

Best regards,
[YOUR NAME]
Office of the Registrar`,
  },
  {
    id: "ceremony_info",
    title: "Graduation Ceremony Information",
    body: `Dear [STUDENT NAME],

Congratulations on your upcoming graduation!

Your graduation ceremony details:

📅 Date: [DATE]
🕐 Time: Arrive by [ARRIVE TIME], Ceremony begins at [START TIME]
📍 Location: [VENUE NAME], [ADDRESS]
👗 Attire: Cap and gown required

Important notes:
• Please pick up your cap and gown at [LOCATION] by [DATE]
• Bring your student ID
• Guests are welcome — each graduate receives [#] guest tickets
• Parking available at [LOCATION]

We look forward to celebrating this milestone with you!

Best regards,
[YOUR NAME]
Graduation Coordinator`,
  },
];

export default function RegistrarDashboard({ onNavigate }: RegistrarDashboardProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLISTS);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof EMAIL_TEMPLATES[0] | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("Graduation Apps");

  const toggleItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const resetCategory = (category: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.category === category ? { ...item, done: false } : item))
    );
  };

  const categories = Array.from(new Set(checklist.map((i) => i.category)));

  const copyTemplate = async () => {
    if (!selectedTemplate) return;
    await navigator.clipboard.writeText(selectedTemplate.body);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 1500);
  };

  const catItems = checklist.filter((i) => i.category === activeCategory);
  const catDone = catItems.filter((i) => i.done).length;

  return (
    <ModuleContainer title="Registrar Toolkit" icon="🎓">
      <div className={styles.wrapper}>

        {/* Quick action cards */}
        <div className={styles.quickActions}>
          <button className={styles.quickCard} onClick={() => onNavigate("pii-clipboard")}>
            <span className={styles.quickIcon}>📋</span>
            <span className={styles.quickLabel}>PII Clipboard</span>
            <span className={styles.quickDesc}>Copy student data to forms</span>
          </button>
          <button className={styles.quickCard} onClick={() => onNavigate("pii-redactor")}>
            <span className={styles.quickIcon}>🛡️</span>
            <span className={styles.quickLabel}>PII Redactor</span>
            <span className={styles.quickDesc}>Sanitize docs for samples</span>
          </button>
          <button className={styles.quickCard} onClick={() => onNavigate("ai-assistant")}>
            <span className={styles.quickIcon}>🤖</span>
            <span className={styles.quickLabel}>AI Assistant</span>
            <span className={styles.quickDesc}>Draft emails, summarize docs</span>
          </button>
          <button className={styles.quickCard} onClick={() => onNavigate("gmail")}>
            <span className={styles.quickIcon}>✉️</span>
            <span className={styles.quickLabel}>Gmail</span>
            <span className={styles.quickDesc}>View & draft emails</span>
          </button>
        </div>

        <div className={styles.twoCol}>
          {/* Checklists */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>📋 Task Checklists</h3>
            <div className={styles.categoryTabs}>
              {categories.map((cat) => {
                const items = checklist.filter((i) => i.category === cat);
                const done = items.filter((i) => i.done).length;
                return (
                  <button
                    key={cat}
                    className={`${styles.catTab} ${activeCategory === cat ? styles.activeCatTab : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {CATEGORY_ICONS[cat]} {cat}
                    <span className={styles.catBadge}>{done}/{items.length}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.checklistItems}>
              <div className={styles.checklistHeader}>
                <span className={styles.checklistProgress}>
                  {catDone}/{catItems.length} complete
                </span>
                <button className={styles.resetBtn} onClick={() => resetCategory(activeCategory)}>
                  Reset
                </button>
              </div>
              {catItems.map((item) => (
                <label key={item.id} className={`${styles.checkItem} ${item.done ? styles.doneItem : ""}`}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleItem(item.id)}
                    className={styles.checkbox}
                  />
                  <span>{item.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Email templates */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>✉️ Email Templates</h3>
            <div className={styles.templateList}>
              {EMAIL_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  className={`${styles.templateBtn} ${selectedTemplate?.id === tmpl.id ? styles.activeTemplate : ""}`}
                  onClick={() => setSelectedTemplate(tmpl)}
                >
                  {tmpl.title}
                </button>
              ))}
            </div>
            {selectedTemplate && (
              <div className={styles.templatePreview}>
                <div className={styles.templatePreviewHeader}>
                  <strong>{selectedTemplate.title}</strong>
                  <button
                    className={`${styles.copyTmplBtn} ${copiedTemplate ? styles.copied : ""}`}
                    onClick={copyTemplate}
                  >
                    {copiedTemplate ? "✓ Copied!" : "📋 Copy"}
                  </button>
                </div>
                <pre className={styles.templateBody}>{selectedTemplate.body}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModuleContainer>
  );
}
