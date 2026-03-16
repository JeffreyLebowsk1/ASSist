import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import ModuleContainer from "../../ModuleContainer";
import styles from "./AIAssistant.module.css";
import type { ChatMessage } from "../../../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/**
 * AI Assistant module.
 * Conversation history is session-scoped only (no persistence).
 * Clearing history wipes it from the server session too.
 */
export default function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load existing history from session on mount
  useEffect(() => {
    fetch(`${API_BASE}/ai/history`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.history?.length) {
          setMessages(
            data.history.map((m: { role: string; content: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: Date.now(),
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "AI service error");
      }
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, timestamp: Date.now() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    await fetch(`${API_BASE}/ai/history`, {
      method: "DELETE",
      credentials: "include",
    });
    setMessages([]);
    setError(null);
  };

  const actions = (
    <button className={styles.clearBtn} onClick={handleClear} title="Clear conversation">
      🗑 Clear
    </button>
  );

  return (
    <ModuleContainer title="AI Assistant" icon="🤖" actions={actions}>
      <div className={styles.wrapper}>
        <div className={styles.privacyNotice}>
          🔒 Conversations are session-only and not stored permanently. History clears on logout.
        </div>
        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.emptyState}>
              <p>👋 How can I help you today?</p>
              <p className={styles.hint}>
                I can help with emails, documents, summaries, and work tasks.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.message} ${msg.role === "user" ? styles.userMessage : styles.assistantMessage}`}
            >
              <div className={styles.messageBubble}>
                <pre className={styles.messageContent}>{msg.content}</pre>
              </div>
            </div>
          ))}
          {loading && (
            <div className={`${styles.message} ${styles.assistantMessage}`}>
              <div className={styles.messageBubble}>
                <span className={styles.typing}>●●●</span>
              </div>
            </div>
          )}
          {error && <div className={styles.error}>⚠️ {error}</div>}
          <div ref={bottomRef} />
        </div>
        <form className={styles.inputArea} onSubmit={handleSend}>
          <textarea
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message... (Shift+Enter for new line)"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as FormEvent);
              }
            }}
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={loading || !input.trim()}
          >
            {loading ? "..." : "Send"}
          </button>
        </form>
      </div>
    </ModuleContainer>
  );
}
