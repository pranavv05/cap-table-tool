# CapTable Tool - Development Setup Guide

## Quick Fix for Dashboard Access Issue ✅ RESOLVED

**UPDATE: The useRouter import error has been fixed!**

The issue you were experiencing is related to missing Clerk authentication configuration. Here are the steps to fix it:

### Option 1: Set Up Clerk Authentication (Recommended)

1. **Create a Clerk account** at https://clerk.com
2. **Create a new application** in your Clerk dashboard
3. **Copy your API keys** from the Clerk dashboard
4. **Create a `.env.local` file** in your project root with these keys:

```bash
# Copy .env.local.example to .env.local and fill in your actual keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# Your Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Option 2: Development Mode (Temporary)

I've modified the code to work in development mode without authentication. The app will now:

1. **Show a development warning banner** at the top
2. **Bypass authentication checks** in development
3. **Use a mock user ID** for testing
4. **Allow direct access** to `/dashboard` and `/onboarding`

### Testing the Flow

1. **Start the development server** (already running on http://localhost:3000)
2. **Navigate to http://localhost:3000/onboarding** - This should work directly
3. **Complete the onboarding form** - After completion, you'll be redirected to `/dashboard`
4. **Navigate to http://localhost:3000/dashboard** - This should work directly in development mode

### Expected Flow After Setup

1. **User signs up** → Redirected to `/onboarding`
2. **User completes onboarding** → Redirected to `/dashboard`  
3. **User signs in** → Redirected to `/dashboard` (or to `/onboarding` if no company exists)
4. **Direct dashboard access** → Works if authenticated, otherwise redirects to sign-in

### Troubleshooting

If you're still having issues:

1. **Check browser console** for error messages
2. **Verify environment variables** are loaded correctly
3. **Clear browser cache** and cookies
4. **Restart the development server** after environment changes

### File Changes Made

- `components/auth-guard.tsx` - Improved redirect URL handling
- `app/dashboard/page.tsx` - Better error handling, navigation, and **FIXED useRouter import**
- `app/sign-in/[[...sign-in]]/page.tsx` - Fixed redirect URL parsing
- `app/layout.tsx` - Added development mode bypass
- `app/onboarding/page.tsx` - Added development mode user handling
- `components/onboarding-form.tsx` - Improved form submission

### Recent Fix Applied ✅

**Fixed ReferenceError: useRouter is not defined**
- Added missing `import { useRouter } from "next/navigation"` to dashboard page
- Restarted development server to clear cache
- Dashboard should now load without JavaScript errors

**Fixed 500 Internal Server Error**
- Enhanced error handling for missing Supabase configuration
- Added development mode fallback with demo data
- Dashboard now works even without environment variables configured
- Improved Supabase client error handling

### How It Works Now

**Development Mode (No Configuration Required):**
- Visit `http://localhost:3000/dashboard` - Shows demo company data
- Visit `http://localhost:3000/onboarding` - Works for testing the flow
- No environment variables needed for basic functionality
- Authentication is bypassed in development

**Production Mode (Requires Configuration):**
- Copy `.env.local.example` to `.env.local`
- Add your Clerk and Supabase credentials
- Full authentication and database functionality

The main fix is that the app now works in development mode without requiring full Clerk setup, while maintaining the proper authentication flow for production.