#!/bin/bash

# Schema verification script for Supabase database
# This script runs the schema verification SQL file

echo "🔍 Running schema verification for onboarding flow..."

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please ensure it contains your Supabase database connection details."
    exit 1
fi

# Source environment variables
source .env.local

# Extract database URL components (assumes format: postgresql://user:pass@host:port/db)
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env.local"
    echo "Please add your Supabase database URL to .env.local as DATABASE_URL"
    exit 1
fi

echo "📊 Connecting to database..."

# Run the schema verification
if psql "$DATABASE_URL" -f verify_schema.sql; then
    echo "✅ Schema verification completed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Test the onboarding flow by signing up as a new user"
    echo "2. Check the browser console for debug logs"
    echo "3. Use the debug panel (visible in development mode) to monitor state"
    echo "4. If issues persist, check Supabase logs for any database errors"
else
    echo "❌ Schema verification failed. Please check the errors above and try again."
    exit 1
fi 