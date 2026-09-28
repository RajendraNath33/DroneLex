import { useState, useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { TextToSpeech } from "@capacitor-community/text-to-speech";

const clean = (t: string) =>
  String(t || "")
    .replace(/📌.*$/s, "")
    .replace(/\[[^\]]{2,60}\]/g, "")
    .replace(/[*_#`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const chunk = (t: string) =>
  (t.match(/[^.!?।\n]+[.!?।]?/g) || []).map((s) => s.trim()).filter(Boolean);

export default function SpeakButton({ text, rate = 1 }: { text: string; rate?: number }) {
  const [speaking, setSpeaking] = useState(false);
  const run = useRef(0);
  const native = Capacitor.isNativePlatform();

  const stop = async () => {
    run.current++;
    setSpeaking(false);
    try {
      if (native) await TextToSpeech.stop();
      else window.speechSynthesis?.cancel();
    } catch {}
  };

  useEffect(() => () => { void stop(); }, []); // eslint-disable-line

  const play = async () => {
    const body = clean(text);
    if (!body) return;
    await stop();
    const id = ++run.current;
    const lang = /[\u0900-\u097F]/.test(body) ? "hi-IN" : "en-IN";
    const parts = chunk(body);
    setSpeaking(true);

    if (native) {
      try {
        for (const p of parts) {
          if (run.current !== id) return;
          await TextToSpeech.speak({ text: p, lang, rate, pitch: 1, volume: 1, category: "ambient" });
        }
      } catch {}
      if (run.current === id) setSpeaking(false);
      return;
    }

    const synth = window.speechSynthesis;
    if (!synth) { setSpeaking(false); return; }
    const voices = synth.getVoices();
    const voice = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p);
      u.lang = lang; u.rate = rate;
      if (voice) u.voice = voice;
      if (i === parts.length - 1) u.onend = () => run.current === id && setSpeaking(false);
      u.onerror = () => run.current === id && setSpeaking(false);
      synth.speak(u);
    });
  };

  return (
    <button
      type="button"
      onClick={speaking ? stop : play}
      aria-label={speaking ? "Stop audio" : "Listen"}
      style={{
        marginTop: 6, padding: "4px 10px", borderRadius: 8, border: "1px solid #334155",
        background: speaking ? "#7f1d1d" : "#0c4a6e", color: "#fff", cursor: "pointer", fontSize: 13,
      }}
    >
      {speaking ? "⏹ Stop" : "🔊 Suno"}
    </button>
  );
}
