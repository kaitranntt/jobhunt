# Architecture Overview

This document provides a technical overview of the JobHunt application architecture.

## Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript 5** - Type-safe JavaScript
- **React 18** - UI library
- **Shadcn UI** - Component library built on Radix UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@dnd-kit** - Drag-and-drop functionality

### Backend

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Real-time subscriptions

### Testing

- **Vitest** - Unit and integration testing
- **Testing Library** - Component testing
- **jsdom** - DOM implementation for tests

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking

## Project Structure

```
jobhunt/
├── .github/                    # GitHub templates
│   ├── ISSUE_TEMPLATE/        # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── public/                     # Static assets
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── (auth)/           # Auth-related pages
│   │   ├── (dashboard)/      # Protected dashboard pages
│   │   ├── globals.css       # Global styles
│   │   └── layout.tsx        # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn UI components
│   │   └── ...               # Feature components
│   ├── lib/                   # Utility functions
│   │   ├── design-tokens/    # Design system tokens
│   │   ├── supabase/         # Supabase clients
│   │   └── utils.ts          # Helper functions
│   └── types/                 # TypeScript types
├── supabase/
│   ├── migrations/            # Database migrations
│   └── config.toml           # Supabase configuration
├── scripts/                   # Build and validation scripts
└── tests/                     # Test files (co-located with source)
```

## Design Patterns

### Component Architecture

**Atomic Design Principles:**

- **Atoms**: Basic UI elements (Button, Input, Label)
- **Molecules**: Simple component combinations (FormField, Card)
- **Organisms**: Complex components (ApplicationCard, KanbanBoard)
- **Templates**: Page layouts
- **Pages**: Complete views with data

### State Management

- **Server State**: Supabase queries with React Server Components
- **Client State**: React hooks (useState, useReducer)
- **Form State**: React Hook Form
- **URL State**: Next.js routing and search params

### Data Flow

```
User Action → Component → API Route/Server Action → Supabase → Database
                ↓                                        ↓
            UI Update ← React State ← Response ← RLS Check
```

## Database Schema

### Core Tables

**users** (managed by Supabase Auth)

- id (uuid, primary key)
- email
- created_at

**companies**

- id (uuid, primary key)
- user_id (uuid, foreign key)
- name (text)
- website (text, optional)
- notes (text, optional)
- created_at (timestamp)
- updated_at (timestamp)

**applications**

- id (uuid, primary key)
- user_id (uuid, foreign key)
- company_id (uuid, foreign key)
- position (text)
- status (enum: wishlist, applied, interview, offer, rejected)
- salary_range (text, optional)
- location (text, optional)
- job_url (text, optional)
- notes (text, optional)
- applied_date (date, optional)
- created_at (timestamp)
- updated_at (timestamp)

### Row Level Security (RLS)

All tables have RLS policies ensuring users can only access their own data:

```sql
-- Example policy
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);
```

## Authentication Flow

1. User visits login page
2. Enters credentials (email/password)
3. Supabase Auth validates and creates session
4. Session stored in HTTP-only cookie
5. Middleware validates session on protected routes
6. User redirected to dashboard or login page

## Design System

### macOS 26 "Liquid Glass"

**Core Principles:**

- Glass morphism with realistic blur effects
- Depth through layering and shadows
- Fluid animations using spring physics
- Responsive typography based on 4pt grid
- 8pt spacing system

**Color System:**

- RGBA-based semantic colors
- Automatic light/dark mode adaptation
- Consistent opacity levels for glass effects

**Components:**

- All components follow design tokens
- Accessible by default (WCAG 2.1 AA)
- Mobile-first responsive design

## Testing Strategy

### Unit Tests

- Business logic functions
- Validation schemas
- Utility functions
- Component rendering

### Integration Tests

- API routes
- Database operations
- Authentication flows
- Form submissions

### Test Coverage Goals

- Business Logic: 80%+
- Components: 70%+
- Overall: 75%+

## Performance Considerations

### Optimization Techniques

- **Server Components**: Reduce client-side JavaScript
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Dynamic imports for heavy components
- **Database Indexing**: Optimized queries with proper indexes

### Monitoring

- Vercel Analytics for performance metrics
- Error tracking via console logs
- Database query performance via Supabase dashboard

## Security

### Best Practices

- Environment variables for secrets
- Row Level Security on all tables
- HTTP-only cookies for sessions
- CSRF protection via Supabase
- Input validation with Zod schemas
- SQL injection prevention via parameterized queries

## Deployment

### Vercel Deployment

- Automatic deployments from main branch
- Preview deployments for pull requests
- Environment variables configured in Vercel dashboard
- Edge runtime for optimal performance

### Database Migrations

- Version-controlled SQL migrations
- Applied via Supabase CLI
- Tested locally before production deployment

## Development Workflow

### Quality Gates

All code must pass before merging:

1. ESLint (zero errors/warnings)
2. TypeScript compilation (zero errors)
3. All tests passing
4. Build successful

### Git Workflow

1. Create feature branch
2. Implement with TDD
3. Run quality gates
4. Create pull request
5. Code review
6. Merge to main
7. Automatic deployment

## Future Enhancements

### Planned Features

- Real-time collaboration
- Advanced analytics dashboard
- Email notifications
- Resume management
- Interview preparation tools
- Mobile app (React Native)

### Scalability Considerations

- Database connection pooling
- Caching layer (Redis)
- CDN for static assets
- Horizontal scaling via Vercel
- Database read replicas

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed development guidelines.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
