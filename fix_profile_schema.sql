-- Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS first_language TEXT,
ADD COLUMN IF NOT EXISTS literature_interest TEXT,
ADD COLUMN IF NOT EXISTS writing_background TEXT,
ADD COLUMN IF NOT EXISTS demographics_completed BOOLEAN DEFAULT FALSE; 