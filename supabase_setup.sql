-- Create "writingprompts-pairwise-test" table
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

-- Enable Row Level Security (RLS) on "writingprompts-pairwise-test"
ALTER TABLE "writingprompts-pairwise-test" ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  score INTEGER DEFAULT 0,
  viewed_prompts UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  prompt_id UUID REFERENCES "writingprompts-pairwise-test"(id) NOT NULL,
  selected_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on user_feedback
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Create rationales table
CREATE TABLE IF NOT EXISTS rationales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES "writingprompts-pairwise-test"(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  rationale TEXT NOT NULL,
  highlight_text TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on rationales
ALTER TABLE rationales ENABLE ROW LEVEL SECURITY;

-- Create human_model_evaluations table
CREATE TABLE IF NOT EXISTS human_model_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  prompt_id UUID REFERENCES "writingprompts-pairwise-test"(id) NOT NULL,
  model_name TEXT NOT NULL,
  guess_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on human_model_evaluations
ALTER TABLE human_model_evaluations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- User feedback policies
CREATE POLICY "Users can view their own feedback"
  ON user_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Prompts policies
CREATE POLICY "Prompts are viewable by everyone"
  ON "writingprompts-pairwise-test" FOR SELECT
  USING (true);

-- Rationales policies
CREATE POLICY "Rationales are viewable by everyone"
  ON rationales FOR SELECT
  USING (true);
CREATE POLICY "Users can insert their own rationales"
  ON rationales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Human model evaluation policies
CREATE POLICY "Users can insert their own human_model_evaluations"
  ON human_model_evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own human_model_evaluations"
  ON human_model_evaluations FOR SELECT
  USING (auth.uid() = user_id);

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, score, viewed_prompts)
  VALUES (new.id, new.email, 0, '{}');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 