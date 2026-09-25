import { NextRequest, NextResponse } from 'next/server';
import { analyzeMeeting } from '@/lib/gemini';
import { syncActionItems } from '@/services/swytchcode';
import type { AgentResponse } from '@/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

// ============================================================
// POST /api/agent
// Accepts a meeting transcript, runs the Gemini agent to extract
// a structured analysis, and optionally syncs action items to
// Swytchcode. Returns the full analysis + tool results.
// ============================================================

export async function POST(req: NextRequest) {
  const start = Date.now();

  let body: {
    transcript: string;
    meetingTitle?: string;
    participants?: string[];
    executeSwytchcode?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body.', durationMs: 0 } satisfies AgentResponse,
      { status: 400 },
    );
  }

  const { transcript, participants, executeSwytchcode } = body;

  if (!transcript || transcript.trim().length < 10) {
    return NextResponse.json(
      {
        success: false,
        error: 'Transcript is too short. Please paste at least a few sentences.',
        durationMs: 0,
      } satisfies AgentResponse,
      { status: 400 },
    );
  }

  // --- Step 1: Gemini analysis ---
  let analysis;
  try {
    analysis = await analyzeMeeting(transcript, participants);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to analyze transcript.';
    return NextResponse.json(
      {
        success: false,
        error: message,
        durationMs: Date.now() - start,
      } satisfies AgentResponse,
      { status: 502 },
    );
  }

  // --- Step 2: Optional Swytchcode sync ---
  let swytchcodeResults;

  if (executeSwytchcode && analysis.actionItems.length > 0) {
    try {
      swytchcodeResults = await syncActionItems(analysis.actionItems);
    } catch (err) {
      // Swytchcode failure is non-fatal — return analysis + the error
      swytchcodeResults = [
        {
          success: false,
          tool: 'sync_action_items',
          result: null,
          message:
            err instanceof Error
              ? err.message
              : 'Swytchcode sync failed (key may be missing).',
          executedAt: new Date().toISOString(),
          durationMs: 0,
        },
      ];
    }
  }

  return NextResponse.json({
    success: true,
    analysis,
    swytchcodeResults,
    durationMs: Date.now() - start,
  } satisfies AgentResponse);
}
