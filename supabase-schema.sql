-- DanceJudge Pro Database Schema
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Entries table
CREATE TABLE IF NOT EXISTS public.entries (
  id TEXT PRIMARY KEY,
  anonymous_id TEXT NOT NULL,
  category TEXT NOT NULL,
  display_name TEXT,
  primary_reg_no TEXT,
  primary_phone TEXT,
  primary_email TEXT,
  main_video TEXT,
  video_links JSONB DEFAULT '[]'::jsonb,
  performers JSONB DEFAULT '[]'::jsonb,
  flags JSONB DEFAULT '[]'::jsonb,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  is_excluded BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Judges table
CREATE TABLE IF NOT EXISTS public.judges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Scores table
CREATE TABLE IF NOT EXISTS public.scores (
  id TEXT PRIMARY KEY, -- e.g. '{judge_id}_{entry_id}'
  judge_id TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  total NUMERIC NOT NULL,
  criteria_scores JSONB DEFAULT '{}'::jsonb,
  comment TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  locked_categories JSONB DEFAULT '{"SOLO": false, "DUO": false, "TRIO": false}'::jsonb,
  names_visible BOOLEAN DEFAULT FALSE,
  admin_pin TEXT DEFAULT '2026',
  active_round_name TEXT DEFAULT 'Final Round 2026'
);

-- Insert default settings row if not exists
INSERT INTO public.settings (id, locked_categories, names_visible, admin_pin, active_round_name)
VALUES ('global', '{"SOLO": false, "DUO": false, "TRIO": false}', false, '2026', 'Final Round 2026')
ON CONFLICT (id) DO NOTHING;

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.judges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;

-- Enable RLS and permissive policies for event scoring
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read entries" ON public.entries FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update entries" ON public.entries FOR ALL USING (true);

CREATE POLICY "Allow public read judges" ON public.judges FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update judges" ON public.judges FOR ALL USING (true);

CREATE POLICY "Allow public read scores" ON public.scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update scores" ON public.scores FOR ALL USING (true);

CREATE POLICY "Allow public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update settings" ON public.settings FOR ALL USING (true);
