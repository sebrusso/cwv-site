#!/bin/bash

# Codex Setup Script
# This script runs during Codex environment initialization to install dependencies

set -e  # Exit on any error

echo "=== Codex Environment Setup ==="
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version || echo 'pnpm not found')"

# Ensure pnpm is available (Codex universal image should have it)
if ! command -v pnpm &> /dev/null; then
    echo "Installing pnpm..."
    corepack enable
    corepack prepare pnpm@latest --activate
fi

# Configure proxy settings (Codex sets these automatically)
echo "Proxy configuration:"
echo "http_proxy: ${http_proxy:-not set}"
echo "https_proxy: ${https_proxy:-not set}"

# Clean install dependencies
echo "Installing dependencies..."
rm -rf node_modules

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

# Verify installation
if [ ! -f "node_modules/.bin/next" ]; then
    echo "❌ Next.js not found after installation"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Verify commands work
echo "Verifying commands..."
pnpm lint --help > /dev/null 2>&1 && echo "✅ pnpm lint available" || echo "❌ pnpm lint failed"
pnpm typecheck --help > /dev/null 2>&1 && echo "✅ pnpm typecheck available" || echo "❌ pnpm typecheck failed"

echo "✅ Setup complete - ready for Codex agent" 