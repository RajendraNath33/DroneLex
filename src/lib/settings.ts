import { useCallback, useEffect, useState } from 'react';

export type Lang = 'en' | 'hi';
export type Theme = 'dark' | 'light';

export interface AppSettings {
  notifications: boolean;
  theme: Theme;
  lang: Lang;
}

const KEY = 'dronelex:settings';
const LANG_KEY = 'dronelex:lang'; // ContentBody (lessons) isi key ko padhta hai
const EVENT = 'dronelex:settings-changed';

const DEFAULTS: AppSettings = { notifications: false, theme: 'dark', lang: 'en' };

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<AppSettings>) : {};
    const lang = localStorage.getItem(LANG_KEY) === 'hi' ? 'hi' : parsed.lang ?? 'en';
    return { ...DEFAULTS, ...parsed, lang };
  } catch {
    return DEFAULTS;
  }
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('light', theme === 'light');
  document.documentElement.style.colorScheme = theme;
}

export function saveSettings(next: AppSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    localStorage.setItem(LANG_KEY, next.lang);
  } catch {
    /* ignore */
  }
  applyTheme(next.theme);
  window.dispatchEvent(new Event(EVENT));
}

// App start par saved theme turant lagao
if (typeof window !== 'undefined') applyTheme(loadSettings().theme);

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    const sync = () => setSettings(loadSettings());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    saveSettings({ ...loadSettings(), ...patch });
  }, []);

  return { settings, update };
}

/** Notifications ON karne par browser permission maangta hai. Android WebView me API nahi hoti, tab sirf preference save hoti hai. */
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const r = await Notification.requestPermission();
    return r === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}
