# Creative Writing Evaluation Arena - Complete Documentation

## Overview

The Creative Writing Evaluation Arena (CWV Interactive) is a sophisticated web application designed to capture and analyze human preferences regarding both human and machine-generated creative writing in an interactive setting. The application serves as a research platform for understanding how humans evaluate writing quality and their ability to distinguish between human and AI-generated content.

## Primary Goals

1. **Human Preference Collection**: Gather data on human preferences when comparing different pieces of creative writing
2. **Human vs AI Detection Research**: Study how well humans can distinguish between human-written and AI-generated content
3. **Writing Quality Assessment**: Collect feedback on what makes writing "good" according to human evaluators
4. **Model Comparison**: Compare different AI models against each other and against human writing
5. **Research Data Generation**: Create datasets for academic research on writing quality and human preference learning

## Application Architecture

### Technology Stack

- **Frontend**: Next.js 15 with React 19, TypeScript
- **Backend**: Next.js API routes with server-side rendering
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email/password and magic link support
- **UI Framework**: Tailwind CSS with Radix UI components
- **State Management**: React Context (UserContext, ToastContext)

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   ├── auth/              # Authentication pages (login, signup, callback)
│   ├── dashboard/         # User dashboard and analytics
│   ├── human-machine/     # Human vs AI detection interface
│   ├── leaderboard/       # Model rankings and statistics
│   ├── model-evaluation/  # Model vs model comparison
│   ├── onboarding/        # User onboarding flow
│   └── resources/         # Help and documentation pages
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI primitives (buttons, cards, etc.)
│   └── ...               # Feature-specific components
├── contexts/             # React context providers
├── lib/                  # Utility functions and configurations
│   └── supabase/         # Database client configuration
└── types/                # TypeScript type definitions
```

## Core Features

### 1. Human vs Human Writing Evaluation (Main Arena)

**Location**: Home page (`/`)
**Component**: `HumanEvaluationArena`

**Purpose**: Users compare two pieces of human-written text and select which they think is higher quality.

**Features**:
- Side-by-side text comparison interface
- Prompt-based writing evaluation
- Real-time feedback on correctness
- User scoring system
- Rationale collection (why users made their choice)
- Text highlighting for favorite passages
- Content reporting system
- Guest mode (limited features) vs authenticated mode

**Data Collected**:
- User selection (which text was chosen)
- Correctness (based on original upvote data)
- Response time
- User rationales and highlighted text
- Evaluation quality metrics

### 2. Human vs AI Detection Interface

**Location**: `/human-machine`
**Component**: `HumanMachineArena`

**Purpose**: Users try to identify which text was written by a human vs AI.

**Features**:
- Choose from multiple AI models (GPT-3.5, GPT-4, Claude, etc.)
- Live AI text generation
- Binary classification task (human or AI)
- Success tracking and statistics
- Confetti animation for correct guesses
- Model-specific performance tracking

**Data Collected**:
- Guess accuracy per user
- Model deception rates
- User confidence over time
- Model-specific human fooling rates

### 3. Model vs Model Evaluation

**Location**: `/model-evaluation`
**Component**: `ModelEvaluationArena`

**Purpose**: Users compare AI-generated text from different models.

**Features**:
- Multi-phase interface (model selection → generation → evaluation)
- Blind evaluation (model names hidden during comparison)
- Custom prompt support
- Live text generation from OpenAI API
- Quality-based model ranking
- Rationale collection for model preferences

**Data Collected**:
- Head-to-head model win/loss records
- User preferences between specific model pairs
- Reasoning behind model preferences
- Generation quality assessments

### 4. Leaderboard System

**Location**: `/leaderboard`
**Components**: Dual leaderboard with tabs

**Human Deception Leaderboard**:
- Models ranked by their ability to fool humans
- Success rate percentages
- Time-filtered statistics
- Export functionality

**Model Quality Leaderboard**:
- Models ranked by head-to-head win rates
- Win/loss records from model comparisons
- Statistical significance indicators
- Head-to-head comparison matrix

### 5. User Dashboard and Analytics

**Location**: `/dashboard`
**Component**: `UserPerformanceCharts`

**Features**:
- Personal evaluation statistics
- Accuracy trends over time
- Daily evaluation counts
- Community ranking
- Performance visualizations
- Achievement tracking

### 6. Authentication System

**Locations**: `/auth/login`, `/auth/signup`, `/auth/callback`

**Features**:
- Email/password authentication
- Magic link authentication
- User profile management
- Demographics questionnaire
- Score and progress tracking
- Viewed prompts tracking

### 7. Content Management

**Features**:
- Content reporting system for inappropriate content
- Admin tools for content moderation
- Flagged content filtering
- User-generated content policies

## Database Schema

### Core Tables

1. **`writingprompts-pairwise-test`**: Original writing prompts and human responses
   - Stores prompts with chosen/rejected text pairs
   - Includes upvote counts and timestamps
   - Primary source of evaluation data

2. **`profiles`**: User profile information
   - Links to Supabase auth users
   - Stores scores, viewed prompts, demographics
   - Tracks user progression and preferences

3. **`user_feedback`**: Human vs human evaluation results
   - Records user choices and correctness
   - Links evaluations to specific prompts and users

4. **`human_model_evaluations`**: Human vs AI detection results
   - Tracks guess accuracy for different models
   - Used for human deception leaderboard

5. **`model_evaluations`**: Individual model assessment data
   - Quality scores for AI-generated content

6. **`model_comparisons`**: Head-to-head model battle results
   - Win/loss records between specific model pairs
   - Powers the model quality leaderboard

7. **`live_generations`**: Real-time AI text generation cache
   - Stores generated text from API calls
   - Improves performance by avoiding regeneration

8. **`rationales`**: User explanations for their choices
   - Qualitative data on decision-making
   - Includes highlighted text passages

9. **`content_reports`**: User-flagged inappropriate content
   - Community moderation system
   - Admin resolution tracking

### Supporting Tables

- **`evaluation_quality_metrics`**: Response time and confidence tracking
- **`dataset_downloads`**: Research data access logging
- **`model_writing_rationales`**: Model-specific reasoning collection

## API Endpoints

### Generation APIs
- `/api/generate-live-comparison`: Creates live model vs model comparisons
- `/api/generate-openai`: Handles AI text generation requests

### Data Collection APIs
- `/api/human-model-evaluations`: Records human vs AI detection attempts
- `/api/evaluation-quality`: Logs evaluation timing and quality metrics
- `/api/content-report`: Handles content flagging

### Leaderboard APIs
- `/api/human-deception-leaderboard`: Human deception statistics
- `/api/model-quality-leaderboard`: Model vs model rankings
- `/api/model-leaderboard`: Combined model performance data

### User Management APIs
- `/api/user-dashboard`: Personal statistics and analytics
- `/api/download-dataset`: Research data export

## User Experience Flow

### New User Journey
1. **Landing Page**: Immediate access to basic evaluation in guest mode
2. **Authentication Prompt**: Encouraged to sign up for full features
3. **Onboarding**: Demographics questionnaire (optional)
4. **Evaluation**: Start with human vs human comparisons
5. **Progression**: Unlock additional modes and features
6. **Dashboard**: Track personal performance and community ranking

### Evaluation Process
1. **Prompt Presentation**: User sees a writing prompt
2. **Text Comparison**: Two texts displayed side-by-side
3. **Selection**: User chooses preferred text
4. **Confirmation**: Double-check selection before submitting
5. **Feedback**: Immediate results with explanation
6. **Rationale**: Optional explanation of choice
7. **Next Prompt**: Continue to next evaluation

## Research Applications

### Academic Research
- Writing quality preference studies
- Human vs AI detection capabilities
- Model comparison and ranking
- Preference learning datasets
- Creative writing evaluation metrics

### Industry Applications
- AI model benchmarking
- Content quality assessment
- Human preference modeling
- Writing assistance tool evaluation
- Creative AI development

### Data Export
- CSV export functionality for leaderboards
- Research dataset downloads for authenticated users
- Anonymized evaluation data for academic use

## Feature Configuration

The application uses a centralized configuration system (`src/config.ts`) with feature flags:

- `debugMode`: Development tools and debug panels
- `enableDashboard`: User analytics and performance tracking
- `showDashboardLink`: Navigation visibility control
- `enableLeaderboard`: Model ranking systems
- `enableResources`: Help and documentation pages
- `enableDataset`: Research data download features
- `showHelpButton`: User assistance and tutorials

## Development Workflow

### Setup Requirements
- Node.js 18+ with pnpm package manager
- Supabase account and project
- OpenAI API key for text generation
- Environment variables configuration

### Quality Assurance
- TypeScript type checking (`pnpm typecheck`)
- ESLint code quality (`pnpm lint`)
- Automated testing suite
- Manual testing protocols

### Deployment
- Vercel hosting platform
- Supabase backend services
- Environment-specific configuration
- Performance monitoring

## Current Limitations and Future Roadmap

### Known Issues
- Model evaluation performance optimization needed
- Incomplete story generation edge cases
- Mobile responsiveness improvements required

### Planned Features
- Enhanced model selection interface
- Improved mobile user experience
- Advanced analytics and visualizations
- Additional AI model integrations
- Expanded content moderation tools
- Multi-language support
- Advanced user preference modeling

## Security and Privacy

### Data Protection
- Row Level Security (RLS) on all database tables
- User authentication required for data submission
- Content moderation and reporting system
- Secure API key management

### Privacy Considerations
- Optional demographic data collection
- Anonymized research data export
- User consent for data usage
- GDPR compliance measures

## Research Impact

This platform generates valuable datasets for:
- Understanding human preference in creative writing
- Measuring AI writing quality and human detection capabilities
- Training preference learning models
- Advancing creative AI research
- Developing better writing evaluation metrics

The application serves as both a research tool and a platform for engaging the public in AI safety and quality research through gamified evaluation tasks. 