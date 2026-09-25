import type {
  SwytchcodeToolRequest,
  SwytchcodeToolResponse,
  SwytchcodeCreateTaskParams,
  SwytchcodeExportParams,
  ActionItem,
  MeetingAnalysis,
} from '@/types';

// ============================================================
// Swytchcode API Integration
// Server-side service for workflow tool execution.
// ============================================================

const SWYTCHCODE_BASE_URL =
  process.env.SWYTCHCODE_API_URL || 'https://api.swytchcode.com/v1';

function getApiKey(): string {
  const key = process.env.SWYTCHCODE_API_KEY;
  if (!key) {
    throw new Error(
      'SWYTCHCODE_API_KEY is not set. Add it to your .env.local file.',
    );
  }
  return key;
}

export function isSwytchcodeConfigured(): boolean {
  return !!process.env.SWYTCHCODE_API_KEY;
}

async function swytchcodeFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const key = getApiKey();
  const res = await fetch(`${SWYTCHCODE_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'X-Client': 'meetflow-ai',
      ...options.headers,
    },
  });
  return res;
}

/**
 * Execute a generic Swytchcode tool call.
 * Falls back gracefully if the API is unreachable, returning a
 * structured error the UI can display.
 */
export async function executeTool(
  req: SwytchcodeToolRequest,
): Promise<SwytchcodeToolResponse> {
  const start = Date.now();
  try {
    const res = await swytchcodeFetch('/tools/execute', {
      method: 'POST',
      body: JSON.stringify(req),
    });

    const result = await res.json();

    if (!res.ok) {
      return {
        success: false,
        tool: req.tool,
        result: null,
        message: result.message || result.error || `HTTP ${res.status}`,
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - start,
      };
    }

    return {
      success: true,
      tool: req.tool,
      result: result.data ?? result,
      message: result.message,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      tool: req.tool,
      result: null,
      message:
        err instanceof Error
          ? `Swytchcode connection failed: ${err.message}`
          : 'Swytchcode connection failed',
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    };
  }
}

/** Create a task in the Swytchcode workflow system. */
export async function createTask(
  params: SwytchcodeCreateTaskParams,
): Promise<SwytchcodeToolResponse> {
  return executeTool({ tool: 'create_task', parameters: params as unknown as Record<string, unknown> });
}

/** Export analysis data (JSON, CSV, or Markdown) via Swytchcode. */
export async function exportData(
  params: SwytchcodeExportParams,
): Promise<SwytchcodeToolResponse> {
  return executeTool({ tool: 'export', parameters: params as unknown as Record<string, unknown> });
}

/** Batch-create action items as Swytchcode tasks. */
export async function syncActionItems(
  items: ActionItem[],
): Promise<SwytchcodeToolResponse[]> {
  return Promise.all(
    items.map((item) =>
      createTask({
        title: item.title,
        description: item.description,
        owner: item.owner,
        priority: item.priority,
        dueDate: item.dueDate,
      }),
    ),
  );
}

/** Generate a formatted export string from a MeetingAnalysis. */
export function buildExportString(
  analysis: MeetingAnalysis,
  format: 'json' | 'csv' | 'markdown',
): string {
  if (format === 'json') {
    return JSON.stringify(analysis, null, 2);
  }

  if (format === 'csv') {
    const rows = ['Title,Owner,Priority,Status,Description,DueDate'];
    for (const item of analysis.actionItems) {
      const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
      rows.push(
        [
          esc(item.title),
          esc(item.owner),
          item.priority,
          item.status,
          esc(item.description),
          item.dueDate || '',
        ].join(','),
      );
    }
    return rows.join('\n');
  }

  // markdown
  const lines: string[] = [
    `# Meeting Analysis`,
    '',
    `## Summary`,
    analysis.summary,
    '',
    `## Key Points`,
    ...analysis.keyPoints.map((p) => `- ${p}`),
    '',
    `## Decisions`,
    ...analysis.decisions.map(
      (d) => `- **${d.text}**${d.rationale ? ` — ${d.rationale}` : ''}`,
    ),
    '',
    `## Action Items`,
    ...analysis.actionItems.map(
      (a) =>
        `- [${a.status === 'completed' ? 'x' : ' '}] **${a.title}** (${a.priority}) — ${a.owner}${a.dueDate ? ` — due ${a.dueDate}` : ''}`,
    ),
  ];
  return lines.join('\n');
}
