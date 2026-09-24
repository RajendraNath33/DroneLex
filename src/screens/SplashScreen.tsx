import { useEffect, useState } from 'react';
import { Plane, Scale, MessageSquare, GraduationCap } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 300);
          return 100;
        }
        return p + 4;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 top-20 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl animate-pulse" />
        <div className="absolute -left-20 bottom-40 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
      </div>

      {/* Floating icons */}
      <div className="pointer-events-none absolute inset-0">
        <Scale size={24} className="absolute left-8 top-32 text-sky-500/20 animate-float" style={{ animationDelay: '0s' }} />
        <MessageSquare size={20} className="absolute right-12 top-48 text-cyan-500/20 animate-float" style={{ animationDelay: '0.5s' }} />
        <GraduationCap size={22} className="absolute left-12 bottom-56 text-orange-500/15 animate-float" style={{ animationDelay: '1s' }} />
        <Plane size={18} className="absolute right-8 bottom-44 text-sky-500/15 animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center animate-scale-in">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-2xl shadow-sky-500/30 animate-pulse-glow">
          <Plane size={48} className="text-white" />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-white">DroneLex</h1>
        <p className="mt-1 text-base font-medium text-sky-400">& Pilot AI</p>
        <p className="mt-4 max-w-[220px] text-center text-xs leading-relaxed text-slate-400">
          AI-powered drone training & aviation law assistant
        </p>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-20 left-0 right-0 px-12">
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-center text-[10px] text-slate-500">
          Initializing your cockpit...
        </p>
      </div>
    </div>
  );
}
