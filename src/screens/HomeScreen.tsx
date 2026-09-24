import { useEffect, useState } from 'react';
import {
  MessageSquare,
  GraduationCap,
  Scale,
  User as UserIcon,
  Plane,
  TrendingUp,
  Bookmark,
  Clock,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { ScreenName, ModuleProgress, Bookmark as BookmarkType } from '@/types';
import { modules } from '@/data/training';

interface HomeScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { profile, user } = useAuth();
  const [progressItems, setProgressItems] = useState<ModuleProgress[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prog }, { count }] = await Promise.all([
        supabase.from('module_progress').select('*').eq('user_id', user.id),
        supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      setProgressItems(prog as ModuleProgress[] || []);
      setBookmarkCount(count || 0);

      const totalModules = modules.length;
      const completed = (prog || []).filter((p) => p.progress === 100).length;
      const partial = (prog || []).reduce((sum, p) => sum + (p.progress < 100 ? p.progress : 0), 0);
      setOverallProgress(Math.round((completed * 100 + partial) / totalModules));
    })();
  }, [user]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  const quickActions = [
    {
      id: 'chat' as ScreenName,
      label: 'AI Assistant',
      desc: 'Ask anything',
      icon: MessageSquare,
      gradient: 'from-sky-500 to-cyan-500',
    },
    {
      id: 'training' as ScreenName,
      label: 'Training',
      desc: 'Learn & grow',
      icon: GraduationCap,
      gradient: 'from-cyan-500 to-teal-500',
    },
    {
      id: 'training' as ScreenName,
      label: 'Drone Laws',
      desc: 'DGCA rules',
      icon: Scale,
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      id: 'profile' as ScreenName,
      label: 'Profile',
      desc: 'Your journey',
      icon: UserIcon,
      gradient: 'from-slate-600 to-slate-700',
    },
  ];

  const recentModules = progressItems
    .sort((a, b) => new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime())
    .slice(0, 3);

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/50 px-6 pt-14 pb-8">
        <div className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-4 h-32 w-32 rounded-full bg-cyan-500/5 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400">{greeting}</p>
            <h1 className="font-display mt-1 text-2xl font-bold text-white">{firstName}</h1>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-sky-500/20"
          >
            {firstName.charAt(0).toUpperCase()}
          </button>
        </div>

        {/* Progress card */}
        <div className="relative mt-6 rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20">
                <TrendingUp size={22} className="text-sky-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Overall Progress</p>
                <p className="font-display text-lg font-bold text-white">{overallProgress}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Bookmarks</p>
              <p className="font-display text-lg font-bold text-orange-400">{bookmarkCount}</p>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-700/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-1000"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 pt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Quick Access</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={() => onNavigate(action.id)}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-left transition-all hover:border-white/10 hover:bg-slate-800/60 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-white">{action.label}</p>
                <p className="text-xs text-slate-400">{action.desc}</p>
                <ChevronRight size={16} className="absolute right-3 top-3 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Assistant CTA */}
      <div className="px-6 pt-5">
        <button
          onClick={() => onNavigate('chat')}
          className="group relative w-full overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-950/80 to-cyan-950/80 p-5 text-left transition-all hover:border-sky-500/30"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-500/10 blur-2xl transition-all group-hover:bg-sky-500/20" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/20">
              <Zap size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Ask the AI Assistant</p>
              <p className="text-xs text-slate-400">Get instant answers on drones & aviation law</p>
            </div>
            <ChevronRight size={20} className="text-sky-400 transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      </div>

      {/* Continue Learning */}
      {recentModules.length > 0 && (
        <div className="px-6 pt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Continue Learning</h2>
            <button onClick={() => onNavigate('training')} className="text-xs text-sky-400">
              See all
            </button>
          </div>
          <div className="space-y-3">
            {recentModules.map((item, i) => (
              <button
                key={item.id}
                onClick={() => onNavigate('training')}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-left transition-all hover:border-white/10 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                  <Clock size={18} className="text-sky-400" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-white">{item.module_name}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-700/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-sky-400">{item.progress}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured Module */}
      <div className="px-6 pt-6">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Featured Module</h2>
        <button
          onClick={() => onNavigate('training')}
          className="group relative w-full overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-5 text-left transition-all hover:border-white/10"
        >
          <div className="pointer-events-none absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
              <Plane size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">DGCA Drone Regulations</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Master India's drone rules, airspace classifications, and pilot certification
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-orange-400">
                <Bookmark size={14} />
                <span>6 lessons · 1h 45m</span>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
