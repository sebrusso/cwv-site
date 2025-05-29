#!/bin/bash

echo "🔍 Verifying Codex Environment..."

# Check basic tools
echo "Node version: $(node --version)"
echo "pnpm version: $(pnpm --version)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Run ./setup.sh first."
    exit 1
fi

# Check if Next.js is available
if [ ! -f "node_modules/.bin/next" ]; then
    echo "❌ Next.js not found in node_modules"
    exit 1
fi

# Test all commands
echo "Testing pnpm commands..."

if pnpm lint --help > /dev/null 2>&1; then
    echo "✅ pnpm lint - OK"
else
    echo "❌ pnpm lint - FAILED"
    exit 1
fi

if pnpm typecheck --help > /dev/null 2>&1; then
    echo "✅ pnpm typecheck - OK"
else
    echo "❌ pnpm typecheck - FAILED"
    exit 1
fi

if pnpm test --help > /dev/null 2>&1; then
    echo "✅ pnpm test - OK"
else
    echo "❌ pnpm test - FAILED"
    exit 1
fi

if pnpm dev --help > /dev/null 2>&1; then
    echo "✅ pnpm dev - OK"
else
    echo "❌ pnpm dev - FAILED"
    exit 1
fi

echo "✅ Environment verification complete. All checks passed!"
echo "🚀 Ready for development!" 