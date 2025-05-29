-- Schema verification and migration script
-- Run this to ensure all required columns and policies exist

-- Verify and add missing columns to profiles table
DO $$
BEGIN
    -- Check if age_range column exists, add if not
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'age_range') THEN
        ALTER TABLE profiles ADD COLUMN age_range TEXT;
        RAISE NOTICE 'Added age_range column to profiles table';
    END IF;

    -- Check if education_level column exists, add if not
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'education_level') THEN
        ALTER TABLE profiles ADD COLUMN education_level TEXT;
        RAISE NOTICE 'Added education_level column to profiles table';
    END IF;

    -- Check if first_language column exists, add if not
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'first_language') THEN
        ALTER TABLE profiles ADD COLUMN first_language TEXT;
        RAISE NOTICE 'Added first_language column to profiles table';
    END IF;

    -- Check if literature_interest column exists, add if not
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'literature_interest') THEN
        ALTER TABLE profiles ADD COLUMN literature_interest TEXT;
        RAISE NOTICE 'Added literature_interest column to profiles table';
    END IF;

    -- Check if writing_background column exists, add if not
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'writing_background') THEN
        ALTER TABLE profiles ADD COLUMN writing_background TEXT;
        RAISE NOTICE 'Added writing_background column to profiles table';
    END IF;

    -- Check if demographics_completed column exists, add if not
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'demographics_completed') THEN
        ALTER TABLE profiles ADD COLUMN demographics_completed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added demographics_completed column to profiles table';
    END IF;
END $$;

-- Verify RLS policies exist
DO $$
BEGIN
    -- Check if SELECT policy exists
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                   WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile"
          ON profiles FOR SELECT
          USING (auth.uid() = id);
        RAISE NOTICE 'Created SELECT policy for profiles table';
    END IF;

    -- Check if UPDATE policy exists
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                   WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile"
          ON profiles FOR UPDATE
          USING (auth.uid() = id);
        RAISE NOTICE 'Created UPDATE policy for profiles table';
    END IF;

    -- Check if INSERT policy exists
    IF NOT EXISTS (SELECT 1 FROM pg_policies 
                   WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile"
          ON profiles FOR INSERT
          WITH CHECK (auth.uid() = id);
        RAISE NOTICE 'Created INSERT policy for profiles table';
    END IF;
END $$;

-- Verify the handle_new_user function exists and is correct
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
  VALUES (
    new.id, 
    new.email, 
    0, 
    '{}', 
    FALSE
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify all existing users have profiles
INSERT INTO public.profiles (id, username, score, viewed_prompts, demographics_completed)
SELECT 
  u.id, 
  u.email, 
  0, 
  '{}', 
  FALSE
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Final verification query
SELECT 
  'Schema verification complete' as status,
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(*) - COUNT(p.id) as users_missing_profiles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id; 