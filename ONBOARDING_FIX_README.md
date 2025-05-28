# Onboarding Flow Fixes

This document outlines the comprehensive fixes applied to resolve the onboarding flow issues where users were repeatedly prompted to fill out the demographic questionnaire.

## Issues Identified

1. **Race Condition in Profile Creation**: Conflict between automatic database trigger and manual profile creation
2. **State Update Timing**: Local state updated before database confirmation
3. **Profile Refetch Logic**: Unnecessary redirects due to pathname checking
4. **Database Schema Inconsistencies**: Missing columns causing silent failures
5. **Error Handling**: Poor error reporting and recovery
6. **Upsert Logic**: Incorrect default values in upsert operations

## Fixes Applied

### 1. Improved updateProfile Function (`src/contexts/UserContext.tsx`)

**Changes:**
- Added pre-fetch of current profile to ensure data consistency
- Fixed state update timing (only after successful database operation)
- Enhanced error handling with detailed logging
- Improved upsert logic to preserve existing data

**Key improvements:**
- Fetches current profile before updating to avoid overwriting data
- Only updates local state after database confirmation
- Returns updated profile data for verification
- Better error messages with specific error codes

### 2. Enhanced fetchProfile Function (`src/contexts/UserContext.tsx`)

**Changes:**
- Added retry logic for profile creation race conditions
- Improved logging for debugging
- Simplified redirect logic to only trigger from home page
- Better handling of database trigger timing

**Key improvements:**
- Waits 1 second and retries if profile not found (accounts for trigger delay)
- Only redirects to onboarding from home page (`/`) to prevent redirect loops
- Comprehensive logging for debugging
- Fallback profile creation if trigger fails

### 3. Robust Form Submission (`src/components/UserDemographicsForm.tsx`)

**Changes:**
- Added response validation from updateProfile
- Improved error handling with specific error messages
- Added delay after submission to ensure state propagation

**Key improvements:**
- Captures and validates the updated profile response
- Shows specific error messages instead of generic ones
- Small delay before redirect to ensure state updates

### 4. Enhanced Onboarding Page (`src/app/onboarding/page.tsx`)

**Changes:**
- Better loading states and user feedback
- Improved useEffect dependencies
- Added explanatory text for users

**Key improvements:**
- Proper loading skeleton while determining user state
- More specific useEffect dependencies to prevent unnecessary re-renders
- Better user experience with explanatory text

### 5. Database Schema Verification (`verify_schema.sql`)

**Features:**
- Comprehensive schema verification and migration
- Automatic column creation if missing
- RLS policy verification and creation
- User profile backfill for existing users
- Improved trigger function with conflict handling

**Key improvements:**
- Ensures all required columns exist
- Verifies and creates missing RLS policies
- Updates trigger function to handle conflicts gracefully
- Backfills profiles for existing users who might not have them

### 6. Debug Tools

**OnboardingDebugPanel** (`src/components/OnboardingDebugPanel.tsx`):
- Real-time state monitoring in development
- Displays user, profile, and loading states
- Shows current path and redirect logic
- Full profile data inspection

**Schema Verification Script** (`run_schema_verification.sh`):
- Automated database schema verification
- Easy-to-run script for ensuring database consistency
- Clear success/failure reporting

## Usage Instructions

### 1. Run Schema Verification

First, ensure your database schema is correct:

```bash
./run_schema_verification.sh
```

This will:
- Check database connectivity
- Verify all required columns exist
- Create missing columns if needed
- Verify RLS policies
- Backfill missing user profiles

### 2. Test the Onboarding Flow

1. **New User Test:**
   - Sign up with a new email
   - Should be automatically redirected to `/onboarding`
   - Fill out the form and submit
   - Should redirect to home page
   - Subsequent visits should not show onboarding

2. **Existing User Test:**
   - Log in with existing account
   - If demographics not completed, should redirect to onboarding
   - Complete or skip onboarding
   - Should not be prompted again

### 3. Debugging

**Development Mode:**
- A debug panel will appear in the bottom-right corner
- Click "Debug" to expand and view real-time state
- Monitor user, profile, and redirect logic

**Console Logs:**
- Check browser console for detailed logging
- Profile fetch and update operations are logged
- Error messages include specific details

**Database Logs:**
- Check Supabase dashboard logs for database errors
- Look for RLS policy violations or constraint errors

## Key Files Modified

- `src/contexts/UserContext.tsx` - Core user management logic
- `src/components/UserDemographicsForm.tsx` - Form submission handling
- `src/app/onboarding/page.tsx` - Onboarding page logic
- `src/app/layout.tsx` - Added debug panel
- `verify_schema.sql` - Database schema verification
- `run_schema_verification.sh` - Schema verification script
- `src/components/OnboardingDebugPanel.tsx` - Development debugging tool

## Expected Behavior After Fixes

1. **New Users:**
   - Automatic profile creation upon signup
   - Immediate redirect to onboarding from home page
   - Single completion of onboarding form
   - No repeated prompts

2. **Existing Users:**
   - Proper profile fetching and state management
   - Onboarding prompt only if not completed
   - Reliable form submission and state updates

3. **Error Handling:**
   - Clear error messages for users
   - Detailed logging for developers
   - Graceful fallbacks for database issues

## Troubleshooting

If issues persist:

1. **Check Database Schema:**
   ```bash
   ./run_schema_verification.sh
   ```

2. **Check Console Logs:**
   - Look for error messages in browser console
   - Check for network errors or database connection issues

3. **Verify Environment Variables:**
   - Ensure Supabase connection details are correct
   - Check RLS is enabled and policies are active

4. **Test with Fresh User:**
   - Create a completely new user account
   - Monitor the full flow from signup to completion

5. **Database Direct Check:**
   ```sql
   SELECT id, demographics_completed, created_at, updated_at 
   FROM profiles 
   WHERE id = 'your-user-id';
   ```

## Cleanup

To remove the debug panel after testing:

1. Remove `OnboardingDebugPanel` import and usage from `src/app/layout.tsx`
2. Delete `src/components/OnboardingDebugPanel.tsx` if no longer needed

The schema verification files should be kept for future use and deployment. 