# Creative Writing Evaluation Arena (CWV Interactive)

A sophisticated web application designed to capture and analyze human preferences regarding both human and machine-generated creative writing. This research platform helps understand how humans evaluate writing quality and their ability to distinguish between human and AI-generated content.

## Overview

The Creative Writing Evaluation Arena serves multiple research purposes:
- **Human Preference Collection**: Gather data on human preferences when comparing creative writing
- **Human vs AI Detection Research**: Study how well humans can distinguish between human-written and AI-generated content
- **Writing Quality Assessment**: Collect feedback on what makes writing "good" according to human evaluators
- **Model Comparison**: Compare different AI models against each other and against human writing
- **Research Data Generation**: Create datasets for academic research on writing quality and preference learning

## Core Features

### 🏟️ Human vs Human Writing Evaluation (Main Arena)
Side-by-side comparison of human-written texts with real-time feedback and scoring system.

### 🤖 Human vs AI Detection Interface
Interactive challenge where users try to identify which text was written by a human vs various AI models.

### ⚔️ Model vs Model Evaluation
Blind comparison of AI-generated text from different models with live generation and quality-based ranking.

### 🏆 Leaderboard System
- **Human Deception Leaderboard**: Models ranked by ability to fool humans
- **Model Quality Leaderboard**: Models ranked by head-to-head win rates

### 📊 User Dashboard
Personal analytics with evaluation statistics, accuracy trends, and community ranking.

## Technology Stack

- **Frontend**: Next.js 15 with React 19, TypeScript
- **Backend**: Next.js API routes with server-side rendering
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email/password and magic link support
- **UI Framework**: Tailwind CSS with Radix UI components

## Getting Started

### Prerequisites
- Node.js 18+ with pnpm package manager
- Supabase account and project
- OpenAI API key for text generation

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Fill in your Supabase and OpenAI credentials
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Codex Setup

For developers using [OpenAI Codex](https://platform.openai.com/docs/codex), the environment is configured automatically:

**What Codex needs:**
- `setup.sh` - Installs dependencies during environment initialization
- `AGENTS.md` - Provides context about the repository and development workflow

**Codex automatically handles:**
- Running the setup script during environment initialization  
- Installing dependencies with proper proxy configuration
- Setting up Node.js 20 environment with pnpm

**If manual setup is needed:**
```bash
chmod +x setup.sh && ./setup.sh
```

The setup script handles dependency installation, lockfile regeneration, and environment verification.

### Supabase Setup

1. Enable the **Email** provider in your Supabase project
2. Run the provided SQL setup scripts to create the necessary database schema
3. Configure Row Level Security (RLS) policies

## Development Workflow

```bash
pnpm lint       # Check for linting issues
pnpm typecheck  # Run TypeScript type checking
pnpm test       # Run the test suite
pnpm dev        # Start development server
```

## Research Applications

This platform generates valuable datasets for:
- Understanding human preference in creative writing
- Measuring AI writing quality and human detection capabilities
- Training preference learning models
- Advancing creative AI research
- Developing better writing evaluation metrics

## Database Performance

- Optimized indexes on frequently queried columns for faster lookups
- Leaderboard API caching with pagination support
- Shared Supabase client instances to reduce connection overhead

## Security & Privacy

- Row Level Security (RLS) on all database tables
- User authentication required for data submission
- Content moderation and reporting system
- Secure API key management
- Optional demographic data collection with user consent

## Contributing

The application serves as both a research tool and a platform for engaging the public in AI safety and quality research through gamified evaluation tasks. Contributions are welcome!

## Deploy on Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI Codex Documentation](https://platform.openai.com/docs/codex)
- [Complete Project Documentation](DOCUMENTATION.md)
