import React, { useState } from 'react';

export default function SpeakButton({ text, rate = 1 }: { text: string; rate?: number }) {
  const [speaking, setSpeaking] = useState(false);

  const stop = () => {
    setSpeaking(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const play = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported on your browser.");
      return;
    }

    window.speechSynthesis.cancel();
    
    const cleanText = String(text || "").replace(/[*_#`>]/g, "").trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.lang = /[\u0900-\u097F]/.test(cleanText) ? "hi-IN" : "en-US";

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  return (
    <button
      type="button"
      onClick={speaking ? stop : play}
      className="mt-1 px-3 py-1 rounded-lg border border-slate-700 bg-sky-950 text-white text-xs font-medium hover:bg-sky-900 transition flex items-center space-x-1"
    >
      {speaking ? "⏹ Stop" : "🔊 Suno"}
    </button>
  );
}
