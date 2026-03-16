import { Suspense } from "react";
import { useAuth } from "./hooks/useAuth";
import { useModule } from "./hooks/useModule";
import Sidebar from "./components/Layout/Sidebar";
import LoginPage from "./components/LoginPage";
import AIAssistant from "./components/modules/AIAssistant";
import GmailModule from "./components/modules/GmailModule";
import GDriveModule from "./components/modules/GDriveModule";
import Dashboard from "./components/modules/Dashboard";
import styles from "./App.module.css";
import type { ModuleId } from "./types";

function ModuleView({ moduleId, ...props }: { moduleId: ModuleId; user: ReturnType<typeof useAuth>["user"]; modules: ReturnType<typeof useModule>["modules"]; onNavigate: (id: ModuleId) => void }) {
  switch (moduleId) {
    case "ai-assistant":
      return <AIAssistant />;
    case "gmail":
      return <GmailModule />;
    case "drive":
      return <GDriveModule />;
    case "dashboard":
    default:
      return <Dashboard user={props.user} modules={props.modules} onNavigate={props.onNavigate} />;
  }
}

export default function App() {
  const { authenticated, user, loading, login, logout } = useAuth();
  const { activeModule, navigateTo, modules } = useModule();

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner}>⏳</div>
        <p>Loading ASSist…</p>
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className={styles.appLayout}>
      <Sidebar
        modules={modules}
        activeModule={activeModule}
        onNavigate={navigateTo}
        user={user}
        onLogout={logout}
      />
      <main className={styles.mainContent}>
        <Suspense fallback={<div className={styles.moduleLoading}>Loading module…</div>}>
          <ModuleView
            moduleId={activeModule}
            user={user}
            modules={modules}
            onNavigate={navigateTo}
          />
        </Suspense>
      </main>
    </div>
  );
}
