# Creative Writing Evaluation Arena - Developer Guide

## Project Overview
This is a Next.js 15 application with React 19, TypeScript, and Supabase backend for creative writing evaluation and human vs AI detection research.

## Development Environment Setup

### Dependencies
- Node.js 20+ with pnpm package manager
- All dependencies are listed in `package.json`

### Installation & Setup
Run the setup script to install dependencies and configure the environment:
```bash
chmod +x setup.sh && ./setup.sh
```

The setup script handles:
- pnpm installation and configuration
- Proxy settings for corporate environments  
- Clean dependency installation with lockfile regeneration
- Command verification

### Testing & Validation
Always run these commands before submitting changes:
```bash
pnpm lint       # ESLint checks
pnpm typecheck  # TypeScript validation  
pnpm test       # Run test suite
pnpm dev        # Start development server
```

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

### Common Commands
- `pnpm dev` - Start development server on localhost:3000
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Troubleshooting
- If dependencies fail to install, the setup script will regenerate lockfiles
- Check `CODEX_SETUP.md` for detailed troubleshooting
- Verify environment with `./verify-environment.sh` 