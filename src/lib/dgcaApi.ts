// src/lib/dgcaApi.ts
// Calls your existing n8n webhook (Qdrant + Ollama RAG) and returns plain text.

const WEBHOOK_URL: string =
  import.meta.env.VITE_DRONELEX_WEBHOOK_URL ??
  "https://raj-video.shilpshakti.org.in/webhook/dronelex-chat";

const TIMEOUT_MS = 60_000; // qwen2.5:7b on CPU can be slow

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem("dronelex-sim-session");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("dronelex-sim-session", id);
    }
    return id;
  } catch {
    return `sim-${Date.now()}`;
  }
}

// n8n workflows return different shapes; try the common ones.
function extractText(data: unknown): string {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.length ? extractText(data[0]) : "";
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const key of ["output", "text", "answer", "response", "reply", "message", "content"]) {
      const v = o[key];
      if (typeof v === "string" && v.trim()) return v;
    }
    for (const v of Object.values(o)) {
      const nested = extractText(v);
      if (nested) return nested;
    }
  }
  return "";
}

export async function askDgca(question: string, signal?: AbortSignal): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener("abort", onAbort);

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Send the same field names your chat screen already uses.
      // Extra keys are harmless; n8n ignores what it doesn't read.
      body: JSON.stringify({
        chatInput: question,
        message: question,
        question,
        sessionId: getSessionId(),
        source: "simulator",
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) throw new Error(`Server error ${res.status}`);

    const raw = await res.text();
    let parsed: unknown = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      /* plain-text reply */
    }

    const text = extractText(parsed).trim();
    if (!text) throw new Error("Empty response from webhook");
    return text;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
