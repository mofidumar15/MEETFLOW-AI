/*
# Create meetings and tasks tables for MeetFlow AI

## Purpose
Stores each user's meeting analyses and extracted action items so they
persist across sessions. Each user sees only their own data.

## New Tables

### meetings
- id (uuid, primary key)
- user_id (uuid, references auth.users, defaults to auth.uid())
- title (text, meeting title — optional from the UI)
- transcript (text, raw meeting transcript)
- summary (text, AI-generated executive summary)
- key_points (jsonb, array of key point strings)
- decisions (jsonb, array of { id, text, rationale? } objects)
- sentiment (text, 'positive' | 'neutral' | 'negative')
- topics (jsonb, array of topic strings)
- participants (jsonb, array of participant name strings)
- created_at (timestamptz, defaults to now())

### tasks
- id (uuid, primary key)
- meeting_id (uuid, references meetings, cascade delete)
- user_id (uuid, references auth.users, defaults to auth.uid())
- title (text, task title)
- description (text, task description)
- owner (text, person assigned)
- priority (text, 'high' | 'medium' | 'low')
- status (text, 'pending' | 'in_progress' | 'completed')
- due_date (text, optional ISO date string)
- created_at (timestamptz, defaults to now())
- updated_at (timestamptz, defaults to now())

## Security
- RLS enabled on both tables.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
- Tasks are scoped through their parent meeting's ownership via user_id on the task itself.
*/

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Meeting',
  transcript text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  key_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  decisions jsonb NOT NULL DEFAULT '[]'::jsonb,
  sentiment text NOT NULL DEFAULT 'neutral',
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  participants jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_meetings" ON meetings;
CREATE POLICY "select_own_meetings" ON meetings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_meetings" ON meetings;
CREATE POLICY "insert_own_meetings" ON meetings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_meetings" ON meetings;
CREATE POLICY "update_own_meetings" ON meetings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_meetings" ON meetings;
CREATE POLICY "delete_own_meetings" ON meetings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES meetings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT 'Unassigned',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  due_date text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON tasks;
CREATE POLICY "select_own_tasks" ON tasks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasks" ON tasks;
CREATE POLICY "insert_own_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON tasks;
CREATE POLICY "update_own_tasks" ON tasks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasks" ON tasks;
CREATE POLICY "delete_own_tasks" ON tasks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_meeting_id ON tasks(meeting_id);
