import { useState } from "react";
import ModuleContainer from "../../ModuleContainer";
import styles from "./PIIClipboard.module.css";

interface StudentRecord {
  id: string;
  label: string;
  // Student fields
  firstName: string;
  lastName: string;
  studentId: string;
  dob: string;
  email: string;
  phone: string;
  program: string;
  major: string;
  expectedGrad: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

const EMPTY_STUDENT: Omit<StudentRecord, "id" | "label"> = {
  firstName: "",
  lastName: "",
  studentId: "",
  dob: "",
  email: "",
  phone: "",
  program: "",
  major: "",
  expectedGrad: "",
  address: "",
  city: "",
  state: "",
  zip: "",
};

type FieldDef = { key: keyof Omit<StudentRecord, "id" | "label">; label: string; placeholder: string };

const FIELDS: FieldDef[] = [
  { key: "firstName", label: "First Name", placeholder: "First name" },
  { key: "lastName", label: "Last Name", placeholder: "Last name" },
  { key: "studentId", label: "Student ID", placeholder: "e.g. 1234567" },
  { key: "dob", label: "Date of Birth", placeholder: "MM/DD/YYYY" },
  { key: "email", label: "Email", placeholder: "student@school.edu" },
  { key: "phone", label: "Phone", placeholder: "(555) 000-0000" },
  { key: "program", label: "Program / Degree", placeholder: "e.g. Bachelor of Arts" },
  { key: "major", label: "Major / Field", placeholder: "e.g. Psychology" },
  { key: "expectedGrad", label: "Expected Graduation", placeholder: "e.g. May 2025" },
  { key: "address", label: "Address", placeholder: "123 Main St" },
  { key: "city", label: "City", placeholder: "City" },
  { key: "state", label: "State", placeholder: "State" },
  { key: "zip", label: "ZIP Code", placeholder: "00000" },
];

// Derived compound fields for quick copy
function getCompoundFields(s: StudentRecord): { label: string; value: string }[] {
  return [
    { label: "Full Name", value: `${s.firstName} ${s.lastName}`.trim() },
    { label: "Last, First", value: `${s.lastName}, ${s.firstName}`.trim() },
    {
      label: "Full Address",
      value: [s.address, s.city, s.state, s.zip].filter(Boolean).join(", "),
    },
    { label: "Name + ID", value: `${s.firstName} ${s.lastName} (${s.studentId})`.trim() },
  ];
}

export default function PIIClipboard() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const activeStudent = students.find((s) => s.id === activeId) ?? null;

  const copyToClipboard = async (value: string, fieldKey: string) => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(fieldKey);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(fieldKey);
      setTimeout(() => setCopied(null), 1500);
    }
  };

  const addStudent = () => {
    setEditing({ id: crypto.randomUUID(), label: "New Student", ...EMPTY_STUDENT });
    setShowForm(true);
  };

  const saveStudent = () => {
    if (!editing) return;
    const updated = {
      ...editing,
      label: [editing.firstName, editing.lastName].filter(Boolean).join(" ") || "Unnamed",
    };
    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
    setActiveId(updated.id);
    setShowForm(false);
    setEditing(null);
  };

  const removeStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const editStudent = (s: StudentRecord) => {
    setEditing({ ...s });
    setShowForm(true);
  };

  const clearAll = () => {
    setStudents([]);
    setActiveId(null);
    setEditing(null);
    setShowForm(false);
  };

  const actions = (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button className={styles.actionBtn} onClick={addStudent}>+ Add Student</button>
      {students.length > 0 && (
        <button className={styles.dangerBtn} onClick={clearAll} title="Clear all student records from session">
          🗑 Clear All
        </button>
      )}
    </div>
  );

  return (
    <ModuleContainer title="PII Clipboard" icon="📋" actions={actions}>
      <div className={styles.wrapper}>
        <div className={styles.privacyBanner}>
          🔒 <strong>Session only</strong> — Student data is stored in browser memory only.
          Nothing is sent to any server. All records are wiped when you close the tab or sign out.
        </div>

        {/* Student selector tabs */}
        {students.length > 0 && (
          <div className={styles.studentTabs}>
            {students.map((s) => (
              <button
                key={s.id}
                className={`${styles.studentTab} ${activeId === s.id ? styles.activeTab : ""}`}
                onClick={() => setActiveId(s.id)}
              >
                {s.label}
                <span
                  className={styles.removeTab}
                  onClick={(e) => { e.stopPropagation(); removeStudent(s.id); }}
                  title="Remove"
                >×</span>
              </button>
            ))}
          </div>
        )}

        {/* Edit form */}
        {showForm && editing && (
          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>
              {students.find((s) => s.id === editing.id) ? "Edit Student" : "Add Student"}
            </h3>
            <div className={styles.formGrid}>
              {FIELDS.map((f) => (
                <label key={f.key} className={styles.formField}>
                  <span className={styles.fieldLabel}>{f.label}</span>
                  <input
                    className={styles.fieldInput}
                    type={f.key === "dob" ? "date" : "text"}
                    value={(editing as unknown as Record<string, string>)[f.key] ?? ""}
                    placeholder={f.placeholder}
                    onChange={(e) =>
                      setEditing((prev) => prev ? { ...prev, [f.key]: e.target.value } : prev)
                    }
                  />
                </label>
              ))}
            </div>
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={saveStudent}>💾 Save</button>
              <button className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditing(null); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quick copy panel */}
        {activeStudent && !showForm && (
          <div className={styles.copyPanel}>
            <div className={styles.copyPanelHeader}>
              <span className={styles.copyPanelName}>{activeStudent.label}</span>
              <button className={styles.editBtn} onClick={() => editStudent(activeStudent)}>✏️ Edit</button>
            </div>

            {/* Compound fields */}
            <div className={styles.fieldSection}>
              <h4 className={styles.sectionLabel}>Quick Combinations</h4>
              <div className={styles.fieldGrid}>
                {getCompoundFields(activeStudent)
                  .filter((f) => f.value.trim())
                  .map((f) => (
                    <button
                      key={f.label}
                      className={`${styles.copyBtn} ${copied === f.label ? styles.copied : ""}`}
                      onClick={() => copyToClipboard(f.value, f.label)}
                      title={`Copy: ${f.value}`}
                    >
                      <span className={styles.copyBtnLabel}>{f.label}</span>
                      <span className={styles.copyBtnValue}>{f.value || "—"}</span>
                      <span className={styles.copyBtnIcon}>{copied === f.label ? "✓" : "📋"}</span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Individual fields */}
            <div className={styles.fieldSection}>
              <h4 className={styles.sectionLabel}>Individual Fields</h4>
              <div className={styles.fieldGrid}>
                {FIELDS.filter((f) => (activeStudent as unknown as Record<string, string>)[f.key]?.trim()).map((f) => (
                  <button
                    key={f.key}
                    className={`${styles.copyBtn} ${copied === f.key ? styles.copied : ""}`}
                    onClick={() => copyToClipboard((activeStudent as unknown as Record<string, string>)[f.key], f.key)}
                    title={`Copy ${f.label}`}
                  >
                    <span className={styles.copyBtnLabel}>{f.label}</span>
                    <span className={styles.copyBtnValue}>{(activeStudent as unknown as Record<string, string>)[f.key]}</span>
                    <span className={styles.copyBtnIcon}>{copied === f.key ? "✓" : "📋"}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {students.length === 0 && !showForm && (
          <div className={styles.emptyState}>
            <p>📋 No student records loaded.</p>
            <p className={styles.hint}>
              Add a student to quickly copy their data (name, ID, DOB, etc.) into forms and systems.
            </p>
            <button className={styles.addBtn} onClick={addStudent}>+ Add First Student</button>
          </div>
        )}
      </div>
    </ModuleContainer>
  );
}
