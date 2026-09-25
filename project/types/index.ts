// ============================================================
// MeetFlow AI — Core Type Definitions
// ============================================================

/** Priority levels for action items / tasks */
export type Priority = 'high' | 'medium' | 'low';

/** Visual / processing state of the AI robot mascot */
export type RobotState = 'idle' | 'thinking' | 'success' | 'error' | 'talking';

/** Status of a task on the dashboard */
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

/** Status of a reasoning step in the live terminal */
export type ReasoningStepStatus = 'pending' | 'running' | 'completed' | 'error';

/** Category of a reasoning log entry */
export type ReasoningStepType =
  | 'parse'
  | 'extract'
  | 'analyze'
  | 'tool'
  | 'summarize'
  | 'done'
  | 'error';

// ----------------------------------------------------------------
// Meeting Transcript
// ----------------------------------------------------------------

export interface MeetingTranscript {
  id: string;
  title: string;
  rawText: string;
  participants: string[];
  createdAt: string;
  durationMinutes?: number;
}

// ----------------------------------------------------------------
// Action Item / Task
// ----------------------------------------------------------------

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  owner: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  sourceTranscriptId?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------
// AI Reasoning Step (live terminal log)
// ----------------------------------------------------------------

export interface ReasoningStep {
  id: string;
  type: ReasoningStepType;
  label: string;
  detail?: string;
  status: ReasoningStepStatus;
  timestamp: number;
  durationMs?: number;
}

// ----------------------------------------------------------------
// Meeting Analysis Result (from Gemini)
// ----------------------------------------------------------------

export interface MeetingDecision {
  id: string;
  text: string;
  rationale?: string;
}

export interface MeetingAnalysis {
  summary: string;
  keyPoints: string[];
  decisions: MeetingDecision[];
  actionItems: ActionItem[];
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  participants: string[];
}

// ----------------------------------------------------------------
// Swytchcode API
// ----------------------------------------------------------------

export interface SwytchcodeToolRequest {
  tool: string;
  parameters: Record<string, unknown>;
  transcriptId?: string;
}

export interface SwytchcodeToolResponse {
  success: boolean;
  tool: string;
  result: unknown;
  message?: string;
  executedAt: string;
  durationMs: number;
}

export interface SwytchcodeCreateTaskParams {
  title: string;
  description: string;
  owner: string;
  priority: Priority;
  dueDate?: string;
}

export interface SwytchcodeExportParams {
  format: 'json' | 'csv' | 'markdown';
  data: ActionItem[] | MeetingAnalysis;
}

// ----------------------------------------------------------------
// Agent API Request / Response
// ----------------------------------------------------------------

export interface AgentRequest {
  transcript: string;
  meetingTitle?: string;
  participants?: string[];
  executeSwytchcode?: boolean;
}

export interface AgentStreamChunk {
  type: 'reasoning' | 'partial' | 'result' | 'error' | 'done';
  step?: ReasoningStep;
  analysis?: MeetingAnalysis;
  message?: string;
  timestamp: number;
}

export interface AgentResponse {
  success: boolean;
  analysis?: MeetingAnalysis;
  swytchcodeResults?: SwytchcodeToolResponse[];
  error?: string;
  durationMs: number;
}
