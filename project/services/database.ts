'use client';

import { supabase } from '@/lib/supabase-client';
import type { MeetingAnalysis, ActionItem } from '@/types';

export interface MeetingRecord {
  id: string;
  title: string;
  transcript: string;
  summary: string;
  key_points: string[];
  decisions: { id: string; text: string; rationale?: string }[];
  sentiment: string;
  topics: string[];
  participants: string[];
  created_at: string;
}

export interface TaskRecord {
  id: string;
  meeting_id: string | null;
  user_id: string;
  title: string;
  description: string;
  owner: string;
  priority: string;
  status: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export async function saveMeeting(
  meetingTitle: string,
  transcript: string,
  analysis: MeetingAnalysis,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('meetings')
    .insert({
      title: meetingTitle || 'Untitled Meeting',
      transcript,
      summary: analysis.summary,
      key_points: analysis.keyPoints,
      decisions: analysis.decisions,
      sentiment: analysis.sentiment,
      topics: analysis.topics,
      participants: analysis.participants,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to save meeting:', error.message);
    return null;
  }
  return data.id;
}

export async function saveTasks(
  meetingId: string,
  tasks: ActionItem[],
): Promise<void> {
  if (tasks.length === 0) return;

  const rows = tasks.map((t) => ({
    meeting_id: meetingId,
    title: t.title,
    description: t.description,
    owner: t.owner,
    priority: t.priority,
    status: t.status,
    due_date: t.dueDate ?? null,
  }));

  const { error } = await supabase.from('tasks').insert(rows);
  if (error) {
    console.error('Failed to save tasks:', error.message);
  }
}

export async function loadTasks(): Promise<ActionItem[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load tasks:', error.message);
    return [];
  }

  return (data as TaskRecord[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    owner: row.owner,
    priority: row.priority as ActionItem['priority'],
    status: row.status as ActionItem['status'],
    dueDate: row.due_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function updateTaskInDb(
  id: string,
  updates: Partial<ActionItem>,
): Promise<void> {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.owner !== undefined) dbUpdates.owner = updates.owner;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;

  const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
  if (error) {
    console.error('Failed to update task:', error.message);
  }
}

export async function deleteTaskFromDb(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete task:', error.message);
  }
}

export async function loadMeetings(): Promise<MeetingRecord[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to load meetings:', error.message);
    return [];
  }
  return data as MeetingRecord[];
}
