import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const native = Capacitor.isNativePlatform();

// यह जाँचता है कि ऐप या ब्राउज़र में टेक्स्ट-टू-स्पीच समर्थित है या नहीं
export const canSpeak =
  native || (typeof window !== 'undefined' && 'speechSynthesis' in window);

let token = 0;

// टेक्स्ट से मार्कडाउन और अनावश्यक सिंबल हटाने के लिए
function stripMarkdown(t: string): string {
  if (!t) return '';
  return t
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/[`*_>]/g, '')
    .replace(/\[[^\]]{2,60}\]/g, '');
}

// बड़े टेक्स्ट को छोटे-छोटे हिस्सों (chunks) में बांटना ताकि बोलने में आसानी हो
function splitChunks(text: string): string[] {
  const cleanText = stripMarkdown(text);
  const parts = cleanText.split(/(?<=[.!?।])\s+|\n+/).map((p) => p.trim()).filter(Boolean);
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

// वेब ब्राउज़र के लिए सही आवाज़ (Voice) चुनना
function pickVoice(lang: 'en' | 'hi'): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
  const want = lang === 'hi' ? 'hi-in' : 'en-in';
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === want) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(lang))
  );
}

// टेक्स्ट को बोलकर सुनाने का मुख्य फ़ंक्शन
export function speak(text: string, lang: 'en' | 'hi', onDone: () => void): boolean {
  if (!canSpeak) return false;
  
  const chunks = splitChunks(text);
  if (!chunks.length) {
    onDone();
    return false;
  }

  const my = ++token;
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';

  // यदि ऐप मोबाइल (Capacitor Native) पर चल रही है
  if (native) {
    (async () => {
      try {
        await TextToSpeech.stop();
        for (const c of chunks) {
          if (token !== my) return; // अगर नया स्पीच रिक्वेस्ट आ गया है तो इसे रोक दें
          await TextToSpeech.speak({
            text: c,
            lang: locale,
            rate: 1.0,
            pitch: 1.0,
            volume: 1.0,
            category: 'ambient',
          });
        }
      } catch (error) {
        console.error('Native TTS execution error:', error);
      } finally {
        if (token === my) onDone();
      }
    })();
    return true;
  }

  // यदि ऐप वेब ब्राउज़र पर चल रही है
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    
    let currentIndex = 0;
    const voice = pickVoice(lang);

    const speakNext = () => {
      if (token !== my || currentIndex >= chunks.length) {
        if (token === my) onDone();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[currentIndex]);
      utterance.lang = locale;
      if (voice) utterance.voice = voice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        currentIndex++;
        speakNext();
      };

      utterance.onerror = (e) => {
        console.error('Web Speech synthesis error:', e);
        if (token === my) {
          currentIndex++;
          speakNext();
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNext();
    return true;
  }

  return false;
}

// बोलने की प्रक्रिया को रोकने के लिए
export function stopSpeaking() {
  token++;
  if (native) {
    TextToSpeech.stop().catch(() => {});
  } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
