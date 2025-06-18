-- Complete Database Schema for CWV Interactive
-- This schema matches the current production database structure
-- Updated to reflect the exact table definitions and relationships

-- =============================================
-- Core Tables
-- =============================================

-- Create "writingprompts-pairwise-test" table
CREATE TABLE IF NOT EXISTS public."writingprompts-pairwise-test" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prompt text NOT NULL,
  chosen text,
  rejected text,
  timestamp_chosen timestamp with time zone,
  timestamp_rejected timestamp with time zone,
  upvotes_chosen integer,
  upvotes_rejected integer,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "writingprompts-pairwise-test_pkey" PRIMARY KEY (id)
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  username text UNIQUE,
  score integer DEFAULT 0,
  viewed_prompts uuid[] DEFAULT '{}'::uuid[],
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  age_range text,
  education_level text,
  first_language text,
  literature_interest text,
  writing_background text,
  demographics_completed boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- =============================================
-- User Interaction Tables
-- =============================================

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prompt_id uuid NOT NULL,
  selected_text text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT user_feedback_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public."writingprompts-pairwise-test"(id),
  CONSTRAINT user_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create rationales table
CREATE TABLE IF NOT EXISTS public.rationales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL,
  rationale text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT rationales_pkey PRIMARY KEY (id),
  CONSTRAINT rationales_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public."writingprompts-pairwise-test"(id)
);

-- =============================================
-- Evaluation and Assessment Tables
-- =============================================

-- Create human_model_evaluations table
CREATE TABLE IF NOT EXISTS public.human_model_evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  prompt_id uuid NOT NULL,
  model_name text NOT NULL,
  guess_correct boolean NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT human_model_evaluations_pkey PRIMARY KEY (id),
  CONSTRAINT human_model_evaluations_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public."writingprompts-pairwise-test"(id)
);

-- Create model_evaluations table
CREATE TABLE IF NOT EXISTS public.model_evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  prompt_id uuid NOT NULL,
  model_name text NOT NULL,
  selected_response text NOT NULL,
  ground_truth text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT model_evaluations_pkey PRIMARY KEY (id),
  CONSTRAINT model_evaluations_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public."writingprompts-pairwise-test"(id)
);

-- Create model_comparisons table (Updated with correct column names)
CREATE TABLE IF NOT EXISTS public.model_comparisons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  model_a_name text NOT NULL,
  model_b_name text NOT NULL,
  winner text NOT NULL,
  prompt_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT model_comparisons_pkey PRIMARY KEY (id),
  CONSTRAINT model_comparisons_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public."writingprompts-pairwise-test"(id)
);

-- Create model_writing_rationales table
CREATE TABLE IF NOT EXISTS public.model_writing_rationales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  evaluation_id text NOT NULL,
  rationale text NOT NULL,
  user_id text,
  prompt_id uuid NOT NULL,
  model_name text NOT NULL,
  selected_response text NOT NULL,
  ground_truth text NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT model_writing_rationales_pkey PRIMARY KEY (id),
  CONSTRAINT model_writing_rationales_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public."writingprompts-pairwise-test"(id)
);

-- Create evaluation_quality_metrics table (Updated with correct column name)
CREATE TABLE IF NOT EXISTS public.evaluation_quality_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  evaluation_time integer NOT NULL,
  prompt_similarity numeric NOT NULL,
  confidence_score numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT evaluation_quality_metrics_pkey PRIMARY KEY (id)
);

-- =============================================
-- Speed Mode and Gaming Tables
-- =============================================

-- Create speed_mode_scores table
CREATE TABLE IF NOT EXISTS public.speed_mode_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  correct integer NOT NULL,
  total integer NOT NULL,
  duration_seconds integer NOT NULL,
  longest_streak integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT speed_mode_scores_pkey PRIMARY KEY (id)
);

-- =============================================
-- Live Generation and AI Tables
-- =============================================

-- Create live_generations table
CREATE TABLE IF NOT EXISTS public.live_generations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL,
  model_a_name text NOT NULL,
  response_a_text text NOT NULL,
  model_b_name text NOT NULL,
  response_b_text text NOT NULL,
  generation_parameters_a jsonb,
  generation_parameters_b jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT live_generations_pkey PRIMARY KEY (id),
  CONSTRAINT live_generations_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public."writingprompts-pairwise-test"(id)
);

-- =============================================
-- Session and Authentication Tables
-- =============================================

-- Create anonymous_sessions table
CREATE TABLE IF NOT EXISTS public.anonymous_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  evaluations_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  converted_to_user_id uuid,
  CONSTRAINT anonymous_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT anonymous_sessions_converted_to_user_id_fkey FOREIGN KEY (converted_to_user_id) REFERENCES auth.users(id)
);

-- =============================================
-- Content Management and Reporting Tables
-- =============================================

-- Create content_reports table
CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  reason text,
  resolved boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT content_reports_pkey PRIMARY KEY (id),
  CONSTRAINT content_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- =============================================
-- Analytics and Activity Tables
-- =============================================

-- Create user_activity_log table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text,
  activity_type text NOT NULL,
  activity_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_activity_log_pkey PRIMARY KEY (id)
);

-- Create dataset_downloads table
CREATE TABLE IF NOT EXISTS public.dataset_downloads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  downloaded_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT dataset_downloads_pkey PRIMARY KEY (id),
  CONSTRAINT dataset_downloads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create user_experience_feedback table
CREATE TABLE IF NOT EXISTS public.user_experience_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  category text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_experience_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT user_experience_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- =============================================
-- Additional Core Tables
-- =============================================

-- Create prompts table (for additional prompts beyond the main dataset)
CREATE TABLE IF NOT EXISTS public.prompts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  prompt_text text NOT NULL,
  category text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT prompts_pkey PRIMARY KEY (id)
);

-- =============================================
-- Row Level Security (RLS) Setup
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public."writingprompts-pairwise-test" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rationales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_model_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_writing_rationales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speed_mode_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymous_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_experience_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User feedback policies
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.user_feedback;

CREATE POLICY "Users can view their own feedback" ON public.user_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own feedback" ON public.user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Prompts policies (publicly readable)
DROP POLICY IF EXISTS "Prompts are viewable by everyone" ON public."writingprompts-pairwise-test";
DROP POLICY IF EXISTS "Additional prompts are viewable by everyone" ON public.prompts;

CREATE POLICY "Prompts are viewable by everyone" ON public."writingprompts-pairwise-test" FOR SELECT USING (true);
CREATE POLICY "Additional prompts are viewable by everyone" ON public.prompts FOR SELECT USING (true);

-- Rationales policies
DROP POLICY IF EXISTS "Rationales are viewable by everyone" ON public.rationales;
DROP POLICY IF EXISTS "Authenticated users can insert rationales" ON public.rationales;

CREATE POLICY "Rationales are viewable by everyone" ON public.rationales FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert rationales" ON public.rationales FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Human model evaluation policies
DROP POLICY IF EXISTS "Users can insert human_model_evaluations" ON public.human_model_evaluations;
DROP POLICY IF EXISTS "Users can view human_model_evaluations" ON public.human_model_evaluations;

CREATE POLICY "Users can insert human_model_evaluations" ON public.human_model_evaluations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can view human_model_evaluations" ON public.human_model_evaluations FOR SELECT USING (true);

-- Model evaluation policies
DROP POLICY IF EXISTS "Users can insert model_evaluations" ON public.model_evaluations;
DROP POLICY IF EXISTS "Users can view model_evaluations" ON public.model_evaluations;

CREATE POLICY "Users can insert model_evaluations" ON public.model_evaluations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can view model_evaluations" ON public.model_evaluations FOR SELECT USING (true);

-- Model comparison policies
DROP POLICY IF EXISTS "Users can insert model_comparisons" ON public.model_comparisons;
DROP POLICY IF EXISTS "Users can view model_comparisons" ON public.model_comparisons;

CREATE POLICY "Users can insert model_comparisons" ON public.model_comparisons FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can view model_comparisons" ON public.model_comparisons FOR SELECT USING (true);

-- Model writing rationales policies
DROP POLICY IF EXISTS "Users can insert model_writing_rationales" ON public.model_writing_rationales;
DROP POLICY IF EXISTS "Users can view model_writing_rationales" ON public.model_writing_rationales;

CREATE POLICY "Users can insert model_writing_rationales" ON public.model_writing_rationales FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can view model_writing_rationales" ON public.model_writing_rationales FOR SELECT USING (true);

-- Speed mode scores policies
DROP POLICY IF EXISTS "Users can insert speed_mode_scores" ON public.speed_mode_scores;
DROP POLICY IF EXISTS "Speed mode scores are viewable by everyone" ON public.speed_mode_scores;

CREATE POLICY "Users can insert speed_mode_scores" ON public.speed_mode_scores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Speed mode scores are viewable by everyone" ON public.speed_mode_scores FOR SELECT USING (true);

-- Live generations policies
DROP POLICY IF EXISTS "Users can insert live_generations" ON public.live_generations;
DROP POLICY IF EXISTS "Live generations are viewable by everyone" ON public.live_generations;

CREATE POLICY "Users can insert live_generations" ON public.live_generations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Live generations are viewable by everyone" ON public.live_generations FOR SELECT USING (true);

-- Anonymous sessions policies
DROP POLICY IF EXISTS "Anonymous sessions are managed by the system" ON public.anonymous_sessions;
CREATE POLICY "Anonymous sessions are managed by the system" ON public.anonymous_sessions FOR ALL USING (true);

-- Content reports policies
DROP POLICY IF EXISTS "Users can insert their own content_reports" ON public.content_reports;
DROP POLICY IF EXISTS "Users can view their own content_reports" ON public.content_reports;

CREATE POLICY "Users can insert their own content_reports" ON public.content_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own content_reports" ON public.content_reports FOR SELECT USING (auth.uid() = user_id);

-- User activity log policies
DROP POLICY IF EXISTS "System can manage user_activity_log" ON public.user_activity_log;
CREATE POLICY "System can manage user_activity_log" ON public.user_activity_log FOR ALL USING (true);

-- Evaluation quality metrics policies
DROP POLICY IF EXISTS "Users can insert evaluation_quality_metrics" ON public.evaluation_quality_metrics;
CREATE POLICY "Users can insert evaluation_quality_metrics" ON public.evaluation_quality_metrics FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Dataset downloads policies
DROP POLICY IF EXISTS "Dataset downloads are viewable by everyone" ON public.dataset_downloads;
DROP POLICY IF EXISTS "Users can insert their own dataset downloads" ON public.dataset_downloads;

CREATE POLICY "Dataset downloads are viewable by everyone" ON public.dataset_downloads FOR SELECT USING (true);
CREATE POLICY "Users can insert their own dataset downloads" ON public.dataset_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User experience feedback policies
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.user_experience_feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.user_experience_feedback;

CREATE POLICY "Users can insert their own feedback" ON public.user_experience_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own feedback" ON public.user_experience_feedback FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- Functions and Triggers
-- =============================================

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    score,
    viewed_prompts,
    demographics_completed
  )
  VALUES (new.id, new.email, 0, '{}', FALSE);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Indexes for Performance
-- =============================================

-- Create indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_prompt_id ON public.user_feedback(prompt_id);
CREATE INDEX IF NOT EXISTS idx_rationales_prompt_id ON public.rationales(prompt_id);
CREATE INDEX IF NOT EXISTS idx_human_model_evaluations_user_id ON public.human_model_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_human_model_evaluations_model_name ON public.human_model_evaluations(model_name);
CREATE INDEX IF NOT EXISTS idx_model_evaluations_user_id ON public.model_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_model_evaluations_model_name ON public.model_evaluations(model_name);
CREATE INDEX IF NOT EXISTS idx_model_comparisons_user_id ON public.model_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_speed_mode_scores_user_id ON public.speed_mode_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_live_generations_prompt_id ON public.live_generations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_session_id ON public.anonymous_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_id ON public.content_reports(content_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- =============================================
-- Additional RLS Policies for Anonymous Access to Leaderboards
-- =============================================

-- These policies ensure that anonymous users can read leaderboard data
-- even when not authenticated with Supabase

-- Speed mode scores - allow public read access for leaderboards
DROP POLICY IF EXISTS "Public read access for speed_mode_scores" ON public.speed_mode_scores;
CREATE POLICY "Public read access for speed_mode_scores" ON public.speed_mode_scores 
  FOR SELECT USING (true);

-- Model comparisons - allow public read access for leaderboards  
DROP POLICY IF EXISTS "Public read access for model_comparisons" ON public.model_comparisons;
CREATE POLICY "Public read access for model_comparisons" ON public.model_comparisons 
  FOR SELECT USING (true);

-- Model evaluations - allow public read access for leaderboards
DROP POLICY IF EXISTS "Public read access for model_evaluations" ON public.model_evaluations;
CREATE POLICY "Public read access for model_evaluations" ON public.model_evaluations 
  FOR SELECT USING (true);

-- Human model evaluations - allow public read access for leaderboards
DROP POLICY IF EXISTS "Public read access for human_model_evaluations" ON public.human_model_evaluations;
CREATE POLICY "Public read access for human_model_evaluations" ON public.human_model_evaluations 
  FOR SELECT USING (true);

-- Evaluation quality metrics - allow public read access
DROP POLICY IF EXISTS "Public read access for evaluation_quality_metrics" ON public.evaluation_quality_metrics;
CREATE POLICY "Public read access for evaluation_quality_metrics" ON public.evaluation_quality_metrics 
  FOR SELECT USING (true);

