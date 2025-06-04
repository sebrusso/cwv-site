-- Production Database Fix Script
-- Run this in your Supabase SQL Editor to fix production database issues

-- First, let's ensure all core tables exist with proper structure

-- 1. Fix writingprompts-pairwise-test table
CREATE TABLE IF NOT EXISTS "writingprompts-pairwise-test" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  chosen TEXT,
  rejected TEXT,
  timestamp_chosen TIMESTAMPTZ,
  timestamp_rejected TIMESTAMPTZ,
  upvotes_chosen INTEGER,
  upvotes_rejected INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS and create policies for prompts
ALTER TABLE "writingprompts-pairwise-test" ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read prompts (needed for anonymous users)
DROP POLICY IF EXISTS "Allow public read access to prompts" ON "writingprompts-pairwise-test";
CREATE POLICY "Allow public read access to prompts"
  ON "writingprompts-pairwise-test" FOR SELECT
  USING (true);

-- 2. Fix content_reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Nullable for anonymous reports
  content_type TEXT NOT NULL,
  content_id UUID NOT NULL,
  reason TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Allow public read access to unresolved content reports for filtering
DROP POLICY IF EXISTS "Allow public read access to content reports" ON content_reports;
CREATE POLICY "Allow public read access to content reports"
  ON content_reports FOR SELECT
  USING (true);

-- Allow anyone to insert content reports (for anonymous reporting)
DROP POLICY IF EXISTS "Allow public insert to content reports" ON content_reports;
CREATE POLICY "Allow public insert to content reports"
  ON content_reports FOR INSERT
  WITH CHECK (true);

-- 3. Fix dataset_downloads table
CREATE TABLE IF NOT EXISTS dataset_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Nullable for anonymous downloads
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE dataset_downloads ENABLE ROW LEVEL SECURITY;

-- Allow public read access for download tracking
DROP POLICY IF EXISTS "Allow public read access to dataset downloads" ON dataset_downloads;
CREATE POLICY "Allow public read access to dataset downloads"
  ON dataset_downloads FOR SELECT
  USING (true);

-- Allow public insert for download tracking
DROP POLICY IF EXISTS "Allow public insert to dataset downloads" ON dataset_downloads;
CREATE POLICY "Allow public insert to dataset downloads"
  ON dataset_downloads FOR INSERT
  WITH CHECK (true);

-- 4. Fix human_model_evaluations table
CREATE TABLE IF NOT EXISTS human_model_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  prompt_id UUID REFERENCES "writingprompts-pairwise-test"(id) NOT NULL,
  model_name TEXT NOT NULL,
  guess_correct BOOLEAN NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add is_correct column if it doesn't exist (for model-leaderboard API compatibility)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'human_model_evaluations' AND column_name = 'is_correct') THEN
        ALTER TABLE human_model_evaluations ADD COLUMN is_correct BOOLEAN NOT NULL DEFAULT false;
        -- Update existing rows: is_correct should be opposite of guess_correct for human deceptions
        UPDATE human_model_evaluations SET is_correct = NOT guess_correct WHERE is_correct IS NULL;
        RAISE NOTICE 'Added is_correct column to human_model_evaluations table';
    END IF;
END $$;

ALTER TABLE human_model_evaluations ENABLE ROW LEVEL SECURITY;

-- Allow public read access for leaderboard generation
DROP POLICY IF EXISTS "Allow public read access to human model evaluations" ON human_model_evaluations;
CREATE POLICY "Allow public read access to human model evaluations"
  ON human_model_evaluations FOR SELECT
  USING (true);

-- Allow public insert for anonymous evaluations
DROP POLICY IF EXISTS "Allow public insert to human model evaluations" ON human_model_evaluations;
CREATE POLICY "Allow public insert to human model evaluations"
  ON human_model_evaluations FOR INSERT
  WITH CHECK (true);

-- 5. Fix model_evaluations table
CREATE TABLE IF NOT EXISTS model_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Nullable for anonymous evaluations
  prompt_id UUID REFERENCES "writingprompts-pairwise-test"(id) NOT NULL,
  model_name TEXT NOT NULL,
  selected_response TEXT NOT NULL,
  ground_truth TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE model_evaluations ENABLE ROW LEVEL SECURITY;

-- Allow public read access for leaderboard generation
DROP POLICY IF EXISTS "Allow public read access to model evaluations" ON model_evaluations;
CREATE POLICY "Allow public read access to model evaluations"
  ON model_evaluations FOR SELECT
  USING (true);

-- Allow public insert for anonymous evaluations
DROP POLICY IF EXISTS "Allow public insert to model evaluations" ON model_evaluations;
CREATE POLICY "Allow public insert to model evaluations"
  ON model_evaluations FOR INSERT
  WITH CHECK (true);

-- 6. Fix model_comparisons table
CREATE TABLE IF NOT EXISTS model_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), -- Nullable for anonymous comparisons
  model_a_name TEXT NOT NULL,
  model_b_name TEXT NOT NULL,
  winner TEXT NOT NULL,
  prompt_id UUID REFERENCES "writingprompts-pairwise-test"(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Fix column names if they exist as model_a/model_b instead of model_a_name/model_b_name
DO $$
BEGIN
    -- Check if old column names exist and rename them
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'model_comparisons' AND column_name = 'model_a') THEN
        ALTER TABLE model_comparisons RENAME COLUMN model_a TO model_a_name;
        RAISE NOTICE 'Renamed model_a to model_a_name in model_comparisons table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'model_comparisons' AND column_name = 'model_b') THEN
        ALTER TABLE model_comparisons RENAME COLUMN model_b TO model_b_name;
        RAISE NOTICE 'Renamed model_b to model_b_name in model_comparisons table';
    END IF;
END $$;

ALTER TABLE model_comparisons ENABLE ROW LEVEL SECURITY;

-- Allow public read access for leaderboard generation
DROP POLICY IF EXISTS "Allow public read access to model comparisons" ON model_comparisons;
CREATE POLICY "Allow public read access to model comparisons"
  ON model_comparisons FOR SELECT
  USING (true);

-- Allow public insert for anonymous comparisons
DROP POLICY IF EXISTS "Allow public insert to model comparisons" ON model_comparisons;
CREATE POLICY "Allow public insert to model comparisons"
  ON model_comparisons FOR INSERT
  WITH CHECK (true);

-- 7. Fix live_generations table
CREATE TABLE IF NOT EXISTS live_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES "writingprompts-pairwise-test"(id) NOT NULL,
  model_a_name TEXT NOT NULL,
  response_a_text TEXT NOT NULL,
  model_b_name TEXT NOT NULL,
  response_b_text TEXT NOT NULL,
  generation_parameters_a JSONB,
  generation_parameters_b JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE live_generations ENABLE ROW LEVEL SECURITY;

-- Allow public read access for live generations
DROP POLICY IF EXISTS "Allow public read access to live generations" ON live_generations;
CREATE POLICY "Allow public read access to live generations"
  ON live_generations FOR SELECT
  USING (true);

-- Allow public insert for live generations
DROP POLICY IF EXISTS "Allow public insert to live generations" ON live_generations;
CREATE POLICY "Allow public insert to live generations"
  ON live_generations FOR INSERT
  WITH CHECK (true);

-- 8. Insert some sample data if tables are empty

-- Insert sample prompts if the table is empty
INSERT INTO "writingprompts-pairwise-test" (prompt, chosen, rejected)
SELECT 
    'Write a story about a person who discovers they can see one minute into the future.',
    'Sarah stared at the clock, watching the second hand tick forward. In exactly sixty seconds, her phone would ring. She knew this because she had seen it happen—a flash of knowledge that came to her mind like a remembered dream. The phone rang. She answered on the first ring. "Hello, Mom." The voice on the other end paused. "How did you know it was me?" Sarah smiled. If only she could explain.',
    'Sarah could see the future, but only one minute ahead. It was like having a preview of life, but the previews were so short they were almost useless. She would know someone was about to sneeze, or that the traffic light was about to change, but nothing really important. She wondered if this was a gift or a curse.'
WHERE NOT EXISTS (SELECT 1 FROM "writingprompts-pairwise-test" LIMIT 1);

-- Insert more sample prompts
INSERT INTO "writingprompts-pairwise-test" (prompt, chosen, rejected)
SELECT 
    'A character finds an old diary that writes itself.',
    'The leather-bound journal sat innocuously on the dusty shelf, but Marcus noticed the pen beside it was still wet with ink. He opened to the first page and read: "Today, Marcus will find this diary and wonder how it knows his name." His hands trembled as he turned the page. "He is trembling now," the next line read. "He should stop reading." But he couldn''t.',
    'Marcus found a diary that could write by itself. The pages filled with words as he watched. It was writing about his life, describing what he was doing right now. This was very strange and scary. He decided to take the diary home to study it more.'
WHERE (SELECT COUNT(*) FROM "writingprompts-pairwise-test") < 2;

-- Verify the fix worked
SELECT 
    'Database fix completed successfully' as status,
    COUNT(*) as prompt_count
FROM "writingprompts-pairwise-test";

-- List all tables to verify they exist
SELECT 
    t.table_name,
    c.relrowsecurity as rls_enabled,
    CASE 
        WHEN c.relrowsecurity THEN 'RLS Enabled'
        ELSE 'RLS Disabled'
    END as security_status
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN (
        'writingprompts-pairwise-test',
        'content_reports',
        'dataset_downloads',
        'human_model_evaluations',
        'model_evaluations',
        'model_comparisons',
        'live_generations'
    )
ORDER BY t.table_name; 