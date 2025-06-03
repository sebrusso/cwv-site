-- Schema improvements for better user tracking and analytics

-- Add session tracking for anonymous users (before signup)
CREATE TABLE IF NOT EXISTS anonymous_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  evaluations_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  converted_to_user_id UUID REFERENCES auth.users(id) -- Track conversion to full account
);

-- Add user activity tracking for engagement analytics
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  activity_type TEXT NOT NULL, -- 'evaluation', 'login', 'signup', 'dashboard_view', etc.
  activity_data JSONB, -- Additional context data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add feedback/rating table for overall user experience
CREATE TABLE IF NOT EXISTS user_experience_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  category TEXT, -- 'ui', 'performance', 'features', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experience_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for new tables
CREATE POLICY "Users can view their own activity log"
  ON user_activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
  ON user_activity_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON user_experience_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON user_experience_feedback FOR SELECT
  USING (auth.uid() = user_id); 