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
          <div className={styles.feature}>✉️ Gmail integration</div>
          <div className={styles.feature}>📁 Google Drive &amp; Docs</div>
          <div className={styles.feature}>🤖 AI assistant</div>
          <div className={styles.feature}>🔒 No persistent PII storage</div>
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
