import { GoogleGenAI } from '@google/genai';
import type {
  MeetingAnalysis,
  ActionItem,
  MeetingDecision,
  Priority,
} from '@/types';

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to your .env.local file.',
    );
  }
  return new GoogleGenAI({ apiKey });
}

const SYSTEM_PROMPT = `You are MeetFlow AI, an expert meeting productivity agent.
Given a raw meeting transcript, produce a structured analysis as JSON with these exact fields:

{
  "summary": string,           // 3-5 sentence executive summary
  "keyPoints": string[],       // 3-8 key discussion points
  "decisions": [{ "text": string, "rationale": string }],  // decisions made
  "actionItems": [{            // tasks extracted from the transcript
    "title": string,           // short task name
    "description": string,     // 1-2 sentence detail
    "owner": string,           // person responsible (from participants or "Unassigned")
    "priority": "high" | "medium" | "low",
    "dueDate": string | null   // ISO date if mentioned, else null
  }],
  "sentiment": "positive" | "neutral" | "negative",
  "topics": string[],          // 2-5 topic tags
  "participants": string[]     // all people mentioned/speaking
}

Rules:
- If no explicit owner is mentioned, assign to the most relevant speaker or "Unassigned".
- Infer priority from urgency cues ("urgent", "ASAP", "by Friday" = high; "when possible" = low; default medium).
- Be precise and concise. Do not invent information not in the transcript.
- Return ONLY the JSON object, no markdown fences or extra text.`;

export async function analyzeMeeting(
  transcript: string,
  participants?: string[],
): Promise<MeetingAnalysis> {
  const client = getClient();
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const userPrompt = participants?.length
    ? `Participants: ${participants.join(', ')}\n\nTranscript:\n${transcript}`
    : `Transcript:\n${transcript}`;

  const response = await client.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      temperature: 0.3,
      maxOutputTokens: 2000,
    },
  });

  const content = response.text;
  if (!content) {
    throw new Error('Gemini returned an empty response.');
  }

  const parsed = JSON.parse(content) as Omit<MeetingAnalysis, 'actionItems' | 'decisions'> & {
    actionItems: Array<Omit<ActionItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>>;
    decisions: Array<{ text: string; rationale?: string }>;
  };

  const now = new Date().toISOString();

  const actionItems: ActionItem[] = (parsed.actionItems || []).map((item, i) => ({
    id: `task-${Date.now()}-${i}`,
    title: item.title,
    description: item.description,
    owner: item.owner || 'Unassigned',
    priority: (['high', 'medium', 'low'].includes(item.priority)
      ? item.priority
      : 'medium') as Priority,
    status: 'pending' as const,
    dueDate: item.dueDate || undefined,
    createdAt: now,
    updatedAt: now,
  }));

  const decisions: MeetingDecision[] = (parsed.decisions || []).map((decision, i) => ({
    id: `dec-${Date.now()}-${i}`,
    text: decision.text,
    rationale: decision.rationale,
  }));

  return {
    summary: parsed.summary || '',
    keyPoints: parsed.keyPoints || [],
    decisions,
    actionItems,
    sentiment: parsed.sentiment || 'neutral',
    topics: parsed.topics || [],
    participants: parsed.participants || participants || [],
  };
}

export function isGeminiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}