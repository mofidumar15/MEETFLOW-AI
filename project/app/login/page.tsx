'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Mail, Lock, Loader2, AlertCircle, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { CyberParticles } from '@/components/CyberParticles';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const fn = mode === 'signin' ? signIn : signUp;
    const { error: err } = await fn(email, password);

    if (err) {
      setError(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="hud-bg absolute inset-0" />
      <div className="absolute inset-0 bg-cyber-radial" />
      <CyberParticles count={20} />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-950 to-transparent" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo + title */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 flex items-center justify-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 animate-glow-pulse rounded-xl bg-electric-500/30 blur-xl" />
                <div className="relative rounded-xl border border-electric-500/30 bg-slate-900/80 p-2.5 backdrop-blur">
                  <Bot className="h-7 w-7 text-electric-400" />
                </div>
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="text-cyber-gradient">MeetFlow AI</span>
              </h1>
            </motion.div>
            <p className="text-sm text-slate-400">
              {mode === 'signin'
                ? 'Sign in to access your meeting analyses and tasks'
                : 'Create an account to start turning meetings into action'}
            </p>
          </div>

          {/* Card */}
          <div className="glass-card glow-border rounded-2xl p-6 sm:p-8">
            {/* Mode toggle */}
            <div className="mb-6 flex rounded-lg border border-electric-500/20 bg-slate-950/60 p-1">
              <button
                onClick={() => { setMode('signin'); setError(null); }}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                  mode === 'signin'
                    ? 'bg-electric-500/20 text-electric-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null); }}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                  mode === 'signup'
                    ? 'bg-electric-500/20 text-electric-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-electric-500/20 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-electric-500/50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                    className="w-full rounded-lg border border-electric-500/20 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-electric-500/50"
                  />
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-glow flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-600 to-electric-500 py-3 text-sm font-bold text-white shadow-lg shadow-electric-500/20 transition-all hover:shadow-electric-500/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch link */}
            <p className="mt-5 text-center text-xs text-slate-500">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError(null);
                }}
                className="font-semibold text-electric-400 hover:text-electric-300"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Feature badges */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-electric-500/20 bg-electric-500/10 px-3 py-1 text-electric-300">
              <Zap className="h-3 w-3" /> Google Gemini
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
