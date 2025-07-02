#!/bin/bash

# Cursor Background Agent Setup Script
# This script runs during Cursor background agent environment initialization to install dependencies

set -e  # Exit on any error

echo "=== Cursor Background Agent Environment Setup ==="
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version || echo 'pnpm not found')"
echo "Python version: $(python3 --version)"
echo "pip version: $(pip --version)"

# Ensure pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    corepack enable
    corepack prepare pnpm@latest --activate
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."

# Clean install for fresh environment or if lockfile is missing
if [ ! -f pnpm-lock.yaml ]; then
  echo "⚠️  pnpm-lock.yaml missing – generating fresh lockfile"
  pnpm install --no-frozen-lockfile
else
  echo "Installing with lockfile..."
  if ! pnpm install --frozen-lockfile; then
    echo "⚠️  Lockfile outdated, regenerating..."
    rm -f pnpm-lock.yaml
    pnpm install --no-frozen-lockfile
  fi
fi

# Install Python packages required for auxiliary scripts
echo "Installing Python dependencies..."
if [ -f requirements.txt ]; then
  pip install --no-cache-dir -r requirements.txt
else
  # Install essential packages for the project's data handling scripts
  pip install --no-cache-dir pandas datasets pyarrow supabase python-dotenv
fi

# Verify critical installations
echo "Verifying installations..."
if [ ! -f "node_modules/.bin/next" ]; then
    echo "❌ Next.js not found after installation"
    exit 1
fi

# Verify build and lint commands are available
echo "Verifying project commands..."
if pnpm lint --help > /dev/null 2>&1; then
    echo "✅ pnpm lint available"
else
    echo "⚠️  pnpm lint command may not be configured"
fi

if pnpm typecheck --help > /dev/null 2>&1; then
    echo "✅ pnpm typecheck available" 
else
    echo "⚠️  pnpm typecheck command may not be configured"
fi

if pnpm build --help > /dev/null 2>&1; then
    echo "✅ pnpm build available"
else
    echo "⚠️  pnpm build command may not be configured"
fi

echo "✅ Setup complete - Cursor background agent environment ready"
echo "Next.js dev server will be available via the configured terminal" 