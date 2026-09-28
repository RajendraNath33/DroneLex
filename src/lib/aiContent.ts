import { useCallback, useEffect, useState } from 'react';

export interface AIContent {
  text: string;
  source: string;
}

const PREFIX = 'dronelex:content:v1:';

export function getCached(key: string): AIContent | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as AIContent) : null;
  } catch {
    return null;
  }
}

export async function fetchAIContent(key: string, prompt: string, force = false): Promise<AIContent> {
  if (!force) {
    const cached = getCached(key);
    if (cached) return cached;
  }
  const url = import.meta.env.VITE_N8N_WEBHOOK_URL as string;
  if (!url) throw new Error('VITE_N8N_WEBHOOK_URL set nahi hai');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt, question: prompt }),
  });
  if (!res.ok) throw new Error(`Webhook error: ${res.status}`);

  const raw = await res.text();
  let parsed: any = raw;
  try {
    parsed = JSON.parse(raw);
  } catch {
    /* plain text reply */
  }
  const d = Array.isArray(parsed) ? parsed[0] : parsed;
  const text: string | undefined =
    typeof d === 'string'
      ? d
      : d?.answer ?? d?.output ?? d?.text ?? d?.reply ?? d?.response ?? d?.message;
  if (!text || !String(text).trim()) throw new Error('Webhook se khaali jawab aaya');

  const source = typeof d?.source === 'string' && d.source ? d.source : 'AI assistant';
  const content: AIContent = { text: String(text), source };
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(content));
  } catch {
    /* storage full: skip caching */
  }
  return content;
}

export function useAIContent(key: string, prompt: string) {
  const [content, setContent] = useState<AIContent | null>(() => getCached(key));
  const [loading, setLoading] = useState<boolean>(() => !getCached(key));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);
      try {
        setContent(await fetchAIContent(key, prompt, force));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Kuch galat ho gaya');
      } finally {
        setLoading(false);
      }
    },
    [key, prompt]
  );

  useEffect(() => {
    if (!getCached(key)) load();
  }, [key, load]);

  return { content, loading, error, reload: () => load(true) };
}
