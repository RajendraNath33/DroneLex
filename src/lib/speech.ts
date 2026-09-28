export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

let token = 0;

function stripMarkdown(t: string): string {
  return t
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/[`*]/g, '');
}

function splitChunks(text: string): string[] {
  const parts = text.split(/(?<=[.!?।])\s+|\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + ' ' + p).length > 160 && cur) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? cur + ' ' + p : p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

function pickVoice(lang: 'en' | 'hi'): SpeechSynthesisVoice | undefined {
  const want = lang === 'hi' ? 'hi-in' : 'en-in';
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === want) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(lang))
  );
}

export function speak(text: string, lang: 'en' | 'hi', onDone: () => void): boolean {
  if (!canSpeak) return false;
  window.speechSynthesis.cancel();
  const my = ++token;
  const chunks = splitChunks(stripMarkdown(text));
  if (!chunks.length) return false;
  const voice = pickVoice(lang);

  chunks.forEach((c, i) => {
    const u = new SpeechSynthesisUtterance(c);
    u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    if (voice) u.voice = voice;
    u.onend = () => {
      if (token === my && i === chunks.length - 1) onDone();
    };
    u.onerror = () => {
      if (token === my) {
        token++;
        window.speechSynthesis.cancel();
        onDone();
      }
    };
    window.speechSynthesis.speak(u);
  });
  return true;
}

export function stopSpeaking() {
  token++;
  if (canSpeak) window.speechSynthesis.cancel();
}
