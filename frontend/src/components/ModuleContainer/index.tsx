import React from "react";
import styles from "./ModuleContainer.module.css";

interface ModuleContainerProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

/**
 * Reusable container for all modules.
 * Provides consistent header, padding, scrolling, and layout.
 */
export default function ModuleContainer({
  title,
  icon,
  children,
  className = "",
  actions,
}: ModuleContainerProps) {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <h2 className={styles.title}>{title}</h2>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
