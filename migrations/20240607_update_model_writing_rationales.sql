-- Migration: add evaluation_id and rationale to model_writing_rationales
ALTER TABLE model_writing_rationales
  ADD COLUMN IF NOT EXISTS evaluation_id UUID REFERENCES model_evaluations(id);
ALTER TABLE model_writing_rationales
  ADD COLUMN IF NOT EXISTS rationale TEXT;

CREATE INDEX IF NOT EXISTS idx_model_writing_rat_eval_id ON model_writing_rationales(evaluation_id);
