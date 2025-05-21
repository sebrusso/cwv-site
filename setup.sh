#!/bin/bash

echo "Codex Environment Variables Check:"
echo "http_proxy: $http_proxy"
echo "https_proxy: $https_proxy"
echo "CODEX_PROXY_CERT: $CODEX_PROXY_CERT"
echo "NODE_EXTRA_CA_CERTS: $NODE_EXTRA_CA_CERTS" # This should be set by Codex

echo "Attempting to configure pnpm proxy settings..."
if [ -n "$http_proxy" ]; then
  pnpm config set proxy "$http_proxy"
  echo "pnpm proxy set to $http_proxy"
else
  echo "http_proxy environment variable not set."
fi

if [ -n "$https_proxy" ]; then
  pnpm config set https-proxy "$https_proxy"
  echo "pnpm https-proxy set to $https_proxy"
else
  echo "https_proxy environment variable not set."
fi

# pnpm should respect NODE_EXTRA_CA_CERTS for CA certificates if set by Codex.
# If $CODEX_PROXY_CERT is available and NODE_EXTRA_CA_CERTS isn't working as expected,
# you could try uncommenting the following to set cafile directly:
# if [ -n "$CODEX_PROXY_CERT" ]; then
#   pnpm config set cafile "$CODEX_PROXY_CERT"
#   echo "pnpm cafile set to $CODEX_PROXY_CERT"
# else
#   echo "CODEX_PROXY_CERT is not set or empty, pnpm cafile not configured."
# fi
pnpm config set strict-ssl true # Default, but good to ensure

echo "Listing current pnpm configuration:"
pnpm config list

# echo "Testing network connectivity to npm registry via curl..."
# # Using -I to get headers, -s for silent, -S to show error, -v for verbose
# curl -vIs https://registry.npmjs.org

# Ensure pnpm is available (the universal image might have it, but this is safer)
# Consider uncommenting if pnpm version is an issue or if it's not found
# corepack enable
# corepack prepare pnpm@latest --activate

echo "Installing dependencies with pnpm (debug loglevel)..."
# pnpm install --frozen-lockfile --loglevel debug # Old command

# Detect missing lockfile and fall back gracefully
if [ ! -f pnpm-lock.yaml ]; then
  echo "⚠️  pnpm-lock.yaml missing – generating a fresh lockfile"
  pnpm install --no-frozen-lockfile --loglevel debug
else
  pnpm install --frozen-lockfile --loglevel debug
fi

echo "Running linters and type checkers..."
pnpm lint
pnpm typecheck

echo "Checking for remote Google font imports..."
grep -R --include=\'*.{ts,tsx}\' "from \'next/font/google\'" src && \
  (echo "❌ ERROR: Do not import fonts directly from 'next/font/google'. Use local fonts from '@/lib/fonts'." && exit 1) || \
  echo "✅ No remote Google font imports found."

echo "Setup complete." 