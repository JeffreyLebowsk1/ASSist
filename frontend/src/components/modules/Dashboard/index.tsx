import ModuleContainer from "../../ModuleContainer";
import styles from "./Dashboard.module.css";
import type { User, ModuleConfig, ModuleId } from "../../../types";

interface DashboardProps {
  user: User | null;
  modules: ModuleConfig[];
  onNavigate: (id: ModuleId) => void;
}

export default function Dashboard({ user, modules, onNavigate }: DashboardProps) {
  const workModules = modules.filter((m) => m.id !== "dashboard");

  return (
    <ModuleContainer title="Dashboard" icon="🏠">
      <div className={styles.wrapper}>
        <div className={styles.greeting}>
          <h2 className={styles.greetingText}>
            Welcome back, {user?.name?.split(" ")[0] ?? "there"}! 👋
          </h2>
          <p className={styles.sub}>{user?.email}</p>
        </div>

        <div className={styles.privacyBanner}>
          🔒 <strong>Privacy:</strong> No conversation history or document content is stored
          permanently. All session data is wiped on logout. PII tools operate client-side only.
        </div>

        <h3 className={styles.sectionTitle}>Work Modules</h3>
        <div className={styles.grid}>
          {workModules.map((mod) => (
            <button
              key={mod.id}
              className={`${styles.moduleCard} ${["registrar","pii-clipboard","pii-redactor"].includes(mod.id) ? styles.featured : ""}`}
              onClick={() => onNavigate(mod.id)}
            >
              <span className={styles.cardIcon}>{mod.icon}</span>
              <span className={styles.cardTitle}>{mod.title}</span>
              <span className={styles.cardDesc}>{mod.description}</span>
            </button>
          ))}
        </div>
      </div>
    </ModuleContainer>
  );
}
