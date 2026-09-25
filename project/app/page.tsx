'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Loader2,
  Zap,
  Bot,
  ClipboardPaste,
  AlertCircle,
  Workflow,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RobotMascot } from '@/components/RobotMascot';
import { ReasoningTerminal } from '@/components/ReasoningTerminal';
import { TaskDashboard } from '@/components/TaskDashboard';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { CyberParticles } from '@/components/CyberParticles';
import { useAuth } from '@/lib/auth-context';
import {
  saveMeeting,
  saveTasks,
  loadTasks,
  updateTaskInDb,
  deleteTaskFromDb,
} from '@/services/database';
import type {
  RobotState,
  ReasoningStep,
  ActionItem,
  MeetingAnalysis,
  AgentResponse,
} from '@/types';

const SAMPLE_TRANSCRIPT = `Sarah: Thanks everyone for joining. Let's review the Q4 launch plan. Mark, where are we on the landing page?

Mark: The landing page is about 80% done. I need the final copy from Jennifer by Wednesday to finish it.

Jennifer: I'll have the copy ready by Tuesday end of day. I also need legal to approve the privacy policy section — that's urgent.

Sarah: Good. David, any updates on the API integration?

David: The API is integrated but we have a critical bug in the payment flow. It needs to be fixed before launch. I'm assigning this to myself — it's high priority.

Sarah: Let's also decide on the launch date. I propose November 15th. Any objections?

Mark: November 15th works for me. I'll have the page done by then.

Jennifer: Works for me too. I'll coordinate with legal this week.

Sarah: Great. So the decision is November 15th launch. Action items: Mark finishes the landing page by Nov 10th, Jennifer delivers copy by Tuesday and handles legal approval, David fixes the payment bug by Nov 8th. Let's reconvene next Monday.`;

// ============================================================
// MeetFlow AI — Main Dashboard Page
// ============================================================

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const [transcript, setTranscript] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [robotState, setRobotState] = useState<RobotState>('idle');
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);
  const [tasks, setTasks] = useState<ActionItem[]>([]);
  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncSwytchcode, setSyncSwytchcode] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Load saved tasks on mount
  useEffect(() => {
    if (user) {
      loadTasks().then((saved) => {
        if (saved.length > 0) setTasks(saved);
      });
    }
  }, [user]);

  const addStep = useCallback(
    (step: Omit<ReasoningStep, 'id' | 'timestamp'>) => {
      const fullStep: ReasoningStep = {
        ...step,
        id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
      };
      setReasoningSteps((prev) => [...prev, fullStep]);
      return fullStep.id;
    },
    [],
  );

  const updateStep = useCallback(
    (id: string, updates: Partial<ReasoningStep>) => {
      setReasoningSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      );
    },
    [],
  );

  const runAgent = useCallback(async () => {
    if (!transcript.trim() || transcript.trim().length < 10) {
      setError('Please paste a meeting transcript (at least a few sentences).');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setAnalysis(null);
    setTasks([]);
    setRobotState('thinking');
    setReasoningSteps([]);

    const step1Id = addStep({
      type: 'parse',
      label: 'Parsing transcript...',
      detail: `${transcript.length} characters received`,
      status: 'running',
    });

    const step2Timer = setTimeout(() => {
      addStep({
        type: 'analyze',
        label: 'Analyzing conversation context...',
        detail: 'Identifying speakers, topics, and intent',
        status: 'running',
      });
    }, 600);

    const step3Timer = setTimeout(() => {
      updateStep(step1Id, { status: 'completed', durationMs: 600 });
      addStep({
        type: 'extract',
        label: 'Extracting action items & decisions...',
        detail: 'Matching tasks to owners and priorities',
        status: 'running',
      });
    }, 1200);

    const step4Timer = setTimeout(() => {
      addStep({
        type: 'summarize',
        label: 'Generating executive summary...',
        detail: 'Google Gemini reasoning engine',
        status: 'running',
      });
    }, 2000);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          meetingTitle: meetingTitle || undefined,
          executeSwytchcode: syncSwytchcode,
        }),
      });

      const data: AgentResponse = await res.json();

      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(step4Timer);

      if (!data.success || !data.analysis) {
        throw new Error(data.error || 'Agent failed to produce analysis.');
      }

      setReasoningSteps((prev) =>
        prev.map((s) =>
          s.status === 'running'
            ? { ...s, status: 'completed', durationMs: s.durationMs ?? Math.round(data.durationMs / 3) }
            : s,
        ),
      );

      addStep({
        type: 'extract',
        label: `Extracted ${data.analysis.actionItems.length} action items`,
        detail: `${data.analysis.decisions.length} decisions identified`,
        status: 'completed',
        durationMs: 0,
      });

      if (syncSwytchcode && data.swytchcodeResults) {
        const syncId = addStep({
          type: 'tool',
          label: 'Executing Swytchcode tool calls...',
          detail: `Syncing ${data.swytchcodeResults.length} tasks to workflow`,
          status: 'running',
        });
        const syncOk = data.swytchcodeResults.every((r) => r.success);
        updateStep(syncId, {
          status: syncOk ? 'completed' : 'error',
          detail: syncOk
            ? 'All tasks synced successfully'
            : 'Some tasks failed to sync (check API key)',
          durationMs: 500,
        });
      }

      // Persist meeting + tasks to database
      const meetingId = await saveMeeting(meetingTitle, transcript, data.analysis);
      if (meetingId) {
        await saveTasks(meetingId, data.analysis.actionItems);
        addStep({
          type: 'done',
          label: 'Analysis saved to your account.',
          detail: `Total processing time: ${data.durationMs}ms`,
          status: 'completed',
        });
      } else {
        addStep({
          type: 'done',
          label: 'Analysis complete.',
          detail: `Total processing time: ${data.durationMs}ms`,
          status: 'completed',
        });
      }

      setAnalysis(data.analysis);
      setTasks(data.analysis.actionItems);
      setRobotState('success');

      setTimeout(() => setRobotState('idle'), 3000);
    } catch (err) {
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(step4Timer);

      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
      setRobotState('error');
      addStep({
        type: 'error',
        label: 'Agent execution failed.',
        detail: msg,
        status: 'error',
      });
      setTimeout(() => setRobotState('idle'), 4000);
    } finally {
      setIsProcessing(false);
    }
  }, [transcript, meetingTitle, syncSwytchcode, addStep, updateStep]);

  const handleUpdateTask = useCallback(
    (id: string, updates: Partial<ActionItem>) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      setAnalysis((prev) =>
        prev
          ? {
              ...prev,
              actionItems: prev.actionItems.map((t) =>
                t.id === id ? { ...t, ...updates } : t,
              ),
            }
          : prev,
      );
      updateTaskInDb(id, updates);
    },
    [],
  );

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setAnalysis((prev) =>
      prev
        ? { ...prev, actionItems: prev.actionItems.filter((t) => t.id !== id) }
        : prev,
    );
    deleteTaskFromDb(id);
  }, []);

  const loadSample = () => {
    setTranscript(SAMPLE_TRANSCRIPT);
    setMeetingTitle('Q4 Launch Plan Review');
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <div className="hud-bg absolute inset-0" />
        <div className="absolute inset-0 bg-cyber-radial" />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-electric-400" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userEmail = user.email ?? '';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background layers */}
      <div className="hud-bg absolute inset-0" />
      <div className="absolute inset-0 bg-cyber-radial" />
      <CyberParticles count={25} />

      {/* Radial gradient bottom */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-950 to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col items-center gap-2 text-center sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative">
              <div className="absolute inset-0 animate-glow-pulse rounded-xl bg-electric-500/30 blur-xl" />
              <div className="relative rounded-xl border border-electric-500/30 bg-slate-900/80 p-2.5 backdrop-blur">
                <Bot className="h-7 w-7 text-electric-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
              <span className="text-cyber-gradient">MeetFlow AI</span>
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl text-sm text-slate-400 sm:text-base"
          >
            AI Meeting Productivity Agent — paste a transcript and watch the robot
            extract summaries, decisions, and action items in real time.
          </motion.p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-electric-500/20 bg-electric-500/10 px-3 py-1 text-electric-300">
              <Zap className="h-3 w-3" /> Google Gemini
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-cyber-400/20 bg-cyber-400/10 px-3 py-1 text-cyber-300">
              <Workflow className="h-3 w-3" /> Swytchcode
            </span>
          </div>

          {/* User menu */}
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-electric-500/20 bg-slate-900/60 px-4 py-2 backdrop-blur">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <UserIcon className="h-3.5 w-3.5 text-electric-400" />
              {userEmail}
            </span>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 rounded-md border border-error/30 bg-error/10 px-2.5 py-1 text-xs font-medium text-error transition-colors hover:bg-error/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        {/* Main grid: Robot + Input | Terminal */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          {/* Left column: Robot + Transcript input */}
          <div className="space-y-6">
            {/* Robot mascot card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card glow-border flex flex-col items-center rounded-2xl p-6 sm:p-8"
            >
              <RobotMascot state={robotState} size={200} />
              <p className="mt-10 max-w-md text-center text-sm text-slate-400">
                {robotState === 'thinking' &&
                  'My neural circuits are parsing your meeting...'}
                {robotState === 'talking' &&
                  'Transmitting analysis to your dashboard...'}
                {robotState === 'success' &&
                  'Analysis complete! Your tasks are ready below.'}
                {robotState === 'error' &&
                  'Something went wrong. Check the terminal logs.'}
                {robotState === 'idle' &&
                  'I\'m ready. Paste a transcript and hit Run Agent.'}
              </p>
            </motion.div>

            {/* Transcript input */}
            <div className="glass-card glow-border rounded-2xl p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cyber-400" />
                  <h2 className="font-bold text-slate-100">Meeting Transcript</h2>
                </div>
                <button
                  onClick={loadSample}
                  className="flex items-center gap-1.5 rounded-lg border border-electric-500/20 bg-electric-500/10 px-3 py-1.5 text-xs font-medium text-electric-300 transition-colors hover:bg-electric-500/20"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Load Sample
                </button>
              </div>

              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="Meeting title (optional)..."
                className="mb-3 w-full rounded-lg border border-electric-500/20 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-electric-500/50"
              />

              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste your meeting transcript here..."
                rows={8}
                className="w-full resize-y rounded-lg border border-electric-500/20 bg-slate-950/60 px-4 py-3 font-mono text-sm leading-relaxed text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-electric-500/50"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={syncSwytchcode}
                    onChange={(e) => setSyncSwytchcode(e.target.checked)}
                    className="h-4 w-4 rounded border-electric-500/30 bg-slate-900 accent-electric-500"
                  />
                  Sync tasks to Swytchcode
                </label>

                <button
                  onClick={runAgent}
                  disabled={isProcessing || !transcript.trim()}
                  className="btn-glow flex items-center gap-2 rounded-lg bg-gradient-to-r from-electric-600 to-electric-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-electric-500/20 transition-all hover:shadow-electric-500/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Run AI Agent
                    </>
                  )}
                </button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right column: Reasoning terminal */}
          <div className="h-full lg:sticky lg:top-6">
            <div className="h-[420px] lg:h-[640px]">
              <ReasoningTerminal
                steps={reasoningSteps}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </div>

        {/* Analysis results */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8"
            >
              <div className="mb-5 flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-electric-500/30 to-transparent" />
                <span className="text-sm font-bold uppercase tracking-widest text-electric-400">
                  Analysis Output
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-electric-500/30 to-transparent" />
              </div>
              <AnalysisPanel analysis={analysis} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task dashboard */}
        <div className="mt-8">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyber-400/30 to-transparent" />
            <span className="text-sm font-bold uppercase tracking-widest text-cyber-400">
              Action Dashboard
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyber-400/30 to-transparent" />
          </div>
          <TaskDashboard
            tasks={tasks}
            analysis={analysis || undefined}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-slate-800/50 py-6 text-center text-xs text-slate-600">
          <p>
            MeetFlow AI — Powered by Google Gemini & Swytchcode. Built for high-tech
            meeting productivity.
          </p>
        </footer>
      </div>
    </div>
  );
}
