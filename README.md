# JobHunt

Job application tracking system built with Next.js 15, TypeScript, Supabase, and Shadcn UI.

Track your job applications with a modern, intuitive Kanban board interface. Manage company information, interview stages, and application status all in one place.

## Features

- 🔐 Secure authentication via Supabase
- 📋 Application tracking with status management
- 📊 Kanban board with drag-and-drop
- 📝 Detailed application notes and tracking
- 📱 Responsive mobile and desktop design
- 🎨 macOS 26 "Liquid Glass" design system
- ✨ Spring physics animations and fluid interactions

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Supabase** - Backend (PostgreSQL, Auth, RLS)
- **Shadcn UI** - Component library
- **Tailwind CSS** - Styling
- **React Hook Form + Zod** - Form validation

## Quick Start

```bash
# Install dependencies
yarn install

# Set up Supabase (choose one)
# Option 1: Link to existing project
supabase link --project-ref your-project-ref
supabase db push  # Apply migrations

# Option 2: Local development
supabase start    # Starts local Supabase
supabase db reset # Apply all migrations

# Configure environment
cp .env.example .env.local
# Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

# Run development server
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Database Management

Database schema is managed via Supabase CLI migrations in `supabase/migrations/`.

**Commands:**

```bash
supabase db push      # Apply migrations to remote
supabase db reset     # Reset local DB and apply migrations
supabase migration new <name>  # Create new migration
supabase db diff      # Generate migration from schema changes
```

## Development

**Commands:**

```bash
yarn dev          # Start dev server
yarn build        # Build for production
yarn test         # Run tests
yarn lint         # Run ESLint
yarn typecheck    # TypeScript validation
```

**Quality Gates (required before commit):**

```bash
yarn lint && yarn typecheck && yarn test
```

## Deployment

Deploy to Vercel:

```bash
vercel
```

Add environment variables in Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

## Design System

This project uses the **macOS 26 "Liquid Glass"** design system - a modern, glass-morphism based visual language inspired by Apple's latest design aesthetics.

### Key Features

- **Glass Materials**: Ultra, Light, Medium, Heavy, and Frosted variants with realistic blur and depth
- **Color System**: RGBA-based semantic colors with automatic light/dark mode adaptation
- **Typography**: Responsive type scale based on 4pt baseline grid
- **Spacing**: 8pt grid system with half-step support
- **Animations**: Spring physics for natural, fluid interactions

### Customization

All design tokens are available at:

- Colors: `/src/lib/design-tokens/colors.ts`
- Typography: `/src/lib/design-tokens/typography.ts`
- Spacing: `/src/lib/design-tokens/spacing.ts`
- Global styles: `/src/app/globals.css`

## Documentation

- **[TODO.md](./TODO.md)** - Development checklist and roadmap
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant development guidelines

## License

Private project - All rights reserved
