-- Migration: add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_prompt_id ON user_feedback(prompt_id);
CREATE INDEX IF NOT EXISTS idx_rationales_prompt_id ON rationales(prompt_id);
CREATE INDEX IF NOT EXISTS idx_rationales_user_id ON rationales(user_id);
CREATE INDEX IF NOT EXISTS idx_hme_user_id ON human_model_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_hme_prompt_id ON human_model_evaluations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_model_eval_user_id ON model_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_model_eval_prompt_id ON model_evaluations(prompt_id);
CREATE INDEX IF NOT EXISTS idx_model_eval_model_name ON model_evaluations(model_name);
CREATE INDEX IF NOT EXISTS idx_model_writing_rat_user_id ON model_writing_rationales(user_id);
CREATE INDEX IF NOT EXISTS idx_model_writing_rat_prompt_id ON model_writing_rationales(prompt_id);
CREATE INDEX IF NOT EXISTS idx_dataset_downloads_user_id ON dataset_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_writingprompts_created_at ON "writingprompts-pairwise-test"(created_at);
