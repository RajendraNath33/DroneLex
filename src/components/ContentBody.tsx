import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Loader2, RefreshCw, Square, Volume2 } from 'lucide-react';
import { useAIContent } from '@/lib/aiContent';
import { canSpeak, speak, stopSpeaking } from '@/lib/speech';

type Lang = 'en' | 'hi';

const LANG_KEY = 'dronelex:lang';
const HI_NOTE =
  ' Write the entire answer in simple Hindi (Devanagari script). Keep technical terms and acronyms like UIN, DGCA, VTOL in English.';

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

function ContentInner({ cacheKey, prompt, lang }: { cacheKey: string; prompt: string; lang: Lang }) {
  const { content, loading, error, reload } = useAIContent(cacheKey, prompt);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => stopSpeaking(), []);

  const toggleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    if (!content) return;
    setSpeaking(true);
    if (!speak(content.text, lang, () => setSpeaking(false))) setSpeaking(false);
  };

  const refresh = () => {
    stopSpeaking();
    setSpeaking(false);
    reload();
  };

  if (loading && !content) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-4 text-sm text-slate-400">
        <Loader2 size={18} className="animate-spin text-sky-400" />
        {lang === 'hi' ? 'कंटेंट आ रहा है...' : 'Content aa raha hai...'}
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
          <RefreshCw size={14} /> {lang === 'hi' ? 'दोबारा कोशिश करें' : 'Dobara try karo'}
        </button>
      </div>
    );
  }

  return (
    <div>
      {canSpeak && content && (
        <button
          onClick={toggleSpeak}
          className="mb-3 flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-xs font-medium text-sky-300"
        >
          {speaking ? <Square size={14} /> : <Volume2 size={14} />}
          {speaking ? (lang === 'hi' ? 'रोकें' : 'Stop') : lang === 'hi' ? 'सुनें' : 'Listen'}
        </button>
      )}
      <div className="rounded-xl border border-white/5 bg-slate-900/60 p-4">
        {content && renderBlocks(content.text)}
      </div>
      <div className="mt-2 flex items-center justify-between px-1">
        <span className="text-[11px] text-slate-500">Source: {content?.source}</span>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1 text-[11px] text-sky-400 disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
    </div>
  );
}

export default function ContentBody({ cacheKey, prompt }: { cacheKey: string; prompt: string }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'hi' ? 'hi' : 'en';
    } catch {
      return 'en';
    }
  });

  const choose = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  };

  const btn = (l: Lang, label: string) => (
    <button
      onClick={() => choose(l)}
      className={`rounded-md px-3 py-1.5 ${
        lang === l ? 'bg-sky-500 text-white' : 'text-slate-400'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-3 inline-flex rounded-lg border border-white/10 bg-slate-900/60 p-0.5 text-xs font-medium">
        {btn('en', 'English')}
        {btn('hi', 'हिन्दी')}
      </div>
      <ContentInner
        key={lang}
        cacheKey={lang === 'hi' ? cacheKey + ':hi' : cacheKey}
        prompt={lang === 'hi' ? prompt + HI_NOTE : prompt}
        lang={lang}
      />
    </div>
  );
}
