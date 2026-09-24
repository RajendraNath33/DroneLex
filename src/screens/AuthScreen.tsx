import { useState } from 'react';
import { Plane, Mail, Lock, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signup' && fullName.trim().length < 2) {
      setError('Please enter your full name');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password, fullName);

    if (error) {
      setError(error);
    }
    setLoading(false);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-10 top-40 h-32 w-32 rounded-full bg-orange-500/5 blur-2xl" />
      </div>

      {/* Header */}
      <div className="relative flex flex-col items-center px-6 pt-16 pb-8">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-sky-500/30">
          <Plane size={40} className="text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold text-white">DroneLex</h1>
        <p className="mt-1 text-sm font-medium text-sky-400">& Pilot AI</p>
        <p className="mt-3 text-center text-xs text-slate-400">
          Your AI companion for drone piloting, aviation engineering, and DGCA regulations
        </p>
      </div>

      {/* Form */}
      <div className="relative flex-1 px-6 pb-8">
        <div className="mb-6 flex gap-2 rounded-2xl bg-slate-800/50 p-1.5">
          <button
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20'
                : 'text-slate-400'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              mode === 'signin'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20'
                : 'text-slate-400'
            }`}
          >
            Sign In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="animate-fade-in">
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Full Name</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 animate-fade-in">
              <AlertCircle size={16} className="text-rose-400" />
              <span className="text-xs text-rose-300">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:shadow-sky-500/40 disabled:opacity-60"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
          By continuing you agree to our Terms of Service
          <br />
          and Privacy Policy
        </p>
      </div>
    </div>
  );
}
