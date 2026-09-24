import { Home, MessageSquare, GraduationCap, User } from 'lucide-react';
import type { ScreenName } from '@/types';

interface BottomTabBarProps {
  active: ScreenName;
  onNavigate: (screen: ScreenName) => void;
}

const tabs: { id: ScreenName; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function BottomTabBar({ active, onNavigate }: BottomTabBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="mx-3 mb-3 w-full max-w-md">
        <div className="glass flex items-center justify-around rounded-2xl border border-white/10 px-2 py-2 shadow-2xl shadow-sky-950/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className="group relative flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-all"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/30'
                      : 'text-slate-400 group-hover:text-sky-300'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-sky-300' : 'text-slate-500'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
