# Development Workflow

## Perfect Development Setup

This document describes the ideal development workflow for the JobHunt application, including authentication, database seeding, and testing procedures.

## Quick Start

### 1. Database Setup

Reset the database with seed data:

```bash
# Reset linked Supabase database (production/staging)
supabase db reset --linked

# For local development
supabase db reset
```

This will:

- ✅ Run all migrations (001-008)
- ✅ Create test user with credentials
- ✅ Seed 4 sample companies
- ✅ Seed 7 sample applications (all statuses)
- ✅ Enable anonymous sign-ins

### 2. Test User Credentials

**Email**: `test@jobhunt.dev`
**Password**: `TestUser123!`
**User ID**: `00000000-0000-0000-0000-000000000001`

This user is created automatically via `supabase/seed.sql` and serves as the anchor debugging point.

### 3. Development Login

#### Option A: Quick Login Button (Recommended)

1. Start dev server: `yarn dev`
2. Navigate to `http://localhost:3000/login`
3. Click **"🚀 Quick Login as Test User"** button
4. Automatically redirected to dashboard with 7 sample applications

#### Option B: Manual Login

1. Navigate to `/login`
2. Enter credentials:
   - Email: `test@jobhunt.dev`
   - Password: `TestUser123!`
3. Click "Sign in"

#### Option C: Programmatic Login (for testing)

```typescript
import { devLoginAsTestUser } from '@/lib/auth/dev-login'

// In your test or component
const success = await devLoginAsTestUser()
if (success) {
  router.push('/dashboard')
}
```

### 4. Anonymous Sign-Ins (Enabled)

Anonymous authentication is enabled in `supabase/config.toml`:

```typescript
import { devLoginAnonymously } from '@/lib/auth/dev-login'

await devLoginAnonymously()
```

## Sample Data Overview

### Companies (4 total)

1. **TechCorp Inc** - Technology, San Francisco
2. **StartupX** - Software, Remote
3. **Enterprise Solutions Ltd** - Enterprise Software, New York
4. **AI Innovations** - AI/ML, Boston

### Applications (7 total, all statuses)

| Status                 | Job Title                 | Company        | Location |
| ---------------------- | ------------------------- | -------------- | -------- |
| `saved`                | DevOps Engineer           | TechCorp       | SF       |
| `applied`              | Senior Software Engineer  | TechCorp       | SF       |
| `interviewing`         | Full Stack Developer      | StartupX       | Remote   |
| `technical_assessment` | Backend Engineer          | Enterprise     | NYC      |
| `final_round`          | Engineering Manager       | Enterprise     | NYC      |
| `offer`                | Machine Learning Engineer | AI Innovations | Boston   |
| `rejected`             | Frontend Developer        | StartupX       | Remote   |

## Authentication Flow

### Protected Routes

Middleware (`src/middleware.ts`) automatically protects routes:

- **Dashboard (`/dashboard`)**: Requires authentication
  - Redirects to `/login` if not authenticated
  - Shows message: "Please log in to access the dashboard"

- **Auth Pages (`/login`, `/signup`)**: Auto-redirect if authenticated
  - Redirects to `/dashboard` if already logged in

### Authentication Checks

1. **Middleware Level** (first line of defense)
   - Validates session before route handler
   - Redirects unauthenticated users
   - Refreshes expired tokens

2. **Component Level** (client-side)
   - Dashboard page checks `auth.getUser()`
   - Shows loading state while checking
   - Displays error if no session

3. **API Level** (server actions)
   - All API calls use `getUserId()` from `auth/context.ts`
   - Throws clear errors if not authenticated
   - Uses RLS policies for data isolation

### Row Level Security (RLS)

All database tables enforce user isolation:

```sql
-- Example RLS policy
CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (user_id = (select auth.uid()));
```

**Result**: Users can only access their own data, even with direct database access.

## Development Helpers

### Quick Auth Functions

Located in `src/lib/auth/dev-login.ts`:

```typescript
// Login as test user
await devLoginAsTestUser()

// Login with custom credentials
await devLoginWithCredentials(email, password)

// Anonymous login
await devLoginAnonymously()

// Get current user (for debugging)
await devGetCurrentUser()

// Logout
await devLogout()
```

**Security Note**: These functions only work in development mode (`NODE_ENV === 'development'`).

## Common Development Tasks

### Reset Everything

```bash
# Clear database and reseed
supabase db reset --linked

# Restart dev server
yarn dev
```

### Test Authentication Flow

1. Clear browser cookies/localStorage
2. Navigate to `/dashboard`
3. Should redirect to `/login`
4. Click "Quick Login" button
5. Should redirect to `/dashboard` with applications

### Test RLS Policies

```bash
# Try to access data without auth (should fail)
curl -X GET 'YOUR_SUPABASE_URL/rest/v1/applications' \
  -H "apikey: YOUR_ANON_KEY"

# Should return: {"message":"JWT expired"}
```

### Debug Auth Issues

```typescript
// In browser console
import { devGetCurrentUser } from '@/lib/auth/dev-login'
await devGetCurrentUser()

// Check session
const supabase = createClient()
const { data } = await supabase.auth.getSession()
console.log(data.session)
```

## Testing Workflow

### Manual Testing

1. **Unauthenticated Access**
   - Visit `/dashboard` → Redirects to `/login` ✅
   - Visit `/login` → Shows login form ✅

2. **Authentication**
   - Click "Quick Login" → Redirects to dashboard ✅
   - Dashboard loads applications ✅
   - All 7 applications visible in Kanban board ✅

3. **CRUD Operations**
   - Create new application → Appears in board ✅
   - Update application → Changes saved ✅
   - Delete application → Removed from board ✅
   - Drag-and-drop status change → Updates database ✅

4. **Logout**
   - Click logout → Redirects to login ✅
   - Visit `/dashboard` → Redirects to login ✅

### Automated Testing

```bash
# Run all quality gates
yarn lint          # ESLint checks
yarn typecheck     # TypeScript compilation
yarn test          # Vitest tests (727 tests)

# Run specific test suites
yarn test dashboard
yarn test auth
yarn test applications
```

## Production Considerations

### Before Deployment

1. **Remove Dev Login Button**
   - Dev login button only appears in development
   - Automatically hidden in production (`NODE_ENV === 'production'`)

2. **Update Test User**
   - Change password in seed.sql
   - Or remove test user creation entirely

3. **Configure Supabase Dashboard**
   - Enable anonymous sign-ins: Settings → Auth → Anonymous sign-ins
   - Configure redirect URLs
   - Set up email templates

4. **Environment Variables**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```

## Troubleshooting

### "Permission denied" Error

**Symptom**: Dashboard shows "Permission denied: Cannot access resource"

**Causes**:

1. Not logged in
2. Session expired
3. RLS policies blocking access

**Solutions**:

1. Clear cookies and login again
2. Check middleware is running
3. Verify `auth.uid()` returns user ID
4. Check RLS policies in Supabase dashboard

### "No authenticated user found"

**Symptom**: Error when calling API endpoints

**Solutions**:

1. Ensure middleware is protecting routes
2. Check session exists: `supabase.auth.getSession()`
3. Verify cookies are being set correctly
4. Check browser console for auth errors

### Seed Data Not Loading

**Symptom**: Test user not created after `db reset`

**Solutions**:

1. Check `supabase/seed.sql` for syntax errors
2. Verify `db.seed.enabled = true` in config.toml
3. Run with debug: `supabase db reset --linked --debug`
4. Check migration 008 created user_profiles table

## File Reference

### Configuration

- `supabase/config.toml` - Supabase local config
- `supabase/seed.sql` - Seed data script

### Authentication

- `src/middleware.ts` - Route protection
- `src/lib/supabase/middleware.ts` - Session management
- `src/lib/auth/context.ts` - Auth context helpers
- `src/lib/auth/dev-login.ts` - Development login helpers

### Dashboard

- `src/app/dashboard/page.tsx` - Main dashboard component
- `src/app/dashboard/actions.ts` - Server actions
- `src/lib/api/applications.ts` - Application CRUD

### UI

- `src/app/(auth)/login/page.tsx` - Login page with dev button
- `src/components/applications/KanbanBoardV3.tsx` - Kanban board

## Quality Assurance

### Pre-Commit Checklist

- [ ] Run `yarn lint` (0 errors)
- [ ] Run `yarn typecheck` (0 errors)
- [ ] Run `yarn test` (all 727 tests pass)
- [ ] Test login flow manually
- [ ] Verify dashboard loads applications
- [ ] Check no console errors

### Code Standards

- ✅ No `any` types
- ✅ No `eslint-disable` comments
- ✅ No `@ts-ignore` comments
- ✅ All functions have proper error handling
- ✅ All database queries use RLS policies
- ✅ All routes protected by middleware

---

**Last Updated**: 2025-11-01
**Author**: JobHunt Development Team
**Version**: 1.0.0
