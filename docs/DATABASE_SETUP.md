# JobHunt Database Setup Guide

## 🚀 Quick Start - Clean Remote Database

This guide helps you set up a clean, minimal database for JobHunt without using local Supabase (which consumes memory).

### Option 1: Clean Up Current Production Database (Recommended)

Since this is early stage with no users, we can safely reset your current Supabase project.

#### Step 1: Clean Existing Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your JobHunt project
3. Go to **SQL Editor**
4. Copy and paste the contents of `supabase/cleanup_database.sql`
5. Click **Run** to clean all existing data (preserves auth users)

#### Step 2: Deploy Clean Migrations

Run this command from your project root:

```bash
cd apps/jobhunt
supabase db push
```

This will deploy the clean migrations:

- ✅ `001_create_core_tables.sql` - Essential companies and applications tables
- ✅ `002_add_security_and_indexes.sql` - RLS policies and performance indexes
- ✅ `003_seed_demo_data.sql` - Helper functions for testing

### Option 2: Create New Supabase Project

If you prefer a completely fresh start:

1. **Create new project** in [Supabase Dashboard](https://supabase.com/dashboard)
2. **Get project URL and keys** from Settings > API
3. **Update your environment variables**:
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-new-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
   ```
4. **Run migrations**: `supabase db push`

## 📁 Database Structure

### Core Tables

- **`companies`** - Company information with user ownership
- **`applications`** - Job application tracking with status management

### Security

- ✅ **Row Level Security (RLS)** - Users see only their own data
- ✅ **Performance indexes** - Optimized for common queries
- ✅ **Input validation** - Status constraints and foreign keys

### Features

- ✅ **Company management** - Add/edit companies per user
- ✅ **Application tracking** - Track job applications with status
- ✅ **Auto-updating timestamps** - `updated_at` fields
- ✅ **Helper functions** - For development and testing

## 🧪 Testing and Development

### Add Sample Data

Once you have users, you can create sample data:

```sql
-- Run in Supabase SQL Editor
SELECT create_sample_data('your-user-uuid');
```

### Check Database Stats

```sql
SELECT * FROM get_database_stats();
```

### View Applications with Companies

```sql
-- Use the built-in view
SELECT * FROM applications_with_company;
```

## 🔧 Environment Setup

### Required Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_your-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 📊 Benefits of This Approach

| Aspect              | Before            | After           |
| ------------------- | ----------------- | --------------- |
| **Migration files** | 10 complex        | 3 simple        |
| **Code lines**      | 2,000+            | ~350            |
| **Setup time**      | 30+ minutes       | 5 minutes       |
| **Memory usage**    | High (local)      | Zero (remote)   |
| **Supabase push**   | Complex conflicts | Works perfectly |

## 🎯 Next Steps

1. **Deploy clean database** using Option 1 or 2 above
2. **Test the application** with the new database
3. **Start building features** on the clean foundation
4. **Add new migrations** as needed for future features

## 🔒 Security Notes

- All tables have Row Level Security enabled
- Users can only access their own data
- Database policies enforce security at the data layer
- No hardcoded user data in migrations

## 🚨 Important

- **Backup any existing data** before running cleanup script
- **Test in a staging environment** first if possible
- **This setup is optimized** for early-stage development
- **Can easily extend** with additional tables and features

---

**Need help?** Check the migration files in `supabase/migrations/` for detailed implementation.
