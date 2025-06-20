# Creative Writing Evaluation Arena - Developer Guide

## Project Overview
This is a Next.js 15 application with React 19, TypeScript, and Supabase backend for creative writing evaluation and human vs AI detection research.

## IMPORTANT: Environment Setup for Codex
**Before running any commands, always run the setup script first:**
```bash
./setup.sh
```

This script is CRITICAL and must run successfully before attempting any other commands. It:
- Installs all Node.js dependencies via pnpm
- Configures proxy settings for the container environment
- Verifies that all required CLI tools (next, vitest, etc.) are available
- Installs Python dependencies

## Development Environment Setup

### Dependencies
- Node.js 20+ with pnpm package manager
- All dependencies are listed in `package.json`

### Installation & Setup
The setup script handles all environment configuration:
```bash
chmod +x setup.sh && ./setup.sh
```

The setup script handles:
- pnpm installation and configuration
- Proxy settings for corporate environments
- Clean dependency installation with lockfile regeneration
- Command verification
- Python package installation from `requirements.txt`

### Testing & Validation
**ALWAYS run these commands to validate the environment after setup:**
```bash
pnpm lint       # ESLint checks (requires next CLI)
pnpm typecheck  # TypeScript validation (requires tsc)
pnpm test       # Run test suite (requires vitest)
pnpm dev        # Start development server (requires next CLI)
```

**If any of these commands fail with "command not found", re-run the setup script.**

### Project Structure
- `src/app/` - Next.js 15 app router pages and API routes
- `src/components/` - React components with TypeScript
- `src/lib/` - Utility functions, database clients, AI services
- `src/contexts/` - React context providers
- `public/` - Static assets

### Key Technologies
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **UI Components**: Radix UI primitives

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- `OPENAI_API_KEY`

### Code Quality Standards
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Add tests for new features
- Ensure responsive design with Tailwind CSS
- Use Supabase RLS policies for data security

### Common Commands (After Setup)
- `pnpm dev` - Start development server on localhost:3000
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript checks
- `pnpm test` - Run tests with Vitest

### Troubleshooting
1. **"next: not found" or "vitest: not found"**: Run `./setup.sh` first
2. **Dependencies fail to install**: The setup script will regenerate lockfiles automatically
3. **Proxy issues**: The setup script configures proxy settings for container environments
4. **Permission issues**: Run `chmod +x setup.sh` if needed

### Verification Script
After setup, verify the environment:
```bash
# Check if key commands are available
which next || echo "❌ next not found - run setup.sh"
which vitest || echo "❌ vitest not found - run setup.sh"
pnpm list --depth=0 | grep "next\|vitest\|typescript" || echo "❌ Dependencies missing - run setup.sh"
``` 