#!/bin/bash

# Schema migration script for Supabase database
echo "🗃️  Running schema migrations..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please ensure it contains your DATABASE_URL"
    exit 1
fi

# Source environment variables
source .env.local

# Extract database URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env.local"
    echo "Please add your Supabase database URL to .env.local as DATABASE_URL"
    echo "Format: postgresql://postgres:[password]@[host]:5432/postgres"
    exit 1
fi

echo "📊 Connecting to database..."

# Run cleanup script first
echo "🧹 Running cleanup script..."
if psql "$DATABASE_URL" -f migrations/cleanup_schema.sql; then
    echo "✅ Cleanup completed successfully!"
else
    echo "❌ Cleanup failed. Please check the errors above."
    exit 1
fi

# Run improvements script
echo "🚀 Running schema improvements..."
if psql "$DATABASE_URL" -f migrations/schema_improvements.sql; then
    echo "✅ Schema improvements completed successfully!"
else
    echo "❌ Schema improvements failed. Please check the errors above."
    exit 1
fi

echo ""
echo "🎉 All schema migrations completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Verify the changes in your Supabase dashboard"
echo "2. Test the application to ensure everything works"
echo "3. The new tables will help with user analytics and session tracking" 