# Supabase Production Setup Guide

## Overview
This guide configures Supabase for a **no-friction user experience** where:
- ✅ Users can use the app immediately without authentication
- ✅ Authentication is optional and available via the profile button
- ✅ User data persists when they choose to authenticate
- ✅ Seamless transition from anonymous to authenticated usage

---

## Step 1: Access Your Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: **huavbzsevepndkbgikoi**

---

## Step 2: Configure Authentication Settings

### 2.1 Disable Email Confirmation (Critical for UX)
1. Navigate to **Authentication** → **Settings**
2. Scroll to **"Email Confirmation"** section
3. **Toggle OFF** "Enable email confirmations"
4. Click **Save**

*Why: This allows users to sign up and use their account immediately without waiting for email confirmation*

### 2.2 Configure Site URL
1. In the same **Authentication** → **Settings** page
2. Find **"Site URL"** field
3. Set it to your production domain: `https://your-domain.com`
4. Click **Save**

### 2.3 Add Redirect URLs
1. Scroll to **"Redirect URLs"** section
2. Add these URLs (replace `your-domain.com` with your actual domain):
   ```
   https://your-domain.com/auth/callback
   https://your-domain.com/
   http://localhost:3000/auth/callback (for development)
   ```
3. Click **Save**

---

## Step 3: Configure Email Settings (Optional but Recommended)

### 3.1 Set Up Custom SMTP (Production)
1. Go to **Authentication** → **Settings**
2. Scroll to **"SMTP Settings"**
3. Configure with your email provider (SendGrid, Mailgun, etc.):
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Your SendGrid API Key]
   ```
4. Click **Save**

### 3.2 Alternative: Use Built-in Email (Simple)
- If you skip SMTP setup, Supabase will use their built-in email service
- This works fine for most use cases but has lower delivery rates

---

## Step 4: Configure Row Level Security (RLS)

### 4.1 Enable RLS for User Data Tables
1. Go to **Database** → **Tables**
2. Find your data tables (e.g., `user_evaluations`, `user_preferences`)
3. For each table, click the table name
4. Click **"Edit"** or the settings icon
5. **Enable Row Level Security (RLS)**
6. Click **Save**

### 4.2 Create RLS Policies
For each table with user data, create these policies:

**Policy 1: Allow Anonymous Read**
```sql
CREATE POLICY "Allow anonymous read" ON public.user_evaluations
FOR SELECT USING (true);
```

**Policy 2: Allow Authenticated Users Full Access**
```sql
CREATE POLICY "Allow authenticated users full access" ON public.user_evaluations
FOR ALL USING (auth.uid() IS NOT NULL);
```

**Policy 3: Allow Insert for Anonymous Users**
```sql
CREATE POLICY "Allow anonymous insert" ON public.user_evaluations
FOR INSERT WITH CHECK (true);
```

---

## Step 5: Database Schema Updates

### 5.1 Add Anonymous User Support
Run this SQL in **SQL Editor**:

```sql
-- Add anonymous user tracking
ALTER TABLE public.user_evaluations 
ADD COLUMN IF NOT EXISTS anonymous_id TEXT;

-- Add session tracking for anonymous users
CREATE TABLE IF NOT EXISTS public.anonymous_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Enable RLS on anonymous_sessions
ALTER TABLE public.anonymous_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write their own anonymous session
CREATE POLICY "Allow session management" ON public.anonymous_sessions
FOR ALL USING (true);
```

### 5.2 Create Migration Function
```sql
-- Function to migrate anonymous data to authenticated user
CREATE OR REPLACE FUNCTION migrate_anonymous_to_user(
    p_anonymous_id TEXT,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    -- Update evaluations to link to authenticated user
    UPDATE public.user_evaluations 
    SET user_id = p_user_id, anonymous_id = NULL
    WHERE anonymous_id = p_anonymous_id AND user_id IS NULL;
    
    -- You can add more tables here as needed
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Step 6: API Configuration

### 6.1 Get Your Keys
1. Go to **Settings** → **API**
2. Copy these values for your environment variables:
   - **Project URL**: `https://huavbzsevepndkbgikoi.supabase.co`
   - **anon public key**: (for client-side)
   - **service_role secret key**: (for server-side, keep secure!)

### 6.2 Update Environment Variables
In your `.env.local` and production environment:
```env
NEXT_PUBLIC_SUPABASE_URL=https://huavbzsevepndkbgikoi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

---

## Step 7: Security Configuration

### 7.1 Configure CORS
1. Go to **Settings** → **API**
2. Add your domains to **CORS origins**:
   ```
   https://your-domain.com
   http://localhost:3000
   ```

### 7.2 Rate Limiting (Optional)
1. In **Settings** → **API**
2. Configure rate limits:
   - **Auth requests**: 30 per hour per IP
   - **Database requests**: 100 per minute per IP

---

## Step 8: Testing Your Configuration

### 8.1 Test Anonymous Usage
1. Visit your app without signing in
2. Use features (evaluations, etc.)
3. Verify data is saved (check database)

### 8.2 Test Authentication Flow
1. Click the profile button
2. Sign up with a new account
3. Verify you can access the same features
4. Check that anonymous data migrates (if implemented)

### 8.3 Test Email Flow
1. Sign up with a real email
2. Verify you receive confirmation email (if enabled)
3. Test password reset flow

---

## Step 9: Production Deployment Checklist

### Before Going Live:
- [ ] Email confirmation disabled for immediate access
- [ ] Site URL set to production domain
- [ ] Redirect URLs configured
- [ ] RLS policies created and tested
- [ ] SMTP configured (or using Supabase email)
- [ ] Environment variables updated
- [ ] CORS configured for your domain
- [ ] Anonymous data migration tested
- [ ] Rate limiting configured

### Post-Launch Monitoring:
- [ ] Monitor authentication error rates
- [ ] Check email delivery rates
- [ ] Monitor database performance
- [ ] Review security logs

---

## Troubleshooting Common Issues

### Issue: Users can't sign up
**Solution**: Check that email confirmation is disabled in Auth settings

### Issue: Redirect errors after signup
**Solution**: Verify redirect URLs are correctly configured

### Issue: Anonymous data not saving
**Solution**: Check RLS policies allow anonymous access

### Issue: Email not sending
**Solution**: Configure SMTP or check Supabase email logs

---

## Support

For additional help:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- Check the `src/app/dev-auth/page.tsx` debug panel in development

---

## Configuration Summary

**Current Setup**:
- ✅ Authentication disabled by default
- ✅ Profile button authentication available
- ✅ No signup friction
- ✅ Data persistence for authenticated users
- ✅ Seamless anonymous → authenticated transition

This configuration provides the best user experience while maintaining the option for user accounts and data persistence. 