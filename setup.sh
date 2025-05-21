#!/bin/bash
# Ensure pnpm is available (the universal image might have it, but this is safer)
# corepack enable
# corepack prepare pnpm@latest --activate # Or your specific pnpm version

echo "Installing dependencies..."
pnpm install --frozen-lockfile # Use --frozen-lockfile for CI/automation

echo "Setup complete." 