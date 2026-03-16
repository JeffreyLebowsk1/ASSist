import { useState, useEffect } from "react";
import ModuleContainer from "../../ModuleContainer";
import styles from "./GmailModule.module.css";
import type { GmailMessage } from "../../../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface MessageDetail {
  id: string;
  snippet: string;
  payload?: {
    headers: { name: string; value: string }[];
  };
}

function getHeader(headers: { name: string; value: string }[] | undefined, name: string) {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

export default function GmailModule() {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [selected, setSelected] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const fetchMessages = async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ max_results: "25" });
      if (q) params.set("query", q);
      const res = await fetch(`${API_BASE}/gmail/messages?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const openMessage = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/gmail/messages/${id}?format=metadata`, {
        credentials: "include",
      });
      const data = await res.json();
      setSelected(data);
    } catch {
      setError("Could not load message");
    }
  };

  const actions = (
    <div className={styles.searchBar}>
      <input
        className={styles.searchInput}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search mail…"
        onKeyDown={(e) => e.key === "Enter" && fetchMessages(query)}
      />
      <button className={styles.searchBtn} onClick={() => fetchMessages(query)}>🔍</button>
    </div>
  );

  return (
    <ModuleContainer title="Gmail" icon="✉️" actions={actions}>
      {error && <div className={styles.error}>{error}</div>}
      {loading && <div className={styles.loading}>Loading…</div>}
      <div className={styles.layout}>
        <div className={styles.messageList}>
          {messages.length === 0 && !loading && (
            <div className={styles.empty}>No messages found</div>
          )}
          {messages.map((msg) => (
            <button
              key={msg.id}
              className={`${styles.messageRow} ${selected?.id === msg.id ? styles.selectedRow : ""}`}
              onClick={() => openMessage(msg.id)}
            >
              <span className={styles.msgId}>{msg.id.slice(0, 8)}…</span>
            </button>
          ))}
        </div>

        <div className={styles.messageDetail}>
          {selected ? (
            <>
              <div className={styles.detailHeaders}>
                <div><strong>From:</strong> {getHeader(selected.payload?.headers, "From")}</div>
                <div><strong>To:</strong> {getHeader(selected.payload?.headers, "To")}</div>
                <div><strong>Subject:</strong> {getHeader(selected.payload?.headers, "Subject")}</div>
                <div><strong>Date:</strong> {getHeader(selected.payload?.headers, "Date")}</div>
              </div>
              <div className={styles.snippet}>{selected.snippet}</div>
            </>
          ) : (
            <div className={styles.empty}>Select a message to view details</div>
          )}
        </div>
      </div>
    </ModuleContainer>
  );
}
