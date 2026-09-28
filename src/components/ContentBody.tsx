import type { ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAIContent } from '@/lib/aiContent';

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.length > 4 && part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="text-white">{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function renderBlocks(text: string): ReactNode[] {
  const lines = text.replace(/\r/g, '').split('\n');
  const out: ReactNode[] = [];
  let bullets: string[] = [];

  const flush = (k: number) => {
    if (!bullets.length) return;
    out.push(
      <ul key={`ul-${k}`} className="my-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-300">
        {bullets.map((b, i) => (
          <li key={i}>{inline(b)}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)/);
    if (bullet) {
      bullets.push(bullet[1]);
      return;
    }
    flush(i);
    if (!line) return;
    const h = line.match(/^#{1,4}\s+(.*)/);
    if (h) {
      out.push(
        <h3 key={i} className="mb-1 mt-5 text-base font-semibold text-white">{inline(h[1])}</h3>
      );
      return;
    }
    out.push(
      <p key={i} className="my-2 text-sm leading-relaxed text-slate-300">{inline(line)}</p>
    );
  });
  flush(lines.length);
  return out;
}

export default function ContentBody({ cacheKey, prompt }: { cacheKey: string; prompt: string }) {
  const { content, loading, error, reload } = useAIContent(cacheKey, prompt);

  if (loading && !content) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-4 text-sm text-slate-400">
        <Loader2 size={18} className="animate-spin text-sky-400" /> Content aa raha hai...
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-sm text-red-300">{error}</p>
        <button
          onClick={reload}
          className="mt-3 flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-white"
        >
          <RefreshCw size={14} /> Dobara try karo
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4">
        {content && renderBlocks(content.text)}
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="text-[11px] text-slate-500">Source: {content?.source}</span>
        <button
          onClick={reload}
          disabled={loading}
          className="flex items-center gap-1 text-[11px] text-sky-400 disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
    </div>
  );
}
