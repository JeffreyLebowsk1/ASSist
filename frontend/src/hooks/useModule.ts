import { useState, useCallback } from "react";
import type { ModuleId, ModuleConfig } from "../types";

export const MODULE_CONFIGS: ModuleConfig[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "🏠",
    description: "Overview and quick actions",
  },
  {
    id: "registrar",
    title: "Registrar Toolkit",
    icon: "🎓",
    description: "Graduation, transcripts & admissions",
  },
  {
    id: "pii-clipboard",
    title: "PII Clipboard",
    icon: "📋",
    description: "Quick-copy student data to forms",
  },
  {
    id: "pii-redactor",
    title: "PII Redactor",
    icon: "🛡️",
    description: "Redact/scramble PII for safe samples",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    icon: "🤖",
    description: "Chat with your AI work assistant",
  },
  {
    id: "gmail",
    title: "Gmail",
    icon: "✉️",
    description: "View and manage your email",
  },
  {
    id: "drive",
    title: "Google Drive",
    icon: "📁",
    description: "Browse and open documents",
  },
];

export function useModule() {
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");

  const navigateTo = useCallback((moduleId: ModuleId) => {
    setActiveModule(moduleId);
  }, []);

  return { activeModule, navigateTo, modules: MODULE_CONFIGS };
}
