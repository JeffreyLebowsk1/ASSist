import styles from "./LoginPage.module.css";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🧰</div>
        <h1 className={styles.title}>ASSist</h1>
        <p className={styles.subtitle}>Your modular digital work assistant</p>

        <div className={styles.features}>
          <div className={styles.feature}><span aria-hidden="true">✉️</span> Gmail integration</div>
          <div className={styles.feature}><span aria-hidden="true">📁</span> Google Drive &amp; Docs</div>
          <div className={styles.feature}><span aria-hidden="true">🤖</span> AI assistant</div>
          <div className={styles.feature}><span aria-hidden="true">🔒</span> No persistent PII storage</div>
        </div>

        <button className={styles.loginBtn} onClick={onLogin}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className={styles.googleIcon}
          />
          Sign in with Google
        </button>

        <p className={styles.privacy}>
          Your session data stays in memory only and is wiped on sign-out.
          FERPA-compliant: no content is logged or stored.
        </p>
      </div>
    </div>
  );
}
