import { useEffect, useState } from 'react';
import {
  Plane,
  Rocket,
  Fan,
  Bot,
  Scale,
  Wind,
  Layers,
  Flame,
  PlaneTakeoff,
  Shield,
  Network,
  RotateCw,
  Gauge,
  ArrowUp,
  Cpu,
  Eye,
  Radar,
  BookOpen,
  Map,
  BadgeCheck,
  Globe,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowLeft,
  PlayCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { TrainingModule, TrainingCategory, ModuleProgress } from '@/types';
import { categories, modules, getModulesByCategory, difficultyColors } from '@/data/training';

const iconMap: Record<string, typeof Plane> = {
  Plane, Rocket, Fan, Bot, Scale, Wind, Layers, Flame, PlaneTakeoff,
  Shield, Network, RotateCw, Gauge, ArrowUp, Cpu, Eye, Radar, BookOpen,
  Map, BadgeCheck, Globe,
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  'aircraft-design': { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20' },
  'advanced-drone': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  'helicopter-design': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  'robotics': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'drone-law': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
};

export default function TrainingScreen() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<TrainingCategory | null>(null);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, ModuleProgress>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('module_progress')
        .select('*')
        .eq('user_id', user.id);
      const map: Record<string, ModuleProgress> = {};
      (data || []).forEach((p) => {
        map[(p as ModuleProgress).module_id] = p as ModuleProgress;
      });
      setProgressMap(map);
    })();
  }, [user]);

  const updateProgress = async (module: TrainingModule, newProgress: number) => {
    if (!user) return;
    const clamped = Math.max(0, Math.min(100, newProgress));
    const existing = progressMap[module.id];

    if (existing) {
      const { data } = await supabase
        .from('module_progress')
        .update({ progress: clamped, last_accessed: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (data) {
        setProgressMap((prev) => ({ ...prev, [module.id]: data as ModuleProgress }));
      }
    } else {
      const { data } = await supabase
        .from('module_progress')
        .insert({
          user_id: user.id,
          module_id: module.id,
          module_name: module.title,
          category: module.category,
          progress: clamped,
        })
        .select()
        .single();
      if (data) {
        setProgressMap((prev) => ({ ...prev, [module.id]: data as ModuleProgress }));
      }
    }
  };

  // Module detail view
  if (selectedModule) {
    const Icon = iconMap[selectedModule.icon] || BookOpen;
    const cat = categoryColors[selectedModule.category];
    const progress = progressMap[selectedModule.id]?.progress ?? 0;

    return (
      <div className="h-full overflow-y-auto no-scrollbar pb-28">
        {/* Header */}
        <div className={`relative overflow-hidden px-5 pt-12 pb-6 ${cat.bg}`}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-current opacity-5 blur-3xl" />
          <button
            onClick={() => setSelectedModule(null)}
            className="relative mb-4 flex items-center gap-1 text-sm text-slate-400"
          >
            <ArrowLeft size={18} /> Back to modules
          </button>
          <div className="relative flex items-start gap-4">
            <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl ${cat.bg} border ${cat.border}`}>
              <Icon size={28} className={cat.text} />
            </div>
            <div className="flex-1">
              <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${difficultyColors[selectedModule.difficulty]}`}>
                {selectedModule.difficulty}
              </span>
              <h1 className="font-display mt-2 text-xl font-bold leading-tight text-white">{selectedModule.title}</h1>
            </div>
          </div>
          <p className="relative mt-4 text-sm leading-relaxed text-slate-400">{selectedModule.description}</p>
        </div>

        {/* Stats */}
        <div className="mx-5 mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-center">
            <BookOpen size={18} className="mx-auto mb-1 text-sky-400" />
            <p className="font-display text-lg font-bold text-white">{selectedModule.lessons}</p>
            <p className="text-[10px] text-slate-400">Lessons</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-center">
            <Clock size={18} className="mx-auto mb-1 text-cyan-400" />
            <p className="font-display text-lg font-bold text-white">{selectedModule.duration}</p>
            <p className="text-[10px] text-slate-400">Duration</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-center">
            <CheckCircle2 size={18} className="mx-auto mb-1 text-emerald-400" />
            <p className="font-display text-lg font-bold text-white">{progress}%</p>
            <p className="text-[10px] text-slate-400">Complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-5 mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Your Progress</span>
            <span className="text-xs font-bold text-sky-400">{progress}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Lesson list (mock) */}
        <div className="mx-5 mt-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">Course Content</h3>
          <div className="space-y-2">
            {Array.from({ length: Math.min(selectedModule.lessons, 6) }).map((_, i) => {
              const lessonProgress = ((i + 1) / selectedModule.lessons) * 100;
              const isCompleted = lessonProgress <= progress;
              const isCurrent = !isCompleted && i === Math.floor((progress / 100) * selectedModule.lessons);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 transition-all ${
                    isCompleted
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : isCurrent
                      ? 'border-sky-500/30 bg-sky-500/5'
                      : 'border-white/5 bg-slate-900/60'
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                      isCompleted ? 'bg-emerald-500/20' : isCurrent ? 'bg-sky-500/20' : 'bg-slate-800'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <PlayCircle size={18} className={isCurrent ? 'text-sky-400' : 'text-slate-500'} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                      Lesson {i + 1}: {selectedModule.title} - Part {i + 1}
                    </p>
                    <p className="text-[11px] text-slate-500">{Math.ceil(parseInt(selectedModule.duration) / selectedModule.lessons * 60)} min</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mx-5 mt-6 flex gap-3">
          <button
            onClick={() => updateProgress(selectedModule, progress + 20)}
            className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20"
          >
            {progress === 0 ? 'Start Module' : 'Mark Next Lesson'}
          </button>
          {progress > 0 && progress < 100 && (
            <button
              onClick={() => updateProgress(selectedModule, 100)}
              className="rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3.5 text-sm font-medium text-sky-300"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    );
  }

  // Category detail view
  if (selectedCategory) {
    const cat = categories.find((c) => c.id === selectedCategory)!;
    const CatIcon = iconMap[cat.icon] || BookOpen;
    const catColor = categoryColors[selectedCategory];
    const categoryModules = getModulesByCategory(selectedCategory);

    return (
      <div className="h-full overflow-y-auto no-scrollbar pb-28">
        <div className={`relative overflow-hidden px-5 pt-12 pb-6 ${catColor.bg}`}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-5 blur-3xl" />
          <button
            onClick={() => setSelectedCategory(null)}
            className="relative mb-4 flex items-center gap-1 text-sm text-slate-400"
          >
            <ArrowLeft size={18} /> All Categories
          </button>
          <div className="relative flex items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${catColor.bg} border ${catColor.border}`}>
              <CatIcon size={30} className={catColor.text} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-white">{cat.name}</h1>
              <p className="mt-1 text-xs text-slate-400">{categoryModules.length} modules available</p>
            </div>
          </div>
          <p className="relative mt-4 text-sm leading-relaxed text-slate-400">{cat.description}</p>
        </div>

        <div className="px-5 pt-5 space-y-3">
          {categoryModules.map((mod, i) => {
            const ModIcon = iconMap[mod.icon] || BookOpen;
            const prog = progressMap[mod.id]?.progress ?? 0;
            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModule(mod)}
                className="group flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-left transition-all hover:border-white/10 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${catColor.bg}`}>
                  <ModIcon size={22} className={catColor.text} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-white">{mod.title}</p>
                  <p className="truncate text-xs text-slate-400">{mod.description}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-medium ${difficultyColors[mod.difficulty]}`}>
                      {mod.difficulty}
                    </span>
                    <span className="text-[10px] text-slate-500">{mod.lessons} lessons · {mod.duration}</span>
                  </div>
                  {prog > 0 && (
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-700/50">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ width: `${prog}%` }} />
                    </div>
                  )}
                </div>
                <ChevronRight size={18} className="flex-shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Main category list
  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28">
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-display text-2xl font-bold text-white">Training Modules</h1>
        <p className="mt-1 text-sm text-slate-400">Explore specialized aviation & drone courses</p>
      </div>

      {/* Search bar (visual) */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
          <BookOpen size={16} className="text-slate-500" />
          <span className="text-sm text-slate-500">Search modules, categories...</span>
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 space-y-3">
        {categories.map((cat, i) => {
          const CatIcon = iconMap[cat.icon] || BookOpen;
          const catColor = categoryColors[cat.id];
          const catModules = getModulesByCategory(cat.id);
          const startedCount = catModules.filter((m) => progressMap[m.id]).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="group relative w-full overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-left transition-all hover:border-white/10 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`pointer-events-none absolute -right-12 -bottom-12 h-32 w-32 rounded-full ${catColor.bg} opacity-50 blur-2xl transition-opacity group-hover:opacity-100`} />
              <div className="relative flex items-center gap-4">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${catColor.bg} border ${catColor.border}`}>
                  <CatIcon size={26} className={catColor.text} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-white">{cat.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{cat.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
                    <span>{catModules.length} modules</span>
                    {startedCount > 0 && (
                      <span className={catColor.text}>{startedCount} in progress</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={20} className="flex-shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
              </div>
            </button>
          );
        })}
      </div>

      {/* All modules count */}
      <div className="px-5 pt-6">
        <div className="rounded-2xl border border-white/5 bg-gradient-to-r from-slate-900/80 to-slate-800/40 p-5 text-center">
          <p className="font-display text-3xl font-bold text-white">{modules.length}</p>
          <p className="mt-1 text-xs text-slate-400">Total modules across all categories</p>
        </div>
      </div>
    </div>
  );
}
