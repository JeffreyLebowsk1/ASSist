import styles from "./Sidebar.module.css";
import type { ModuleConfig, ModuleId } from "../../types";

interface SidebarProps {
  modules: ModuleConfig[];
  activeModule: ModuleId;
  onNavigate: (id: ModuleId) => void;
  user?: { name: string; email: string; picture?: string } | null;
  onLogout: () => void;
}

export default function Sidebar({
  modules,
  activeModule,
  onNavigate,
  user,
  onLogout,
}: SidebarProps) {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>🧰</span>
        <span className={styles.brandName}>ASSist</span>
      </div>

      <ul className={styles.navList}>
        {modules.map((mod) => (
          <li key={mod.id}>
            <button
              className={`${styles.navItem} ${activeModule === mod.id ? styles.active : ""}`}
              onClick={() => onNavigate(mod.id)}
              title={mod.description}
              aria-current={activeModule === mod.id ? "page" : undefined}
            >
              <span className={styles.navIcon}>{mod.icon}</span>
              <span className={styles.navLabel}>{mod.title}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        {user && (
          <div className={styles.userInfo}>
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className={styles.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.avatarFallback}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user.name}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          </div>
        )}
        <button className={styles.logoutBtn} onClick={onLogout}>
          🚪 Sign out
        </button>
      </div>
    </nav>
  );
}
