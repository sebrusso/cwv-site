# Project Directory Structure

This document outlines the organized directory structure of the CWV Interactive project.

## Root Directory

The root directory has been cleaned up to contain only essential project files:

- Configuration files: `package.json`, `tsconfig.json`, `next.config.ts`, etc.
- Documentation: `README.md`, `DOCUMENTATION.md`
- Environment files: `.env.example`, `.env.local`
- Main source code: `src/`, `public/`
- Build artifacts: `.next/`, `node_modules/`

## Organized Directories

### `/scripts/`
Contains all executable scripts for setup, maintenance, and data processing:
- `setup.sh` - Project setup script
- `verify-environment.sh` - Environment verification
- `run_schema_verification.sh` - Database schema verification
- `download_hf_dataset.py` - HuggingFace dataset download utility
- `load_dataset_to_supabase.py` - Data loading script

### `/docs/`
Contains project documentation and planning materials:
- `AGENTS.md` - AI agent documentation
- `cwv-interactive-features-roadmap.md` - Feature roadmap
- `feature-plan.md` - Detailed feature planning
- `DIRECTORY_STRUCTURE.md` - This file

### `/migrations/`
Contains all database migration and setup files:
- `supabase_setup.sql` - Initial database setup
- `verify_schema.sql` - Schema verification script
- `20240606_add_indexes.sql` - Historical migration
- `20240607_update_model_writing_rationales.sql` - Historical migration

### `/data/`
Contains large data files and datasets:
- `LitBench_Test.csv` - Test dataset (16MB)
- `writingprompts_pairwise_test.csv` - Pairwise comparison data (5.5MB)

### `/config/`
Contains configuration files:
- `system-instructions.json` - AI model system instructions

## Benefits of This Organization

1. **Cleaner Root Directory**: Reduced from 47 files to ~23 files in root
2. **Logical Grouping**: Related files are organized together
3. **Better Navigation**: Easier to find specific types of files
4. **Scalability**: Clear places to add new files of each type
5. **Maintainability**: Easier to manage and understand the project structure

## Files Removed

The following temporary/unnecessary files were removed during cleanup:
- `CONFIRMATION_FIX_SUMMARY.md` - Temporary fix documentation
- `ONBOARDING_FIX_README.md` - Temporary fix documentation  
- `fix_profile_policy.sql` - Ad-hoc SQL fix
- `fix_profile_schema.sql` - Ad-hoc SQL fix 