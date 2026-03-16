import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import ModuleContainer from "../../ModuleContainer";
import styles from "./GDriveModule.module.css";
import type { DriveFile } from "../../../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const MIME_ICONS: Record<string, string> = {
  "application/vnd.google-apps.document": "📄",
  "application/vnd.google-apps.spreadsheet": "📊",
  "application/vnd.google-apps.presentation": "📑",
  "application/vnd.google-apps.folder": "📁",
  "application/pdf": "📕",
  "text/plain": "📝",
};

function fileIcon(mimeType: string) {
  return MIME_ICONS[mimeType] ?? "📄";
}

export default function GDriveModule() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page_size: "25" });
      if (q) params.set("query", q);
      const res = await fetch(`${API_BASE}/drive/files?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load files");
      const data = await res.json();
      setFiles(data.files ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error loading files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    fetchFiles(query);
  };

  const actions = (
    <form onSubmit={handleSearch} className={styles.searchBar}>
      <input
        className={styles.searchInput}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Drive…"
      />
      <button type="submit" className={styles.searchBtn}>🔍</button>
    </form>
  );

  return (
    <ModuleContainer title="Google Drive" icon="📁" actions={actions}>
      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Loading…</div>}

      <div className={styles.fileGrid}>
        {files.length === 0 && !loading && (
          <div className={styles.empty}>No files found</div>
        )}
        {files.map((file) => (
          <a
            key={file.id}
            href={file.webViewLink ?? `https://drive.google.com/file/d/${file.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.fileCard}
          >
            <span className={styles.fileIcon}>{fileIcon(file.mimeType)}</span>
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileMeta}>
                {new Date(file.modifiedTime).toLocaleDateString()}
              </span>
            </div>
          </a>
        ))}
      </div>
    </ModuleContainer>
  );
}
