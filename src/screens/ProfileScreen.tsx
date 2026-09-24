import { useEffect, useState } from 'react';
import {
  User as UserIcon,
  Bookmark,
  TrendingUp,
  LogOut,
  Settings,
  Bell,
  Moon,
  Globe,
  HelpCircle,
  ChevronRight,
  Award,
  Target,
  Trash2,
  Mail,
  Briefcase,
  Plane,
  Scale,
  BookOpen,
  Cpu,
  Rocket,
  Fan,
  Bot,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { ModuleProgress, Bookmark as BookmarkType, ScreenName } from '@/types';
import { modules } from '@/data/training';

interface ProfileScreenProps {
  onNavigate: (screen: ScreenName) => void;
}

const categoryIcons: Record<string, typeof Plane> = {
  'aircraft-design': Plane,
  'advanced-drone': Rocket,
  'helicopter-design': Fan,
  'robotics': Bot,
  'drone-law': Scale,
};

const categoryColors: Record<string, string> = {
  'aircraft-design': 'bg-sky-500/10 text-sky-400',
  'advanced-drone': 'bg-orange-500/10 text-orange-400',
  'helicopter-design': 'bg-cyan-500/10 text-cyan-400',
  'robotics': 'bg-emerald-500/10 text-emerald-400',
  'drone-law': 'bg-amber-500/10 text-amber-400',
  'law': 'bg-amber-500/10 text-amber-400',
  'training': 'bg-sky-500/10 text-sky-400',
};

export default function ProfileScreen({ onNavigate }: ProfileScreenProps) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [progressItems, setProgressItems] = useState<ModuleProgress[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [activeTab, setActiveTab] = useState<'progress' | 'bookmarks'>('progress');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prog }, { data: bks }] = await Promise.all([
        supabase.from('module_progress').select('*').eq('user_id', user.id).order('last_accessed', { ascending: false }),
        supabase.from('bookmarks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      setProgressItems(prog as ModuleProgress[] || []);
      setBookmarks(bks as BookmarkType[] || []);
    })();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setBio(profile.bio);
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ full_name: fullName, bio, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    await refreshProfile();
    setEditing(false);
  };

  const deleteBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const completedCount = progressItems.filter((p) => p.progress === 100).length;
  const inProgressCount = progressItems.filter((p) => p.progress > 0 && p.progress < 100).length;
  const overallProgress = Math.round(
    progressItems.reduce((sum, p) => sum + p.progress, 0) / modules.length
  );

  const settingsItems = [
    { icon: Bell, label: 'Notifications', value: 'On' },
    { icon: Moon, label: 'Dark Mode', value: 'Active' },
    { icon: Globe, label: 'Language', value: 'English' },
    { icon: HelpCircle, label: 'Help & Support', value: '' },
  ];

  const firstName = profile?.full_name?.split(' ')[0] || 'U';
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n.charAt(0)).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-28">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/50 px-5 pt-12 pb-6">
        <div className="pointer-events-none absolute -right-16 -top-10 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex items-center justify-between mb-5">
          <h1 className="font-display text-xl font-bold text-white">Profile</h1>
          <button
            onClick={() => setEditing(!editing)}
            className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-sky-300"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="relative flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-500 text-2xl font-bold text-white shadow-xl shadow-sky-500/20">
            {initials}
          </div>
          <div className="flex-1">
            {editing ? (
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm font-bold text-white focus:border-sky-500 focus:outline-none"
              />
            ) : (
              <h2 className="font-display text-lg font-bold text-white">{profile?.full_name || 'User'}</h2>
            )}
            <div className="mt-1 flex items-center gap-2">
              <Mail size={12} className="text-slate-500" />
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Briefcase size={12} className="text-sky-400" />
              <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-medium capitalize text-sky-300">
                {profile?.role || 'Student'}
              </span>
            </div>
          </div>
        </div>

        {editing && (
          <div className="relative mt-4 animate-fade-in">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
            />
            <button
              onClick={saveProfile}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-2.5 text-sm font-semibold text-white"
            >
              Save Changes
            </button>
          </div>
        )}

        {profile?.bio && !editing && (
          <p className="relative mt-3 text-xs leading-relaxed text-slate-400">{profile.bio}</p>
        )}
      </div>

      {/* Stats */}
      <div className="px-5 pt-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-center">
            <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <Award size={18} className="text-emerald-400" />
            </div>
            <p className="font-display text-xl font-bold text-white">{completedCount}</p>
            <p className="text-[10px] text-slate-400">Completed</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-center">
            <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
              <Target size={18} className="text-sky-400" />
            </div>
            <p className="font-display text-xl font-bold text-white">{inProgressCount}</p>
            <p className="text-[10px] text-slate-400">In Progress</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-center">
            <div className="mx-auto mb-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10">
              <Bookmark size={18} className="text-orange-400" />
            </div>
            <p className="font-display text-xl font-bold text-white">{bookmarks.length}</p>
            <p className="text-[10px] text-slate-400">Bookmarks</p>
          </div>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="px-5 pt-4">
        <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-sky-400" />
              <span className="text-xs font-medium text-slate-300">Overall Progress</span>
            </div>
            <span className="text-xs font-bold text-sky-400">{overallProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-1000"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-5 pt-6">
        <div className="flex gap-2 rounded-2xl bg-slate-800/50 p-1.5">
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all ${
              activeTab === 'progress' ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white' : 'text-slate-400'
            }`}
          >
            My Progress
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all ${
              activeTab === 'bookmarks' ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white' : 'text-slate-400'
            }`}
          >
            Bookmarks
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-5 pt-4">
        {activeTab === 'progress' ? (
          <div className="space-y-3">
            {progressItems.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <Target size={40} className="mb-3 text-slate-700" />
                <p className="text-sm text-slate-500">No modules started yet</p>
                <button
                  onClick={() => onNavigate('training')}
                  className="mt-3 rounded-lg bg-sky-500/20 px-4 py-2 text-xs font-medium text-sky-300"
                >
                  Browse Training Modules
                </button>
              </div>
            )}
            {progressItems.map((item, i) => {
              const CatIcon = categoryIcons[item.category] || BookOpen;
              const catColor = categoryColors[item.category] || 'bg-slate-700 text-slate-300';
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${catColor}`}>
                      <CatIcon size={18} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-white">{item.module_name}</p>
                      <p className="text-[11px] capitalize text-slate-500">{item.category.replace(/-/g, ' ')}</p>
                    </div>
                    <span className={`text-xs font-bold ${item.progress === 100 ? 'text-emerald-400' : 'text-sky-400'}`}>
                      {item.progress}%
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-700/50">
                    <div
                      className={`h-full rounded-full ${
                        item.progress === 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-sky-500 to-cyan-400'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <Bookmark size={40} className="mb-3 text-slate-700" />
                <p className="text-sm text-slate-500">No bookmarks yet</p>
                <p className="mt-1 text-xs text-slate-600">Bookmark legal sections and training content to find them here</p>
              </div>
            )}
            {bookmarks.map((bm, i) => {
              const catColor = categoryColors[bm.category] || 'bg-slate-700 text-slate-300';
              return (
                <div
                  key={bm.id}
                  className="group rounded-2xl border border-white/5 bg-slate-900/60 p-4 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${catColor}`}>
                      <Bookmark size={16} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-white">{bm.title}</p>
                      {bm.reference && <p className="mt-0.5 text-[11px] text-slate-400">{bm.reference}</p>}
                      {bm.note && <p className="mt-1.5 text-xs text-slate-500">{bm.note}</p>}
                      <span className="mt-2 inline-block rounded-full bg-slate-800 px-2 py-0.5 text-[9px] capitalize text-slate-400">
                        {bm.category}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteBookmark(bm.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 size={15} className="text-rose-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="px-5 pt-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-300">Settings</h3>
        <div className="space-y-2">
          {settingsItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/60 p-4 text-left transition-all hover:border-white/10"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800">
                  <Icon size={16} className="text-slate-400" />
                </div>
                <span className="flex-1 text-sm text-slate-300">{item.label}</span>
                {item.value && <span className="text-xs text-slate-500">{item.value}</span>}
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Sign out */}
      <div className="px-5 pt-5">
        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 py-3.5 text-sm font-semibold text-rose-400 transition-all hover:bg-rose-500/10"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>

      <div className="px-5 pt-4 text-center">
        <p className="text-[10px] text-slate-600">DroneLex & Pilot AI v1.0.0</p>
      </div>
    </div>
  );
}
