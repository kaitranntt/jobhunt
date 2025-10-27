# Database Setup

## Quick Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create new project or use existing one
3. Get project URL and keys from Settings > API

### 2. Configure Environment

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
```

### 3. Deploy Database Schema

```bash
cd apps/jobhunt
supabase link --project-ref your-project-ref
supabase db push
```

## Database Structure

**Core Tables:**

- `companies` - Company information with user ownership
- `applications` - Job application tracking with status management

**Security Features:**

- Row Level Security (RLS) enabled
- Users can only access their own data
- Performance indexes optimized for common queries

## Essential Commands

```bash
# Apply migrations to remote project
supabase db push

# Reset local database
supabase db reset

# Create new migration
supabase migration new migration_name
```

---

For detailed deployment instructions, see the main README.md.
