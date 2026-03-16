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
