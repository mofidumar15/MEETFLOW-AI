'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  Gavel,
  Tag,
  Smile,
} from 'lucide-react';
import type { MeetingAnalysis } from '@/types';
import { cn } from '@/lib/utils';

interface AnalysisPanelProps {
  analysis: MeetingAnalysis;
}

// ============================================================
// AnalysisPanel — renders the AI's structured meeting analysis
// (summary, key points, decisions, topics, sentiment)
// ============================================================

export function AnalysisPanel({ analysis }: AnalysisPanelProps) {
  const sentimentColor =
    analysis.sentiment === 'positive'
      ? 'text-success bg-success/10 border-success/30'
      : analysis.sentiment === 'negative'
        ? 'text-error bg-error/10 border-error/30'
        : 'text-slate-400 bg-slate-800/40 border-slate-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Summary */}
      <div className="glass-card glow-border rounded-xl p-5">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-electric-400" />
          <h3 className="text-lg font-bold text-slate-100">Executive Summary</h3>
          <span
            className={cn(
              'ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize',
              sentimentColor,
            )}
          >
            <Smile className="h-3 w-3" />
            {analysis.sentiment}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">{analysis.summary}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Key Points */}
        <div className="glass-card glow-border rounded-xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-electric-400" />
            <h3 className="font-bold text-slate-100">Key Points</h3>
          </div>
          <ul className="space-y-2">
            {analysis.keyPoints.map((point, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2 text-sm text-slate-300"
              >
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-electric-400" />
                {point}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Decisions */}
        <div className="glass-card glow-border rounded-xl p-5">
          <div className="mb-3 flex items-center gap-2">
            <Gavel className="h-5 w-5 text-cyber-400" />
            <h3 className="font-bold text-slate-100">Decisions</h3>
          </div>
          {analysis.decisions.length === 0 ? (
            <p className="text-sm text-slate-500">No explicit decisions recorded.</p>
          ) : (
            <ul className="space-y-3">
              {analysis.decisions.map((dec, i) => (
                <motion.li
                  key={dec.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-l-2 border-cyber-400/40 pl-3"
                >
                  <p className="text-sm font-medium text-slate-200">{dec.text}</p>
                  {dec.rationale && (
                    <p className="mt-0.5 text-xs text-slate-500">{dec.rationale}</p>
                  )}
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Topics & Participants */}
      <div className="flex flex-wrap items-center gap-2">
        <Tag className="h-4 w-4 text-slate-500" />
        {analysis.topics.map((topic, i) => (
          <span
            key={i}
            className="rounded-full border border-electric-500/20 bg-electric-500/10 px-3 py-1 text-xs font-medium text-electric-300"
          >
            {topic}
          </span>
        ))}
        {analysis.participants.map((p, i) => (
          <span
            key={`p-${i}`}
            className="rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs font-medium text-slate-400"
          >
            {p}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
