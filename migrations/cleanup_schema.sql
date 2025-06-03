-- Database cleanup script - Remove redundant/unused tables
-- Run this after backing up your database

-- Remove test/placeholder table
DROP TABLE IF EXISTS public.hf_data_visualization CASCADE;

-- Optionally remove writingprompts_generations if not being used
-- This table appears to be for pre-existing RM choice data but no API endpoints reference it
-- Uncomment the line below if you're certain it's not needed:
-- DROP TABLE IF EXISTS public.writingprompts_generations CASCADE;

-- Note: The 'prompts' table mentioned in your schema doesn't exist in the current codebase
-- and appears to be redundant with 'writingprompts-pairwise-test' which serves the same purpose 