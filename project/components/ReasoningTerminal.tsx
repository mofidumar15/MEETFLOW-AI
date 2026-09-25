'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect } from 'react';
import {
  Terminal,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Brain,
  FileSearch,
  ListChecks,
  Wrench,
  Sparkles,
} from 'lucide-react';
import type { ReasoningStep, ReasoningStepType } from '@/types';
import { cn } from '@/lib/utils';

interface ReasoningTerminalProps {
  steps: ReasoningStep[];
  isProcessing: boolean;
}

const stepIcon: Record<ReasoningStepType, typeof Brain> = {
  parse: FileSearch,
  extract: ListChecks,
  analyze: Brain,
  tool: Wrench,
  summarize: Sparkles,
  done: CheckCircle2,
  error: XCircle,
};

const stepColor: Record<ReasoningStepType, string> = {
  parse: 'text-electric-400',
  extract: 'text-electric-300',
  analyze: 'text-cyber-400',
  tool: 'text-cyber-300',
  summarize: 'text-electric-400',
  done: 'text-success',
  error: 'text-error',
};

// ============================================================
// ReasoningTerminal — live cyber terminal showing AI steps
// ============================================================

export function ReasoningTerminal({ steps, isProcessing }: ReasoningTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [steps]);

  return (
    <div className="relative h-full overflow-hidden rounded-xl border border-electric-500/30 bg-slate-950/80 backdrop-blur-xl">
      {/* Terminal header */}
      <div className="flex items-center justify-between border-b border-electric-500/20 bg-slate-900/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-electric-400" />
          <span className="font-mono text-sm font-semibold text-electric-300">
            agent_reasoning.log
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-cyber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="h-[calc(100%-44px)] overflow-y-auto px-4 py-3 font-mono text-sm"
      >
        {/* Boot line */}
        {steps.length === 0 && !isProcessing && (
          <div className="space-y-1 text-slate-500">
            <div className="text-electric-400">$ meetflow-agent --init</div>
            <div>MeetFlow AI agent v1.0.0 ready.</div>
            <div className="text-slate-600">Waiting for transcript input...</div>
            <div className="mt-2 inline-block h-4 w-2 animate-blink-cursor bg-electric-400" />
          </div>
        )}

        <AnimatePresence initial={false}>
          {steps.map((step) => {
            const Icon = stepIcon[step.type];
            const colorClass = stepColor[step.type];

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="group mb-1.5 flex items-start gap-2"
              >
                {/* Timestamp */}
                <span className="mt-0.5 shrink-0 text-xs text-slate-600">
                  {new Date(step.timestamp).toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>

                {/* Icon / status indicator */}
                <span className={cn('mt-0.5 shrink-0', colorClass)}>
                  {step.status === 'running' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : step.status === 'error' ? (
                    <XCircle className="h-4 w-4" />
                  ) : step.status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'font-medium',
                      step.status === 'error'
                        ? 'text-error'
                        : step.status === 'completed'
                          ? 'text-slate-300'
                          : colorClass,
                    )}
                  >
                    {step.label}
                  </span>
                  {step.detail && (
                    <div className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
                      <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-electric-500/50" />
                      <span className="break-words">{step.detail}</span>
                    </div>
                  )}
                  {step.durationMs !== undefined && step.status === 'completed' && (
                    <span className="ml-2 text-xs text-slate-600">
                      [{step.durationMs}ms]
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Live cursor while processing */}
        {isProcessing && (
          <div className="mt-1 flex items-center gap-2 text-cyber-400">
            <span className="text-xs">{'>'}</span>
            <span className="inline-block h-4 w-2 animate-blink-cursor bg-cyber-400" />
          </div>
        )}
      </div>
    </div>
  );
}
