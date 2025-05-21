# Contributor Guide for cwv-interactive

This document provides guidance for the Codex agent on how to work within the `cwv-interactive` repository.

## Project Overview
`cwv-interactive` is a Next.js project using TypeScript. Key directories include:
- `src/app/`: Contains the main application pages and routes.
- `src/components/`: Contains reusable UI components.
- `src/lib/`: Contains utility functions and Supabase client setup.
- `src/contexts/`: Contains React context providers.

## Development Environment Tips
- This project uses `pnpm` for package management.
- To install dependencies locally: `pnpm install`
- To run the development server locally: `pnpm dev`
- ESLint is configured via `eslint.config.mjs`. Run `pnpm lint` to check for linting issues.
- TypeScript is used. Run `pnpm typecheck` (script available in `package.json`) for type checking.

## Testing Instructions
- **Linting:** Run `pnpm lint` to ensure code style and quality.
- **Type Checking:** Run `pnpm typecheck` (script in `package.json` pointing to `tsc --noEmit`) to ensure TypeScript rules pass.
- (Add instructions for running unit, integration, or end-to-end tests once they are set up. For example, if using Vitest: `pnpm test` or `pnpm vitest run -t "<test_name_pattern>"`).
- All tests and checks must pass before the agent considers its work complete.
- The agent should add or update tests for any code it changes.

## PR Instructions
- Title format: `[area_of_change] <Descriptive Title>` (e.g., `[auth] Fix login redirect issue`)
- Ensure PR descriptions are clear and summarize the changes. 