# JobHunt Codebase Summary

**Generated:** 2025-10-25
**Total Files:** 142 files
**Total Tokens:** 211,680 tokens
**Primary Languages:** TypeScript, React, SQL

## Overview

JobHunt is a modern job application tracking system built with Next.js 15, TypeScript, and Supabase. The application provides an intuitive Kanban board interface for tracking job applications with comprehensive authentication, CRUD operations, and a glass-morphism design system.

## Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript 5** - Type-safe JavaScript development
- **React 18** - UI library with Server Components
- **Shadcn UI** - Component library built on Radix UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Hook Form + Zod** - Form validation and state management
- **@dnd-kit** - Drag-and-drop functionality for Kanban board

### Backend

- **Supabase** - Backend-as-a-Service platform
  - PostgreSQL database with Row Level Security (RLS)
  - Authentication system (email/password only)
  - Real-time subscriptions
  - File storage for document management

### Testing & Quality

- **Vitest** - Unit and integration testing framework
- **Testing Library** - Component testing utilities
- **ESLint + Prettier** - Code quality and formatting
- **TypeScript strict mode** - Type safety enforcement

## Application Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (login, signup)
│   ├── auth/              # Auth callback routes
│   ├── dashboard/         # Protected dashboard pages
│   ├── globals.css        # Global styles and design tokens
│   └── layout.tsx         # Root layout component
├── components/            # React components
│   ├── applications/      # Job application management components
│   ├── contacts/          # Contact management components
│   ├── documents/         # Document storage components
│   ├── layout/            # Layout and navigation components
│   ├── reminders/         # Reminder system components
│   ├── ui/                # Shadcn UI base components
│   └── index.ts           # Component exports
├── lib/                   # Utility functions and configurations
│   ├── design-tokens/     # Design system tokens (colors, typography, spacing)
│   ├── supabase/          # Supabase client configurations
│   ├── utils.ts           # General utility functions
│   └── hooks.ts           # Custom React hooks
└── types/                 # TypeScript type definitions
    ├── application.ts     # Application-related types
    ├── auth.ts            # Authentication types
    ├── contact.ts         # Contact-related types
    ├── document.ts        # Document-related types
    └── index.ts           # Type exports
```

### Core Features

#### Authentication System

- **Email/password authentication** via Supabase Auth
- **Protected routes** with middleware validation
- **Session management** using HTTP-only cookies
- **Comprehensive test coverage** (login: 8 tests, signup: 8 tests)

#### Application Management

- **CRUD operations** for job applications
- **Kanban board interface** with drag-and-drop functionality
- **Status tracking** (wishlist, applied, interview, offer, rejected)
- **Company information management**
- **Application notes and metadata**

#### Contact Management

- **Contact database** with linked applications
- **Contact CRUD operations**
- **Relationship mapping** between contacts and applications

#### Document Storage

- **File upload system** via Supabase Storage
- **Document linking** to job applications
- **File preview capabilities**

#### Reminder System

- **Task reminders** with notification system
- **Upcoming reminders widget** on dashboard
- **Chronological timeline view**

## Database Schema

### Core Tables

#### users (Supabase Auth managed)

- `id` (uuid, primary key)
- `email` (text)
- `created_at` (timestamp)

#### companies

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `name` (text)
- `website` (text, optional)
- `notes` (text, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### applications

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `company_id` (uuid, foreign key)
- `position` (text)
- `status` (enum: wishlist, applied, interview, offer, rejected)
- `salary_range` (text, optional)
- `location` (text, optional)
- `job_url` (text, optional)
- `notes` (text, optional)
- `applied_date` (date, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### contacts

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `name` (text)
- `email` (text, optional)
- `phone` (text, optional)
- `position` (text, optional)
- `company_id` (uuid, foreign key, optional)
- `notes` (text, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### documents

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `application_id` (uuid, foreign key, optional)
- `name` (text)
- `file_path` (text)
- `file_type` (text)
- `file_size` (bigint)
- `created_at` (timestamp)

#### reminders

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `application_id` (uuid, foreign key, optional)
- `title` (text)
- `description` (text, optional)
- `due_date` (timestamp)
- `is_completed` (boolean)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Security Features

- **Row Level Security (RLS)** on all tables
- **User isolation** - users can only access their own data
- **Authentication middleware** for protected routes
- **Input validation** using Zod schemas
- **SQL injection prevention** via parameterized queries

## Design System

### macOS 26 "Liquid Glass"

The application implements a modern glass-morphism design system inspired by Apple's macOS aesthetics:

#### Key Features

- **Glass materials** with realistic blur effects (Ultra, Light, Medium, Heavy, Frosted)
- **RGBA-based semantic colors** with automatic light/dark mode adaptation
- **Responsive typography** based on 4pt baseline grid
- **8pt spacing system** with half-step support
- **Spring physics animations** for natural, fluid interactions

#### Design Tokens Location

- Colors: `/src/lib/design-tokens/colors.ts`
- Typography: `/src/lib/design-tokens/typography.ts`
- Spacing: `/src/lib/design-tokens/spacing.ts`
- Global styles: `/src/app/globals.css`

## Testing Strategy

### Test Coverage

- **Business Logic:** 80%+ coverage requirement
- **Components:** 70%+ coverage requirement
- **Overall:** 75%+ coverage achieved

### Test Structure

- **Unit tests** for business logic, validation schemas, and utility functions
- **Component tests** for UI components with comprehensive interaction testing
- **Integration tests** for API routes and database operations
- **E2E tests** planned for critical user flows

### Quality Gates

All code must pass before merging:

1. `yarn lint` - ESLint passes with zero errors/warnings
2. `yarn typecheck` - TypeScript compilation succeeds
3. `yarn test` - All tests pass
4. No `any` types, `eslint-disable`, or `@ts-ignore` comments

## Development Workflow

### Package Management

- **Yarn (modern)** as the exclusive package manager
- **Lock file:** `yarn.lock` committed to version control
- **Installation:** `yarn install` or simply `yarn`

### Database Management

- **Supabase CLI** for database migrations
- **Version-controlled migrations** in `supabase/migrations/`
- **Local development** with `supabase start`
- **Remote deployment** with `supabase db push`

### Quality Standards

- **Test-Driven Development (TDD)** approach
- **Strict TypeScript** with proper type definitions
- **ESLint compliance** with no bypasses allowed
- **Comprehensive error handling** throughout the application

## Deployment

### Vercel Integration

- **Automatic deployments** from main branch
- **Preview deployments** for pull requests
- **Environment variables** managed in Vercel dashboard
- **Edge runtime** for optimal performance

### Environment Configuration

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side)

## Current Status

The application is in a mature state with:

- ✅ **Complete MVP functionality** with full CRUD operations
- ✅ **Enhanced features** including contacts, documents, and reminders
- ✅ **Comprehensive test coverage** (98.8% overall)
- ✅ **Production deployment** on Vercel
- ✅ **Email-only authentication** (Google OAuth removed)

## Future Roadmap

### Phase 3: Advanced Features

- Analytics dashboard with success metrics
- AI-powered job matching and recommendations
- Email integration for auto-importing applications
- Advanced filtering and search capabilities

### Scalability Considerations

- Database connection pooling
- Caching layer implementation
- CDN optimization for static assets
- Mobile app development (React Native)

This codebase represents a well-structured, thoroughly tested, and production-ready job application tracking system with modern architectural patterns and comprehensive feature coverage.
