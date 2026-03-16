import { useState, useCallback } from "react";
import ModuleContainer from "../../ModuleContainer";
import styles from "./PIIRedactor.module.css";

type RedactMode = "redact" | "scramble" | "remove";

// ─── Fake data generators (deterministic scramble) ───────────────────────────

const FIRST_NAMES = ["Alex","Jordan","Taylor","Casey","Morgan","Riley","Quinn","Avery","Blake","Cameron","Drew","Emerson","Finley","Harper","Hayden","Jamie","Jesse","Kendall","Logan","Parker"];
const LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Moore","Anderson","Thomas","Jackson","White","Harris","Martin","Lewis","Clark","Lee","Walker"];
const STREETS = ["Oak St","Maple Ave","Cedar Rd","Pine Blvd","Elm Dr","Washington Ln","College Ave","University Blvd","Park Rd","Main St"];
const CITIES = ["Springfield","Shelbyville","Capital City","Oakville","Riverside","Greenfield","Milltown","Westwood","Eastville","Northgate"];
const STATES = ["CA","TX","NY","FL","OH","IL","PA","GA","NC","MI"];

let _seed = 42;
function seededRand(max: number): number {
  _seed = (_seed * 1664525 + 1013904223) & 0xffffffff;
  return Math.abs(_seed) % max;
}

function fakeName(): { first: string; last: string } {
  return { first: FIRST_NAMES[seededRand(FIRST_NAMES.length)], last: LAST_NAMES[seededRand(LAST_NAMES.length)] };
}
function fakeEmail(first: string, last: string): string {
  return `${first.toLowerCase()}.${last.toLowerCase()}${seededRand(900) + 100}@student.edu`;
}
function fakePhone(): string {
  return `(${seededRand(900) + 100}) ${seededRand(900) + 100}-${String(seededRand(10000)).padStart(4, "0")}`;
}
function fakeDob(): string {
  const y = 1990 + seededRand(12);
  const m = String(seededRand(12) + 1).padStart(2, "0");
  const d = String(seededRand(28) + 1).padStart(2, "0");
  return `${m}/${d}/${y}`;
}
function fakeStudentId(): string {
  return String(seededRand(9000000) + 1000000);
}
function fakeAddress(): string {
  return `${seededRand(9000) + 1000} ${STREETS[seededRand(STREETS.length)]}, ${CITIES[seededRand(CITIES.length)]}, ${STATES[seededRand(STATES.length)]} ${String(seededRand(90000) + 10000)}`;
}
function fakeSsn(): string {
  return `${String(seededRand(900) + 100)}-${String(seededRand(90) + 10)}-${String(seededRand(9000) + 1000)}`;
}
function fakeGpa(): string {
  return (2.0 + seededRand(20) / 10).toFixed(2);
}

// ─── Redaction patterns ───────────────────────────────────────────────────────

interface PatternDef {
  id: string;
  label: string;
  pattern: RegExp;
  scramble: () => string;
  redactLabel: string;
}

const PATTERNS: PatternDef[] = [
  {
    id: "ssn",
    label: "SSN",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    scramble: fakeSsn,
    redactLabel: "[SSN REDACTED]",
  },
  {
    id: "email",
    label: "Email",
    pattern: /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g,
    scramble: () => { const n = fakeName(); return fakeEmail(n.first, n.last); },
    redactLabel: "[EMAIL REDACTED]",
  },
  {
    id: "phone",
    label: "Phone",
    pattern: /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    scramble: fakePhone,
    redactLabel: "[PHONE REDACTED]",
  },
  {
    id: "dob",
    label: "Date of Birth",
    // MM/DD/YYYY, MM-DD-YYYY
    pattern: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g,
    scramble: fakeDob,
    redactLabel: "[DOB REDACTED]",
  },
  {
    id: "student_id",
    label: "Student ID",
    // 7-9 digit standalone numbers (common student ID format)
    pattern: /\b\d{7,9}\b/g,
    scramble: fakeStudentId,
    redactLabel: "[STUDENT ID REDACTED]",
  },
  {
    id: "gpa",
    label: "GPA",
    pattern: /\bGPA[:\s]+[0-9]\.[0-9]{1,2}\b/gi,
    scramble: () => `GPA: ${fakeGpa()}`,
    redactLabel: "[GPA REDACTED]",
  },
  {
    id: "address",
    label: "Street Address",
    pattern: /\b\d{1,6}\s+[A-Za-z0-9\s]{3,30}(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Ct|Court|Way|Pl|Place)[.,]?\b/gi,
    scramble: fakeAddress,
    redactLabel: "[ADDRESS REDACTED]",
  },
];

function applyRedaction(text: string, selectedPatterns: Set<string>, mode: RedactMode): string {
  // Reset to a fixed seed so the same input always produces the same scrambled output.
  // This is intentional: it lets you create consistent sample documents across multiple
  // redaction runs (e.g., the same fake student name appears in all your training materials).
  _seed = 1234567;
  let result = text;
  for (const p of PATTERNS) {
    if (!selectedPatterns.has(p.id)) continue;
    result = result.replace(p.pattern, () => {
      if (mode === "redact") return p.redactLabel;
      if (mode === "scramble") return p.scramble();
      return ""; // remove
    });
  }
  // Clean up extra whitespace from removals
  if (mode === "remove") {
    result = result.replace(/\s{2,}/g, " ").replace(/,\s*,/g, ",").trim();
  }
  return result;
}

export default function PIIRedactor() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<RedactMode>("redact");
  const [selectedPatterns, setSelectedPatterns] = useState<Set<string>>(
    new Set(PATTERNS.map((p) => p.id))
  );
  const [copySuccess, setCopySuccess] = useState(false);
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  const togglePattern = (id: string) => {
    setSelectedPatterns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const process = useCallback(() => {
    if (!input.trim()) return;
    // Count matches per pattern for stats
    const matchCounts: Record<string, number> = {};
    for (const p of PATTERNS) {
      if (!selectedPatterns.has(p.id)) continue;
      const matches = input.match(p.pattern) ?? [];
      matchCounts[p.id] = matches.length;
    }
    setStats(matchCounts);
    setOutput(applyRedaction(input, selectedPatterns, mode));
  }, [input, mode, selectedPatterns]);

  const copyOutput = async () => {
    await navigator.clipboard.writeText(output);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 1500);
  };

  const actions = (
    <button className={styles.processBtn} onClick={process} disabled={!input.trim()}>
      ⚙️ Process
    </button>
  );

  const totalFound = stats ? Object.values(stats).reduce((a, b) => a + b, 0) : 0;

  return (
    <ModuleContainer title="PII Redactor" icon="🛡️" actions={actions}>
      <div className={styles.wrapper}>
        <div className={styles.privacyBanner}>
          🔒 <strong>100% client-side</strong> — Your text never leaves your browser.
          No data is sent to any server. Safe for FERPA-protected documents.
        </div>

        {/* Mode selector */}
        <div className={styles.modeRow}>
          <span className={styles.modeLabel}>Mode:</span>
          {(["redact", "scramble", "remove"] as RedactMode[]).map((m) => (
            <button
              key={m}
              className={`${styles.modeBtn} ${mode === m ? styles.activeModeBtn : ""}`}
              onClick={() => setMode(m)}
            >
              {m === "redact" && "🔲 Redact"}
              {m === "scramble" && "🔀 Scramble"}
              {m === "remove" && "✂️ Remove"}
            </button>
          ))}
          <span className={styles.modeHelp}>
            {mode === "redact" && "Replace with [TYPE REDACTED] labels"}
            {mode === "scramble" && "Replace with realistic fake data — safe for samples & screenshots"}
            {mode === "remove" && "Delete PII entirely"}
          </span>
        </div>

        {/* Pattern toggles */}
        <div className={styles.patternRow}>
          <span className={styles.modeLabel}>Detect:</span>
          {PATTERNS.map((p) => (
            <button
              key={p.id}
              className={`${styles.patternChip} ${selectedPatterns.has(p.id) ? styles.activeChip : ""}`}
              onClick={() => togglePattern(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Text areas */}
        <div className={styles.textAreas}>
          <div className={styles.textSection}>
            <label className={styles.textLabel}>📥 Input — Paste document or text here</label>
            <textarea
              className={styles.textArea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste text containing PII here (emails, student IDs, SSNs, phone numbers, DOBs, etc.)"
              spellCheck={false}
            />
          </div>

          <div className={styles.textSection}>
            <div className={styles.outputLabelRow}>
              <label className={styles.textLabel}>📤 Output — Processed text (safe to share)</label>
              {output && (
                <button
                  className={`${styles.copyOutputBtn} ${copySuccess ? styles.copied : ""}`}
                  onClick={copyOutput}
                >
                  {copySuccess ? "✓ Copied!" : "📋 Copy"}
                </button>
              )}
            </div>
            <textarea
              className={`${styles.textArea} ${styles.outputArea}`}
              value={output}
              readOnly
              placeholder="Processed output will appear here…"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className={styles.statsBar}>
            <span className={styles.statsTotal}>
              {totalFound === 0 ? "✅ No PII detected" : `⚠️ ${totalFound} item(s) processed:`}
            </span>
            {Object.entries(stats)
              .filter(([, count]) => count > 0)
              .map(([id, count]) => {
                const p = PATTERNS.find((x) => x.id === id);
                return (
                  <span key={id} className={styles.statChip}>
                    {p?.label}: {count}
                  </span>
                );
              })}
          </div>
        )}
      </div>
    </ModuleContainer>
  );
}
