-- Add missing tables for API endpoints

-- Add evaluation_quality_metrics table
CREATE TABLE IF NOT EXISTS evaluation_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- Can be UUID for real users or session ID for anonymous users
  evaluation_time INTEGER NOT NULL,
  prompt_similarity DECIMAL NOT NULL,
  confidence_score DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE evaluation_quality_metrics ENABLE ROW LEVEL SECURITY;

-- Add speed_mode_scores table
CREATE TABLE IF NOT EXISTS speed_mode_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- Can be UUID for real users or session ID for anonymous users
  correct INTEGER NOT NULL,
  total INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  longest_streak INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE speed_mode_scores ENABLE ROW LEVEL SECURITY;

-- Add model_writing_rationales table
CREATE TABLE IF NOT EXISTS model_writing_rationales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id TEXT NOT NULL,
  rationale TEXT NOT NULL,
  user_id TEXT, -- Can be UUID for real users or session ID for anonymous users
  prompt_id UUID REFERENCES "writingprompts-pairwise-test"(id) NOT NULL,
  model_name TEXT NOT NULL,
  selected_response TEXT NOT NULL,
  ground_truth TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE model_writing_rationales ENABLE ROW LEVEL SECURITY;

-- Add content_reports table
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- Can be UUID for real users or session ID for anonymous users
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL, -- Changed to TEXT to support various content ID formats
  reason TEXT NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Add dataset_downloads table if it doesn't exist
CREATE TABLE IF NOT EXISTS dataset_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- Can be UUID for real users or session ID for anonymous users
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE dataset_downloads ENABLE ROW LEVEL SECURITY;

-- For existing tables with foreign key constraints and RLS policies, we need to:
-- 1. Drop all existing policies
-- 2. Drop foreign key constraints 
-- 3. Alter column types
-- 4. Make columns nullable
-- 5. Recreate policies

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view their own activity log" ON user_activity_log;
DROP POLICY IF EXISTS "Users can insert their own activity" ON user_activity_log;
DROP POLICY IF EXISTS "Allow public access to user activity log" ON user_activity_log;

DROP POLICY IF EXISTS "Allow public access to model evaluations" ON model_evaluations;
DROP POLICY IF EXISTS "Allow public read access to model evaluations" ON model_evaluations;
DROP POLICY IF EXISTS "Allow public insert to model evaluations" ON model_evaluations;

DROP POLICY IF EXISTS "Allow public access to model comparisons" ON model_comparisons;
DROP POLICY IF EXISTS "Allow public read access to model comparisons" ON model_comparisons;
DROP POLICY IF EXISTS "Allow public insert to model comparisons" ON model_comparisons;

DROP POLICY IF EXISTS "Allow public access to human model evaluations" ON human_model_evaluations;
DROP POLICY IF EXISTS "Allow public read access to human model evaluations" ON human_model_evaluations;
DROP POLICY IF EXISTS "Allow public insert to human model evaluations" ON human_model_evaluations;

-- Handle model_evaluations table
DO $$
BEGIN
    -- Drop foreign key constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'model_evaluations_user_id_fkey' 
               AND table_name = 'model_evaluations') THEN
        ALTER TABLE model_evaluations DROP CONSTRAINT model_evaluations_user_id_fkey;
    END IF;
    
    -- Change column type to TEXT
    ALTER TABLE model_evaluations ALTER COLUMN user_id TYPE TEXT;
    
    -- Make user_id nullable for anonymous users
    ALTER TABLE model_evaluations ALTER COLUMN user_id DROP NOT NULL;
END $$;

-- Handle model_comparisons table
DO $$
BEGIN
    -- Drop foreign key constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'model_comparisons_user_id_fkey' 
               AND table_name = 'model_comparisons') THEN
        ALTER TABLE model_comparisons DROP CONSTRAINT model_comparisons_user_id_fkey;
    END IF;
    
    -- Change column type to TEXT
    ALTER TABLE model_comparisons ALTER COLUMN user_id TYPE TEXT;
    
    -- Make user_id nullable for anonymous users
    ALTER TABLE model_comparisons ALTER COLUMN user_id DROP NOT NULL;
END $$;

-- Handle human_model_evaluations table
DO $$
BEGIN
    -- Drop foreign key constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'human_model_evaluations_user_id_fkey' 
               AND table_name = 'human_model_evaluations') THEN
        ALTER TABLE human_model_evaluations DROP CONSTRAINT human_model_evaluations_user_id_fkey;
    END IF;
    
    -- Change column type to TEXT
    ALTER TABLE human_model_evaluations ALTER COLUMN user_id TYPE TEXT;
    
    -- Make user_id nullable for anonymous users
    ALTER TABLE human_model_evaluations ALTER COLUMN user_id DROP NOT NULL;
END $$;

-- Handle user_activity_log table
DO $$
BEGIN
    -- Drop foreign key constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'user_activity_log_user_id_fkey' 
               AND table_name = 'user_activity_log') THEN
        ALTER TABLE user_activity_log DROP CONSTRAINT user_activity_log_user_id_fkey;
    END IF;
    
    -- Change column type to TEXT
    ALTER TABLE user_activity_log ALTER COLUMN user_id TYPE TEXT;
    
    -- Make user_id nullable for anonymous users
    ALTER TABLE user_activity_log ALTER COLUMN user_id DROP NOT NULL;
END $$;

-- Now recreate all policies to allow public access for anonymous sessions
CREATE POLICY "Allow public access to evaluation quality metrics"
  ON evaluation_quality_metrics FOR ALL
  USING (true);

CREATE POLICY "Allow public access to speed mode scores"
  ON speed_mode_scores FOR ALL
  USING (true);

CREATE POLICY "Allow public access to model writing rationales"
  ON model_writing_rationales FOR ALL
  USING (true);

CREATE POLICY "Allow public access to content reports"
  ON content_reports FOR ALL
  USING (true);

CREATE POLICY "Allow public access to dataset downloads"
  ON dataset_downloads FOR ALL
  USING (true);

CREATE POLICY "Allow public access to model evaluations"
  ON model_evaluations FOR ALL
  USING (true);

CREATE POLICY "Allow public access to model comparisons"
  ON model_comparisons FOR ALL
  USING (true);

CREATE POLICY "Allow public access to human model evaluations"
  ON human_model_evaluations FOR ALL
  USING (true);

CREATE POLICY "Allow public access to user activity log"
  ON user_activity_log FOR ALL
  USING (true);

-- Verify tables exist
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = t.table_name
        ) 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as status
FROM (VALUES 
    ('evaluation_quality_metrics'),
    ('speed_mode_scores'),
    ('model_writing_rationales'),
    ('content_reports'),
    ('dataset_downloads'),
    ('model_evaluations'),
    ('model_comparisons'),
    ('human_model_evaluations'),
    ('user_activity_log'),
    ('anonymous_sessions')
) AS t(table_name)
ORDER BY table_name; 