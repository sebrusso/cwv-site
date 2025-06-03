-- Migration: add speed_mode_scores table for Speed Mode results
CREATE TABLE IF NOT EXISTS speed_mode_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  correct INTEGER NOT NULL,
  total INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  longest_streak INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on speed_mode_scores
ALTER TABLE speed_mode_scores ENABLE ROW LEVEL SECURITY;

-- Policies mirroring human_model_evaluations
CREATE POLICY "Users can insert their own speed_mode_scores"
  ON speed_mode_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own speed_mode_scores"
  ON speed_mode_scores FOR SELECT
  USING (auth.uid() = user_id);
