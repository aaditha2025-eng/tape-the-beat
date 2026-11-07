-- =========================================================================
-- DANCEJUDGE PRO (TAPE THE BEAT) - SUPABASE DATABASE INITIALIZATION
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Click "Run"
-- Link: https://supabase.com/dashboard/project/lkhgccaokicgyfrsbhlt/sql/new
-- =========================================================================

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
  id TEXT PRIMARY KEY,
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

-- Enable Realtime for all tables safely
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.entries;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.judges;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;
  EXCEPTION WHEN duplicate_object THEN
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
  EXCEPTION WHEN duplicate_object THEN
  END;
END $$;

-- Enable Row Level Security (RLS) with permissive access for event scoring
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all entries" ON public.entries;
CREATE POLICY "Allow all entries" ON public.entries FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all judges" ON public.judges;
CREATE POLICY "Allow all judges" ON public.judges FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all scores" ON public.scores;
CREATE POLICY "Allow all scores" ON public.scores FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all settings" ON public.settings;
CREATE POLICY "Allow all settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
