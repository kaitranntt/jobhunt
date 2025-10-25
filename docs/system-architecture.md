# JobHunt - System Architecture & Design Patterns

**Document Version:** 1.0
**Last Updated:** October 25, 2025
**Architecture Style:** Modern Web Application with Serverless Backend

## Executive Summary

JobHunt employs a modern, scalable architecture built on Next.js 15 with Supabase as the backend-as-a-service. The system follows a clean architecture pattern with clear separation of concerns, comprehensive security measures, and optimized performance characteristics. This architecture supports the current feature set while providing a solid foundation for future scaling and feature expansion.

## High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                              │
├─────────────────────────────────────────────────────────────┤
│  Web Browser (Next.js 15 + React 18 + TypeScript 5)       │
│  - App Router Architecture                                   │
│  - Server & Client Components                               │
│  - Tailwind CSS + Shadcn UI                                 │
│  - Progressive Web App Capabilities                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer                                  │
├─────────────────────────────────────────────────────────────┤
│  Next.js API Routes + Supabase Client                       │
│  - Authentication Routes (callback, signout)                │
│  - Application CRUD Endpoints                               │
│  - Server-Side Data Fetching                                │
│  - Type-Safe API Responses                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend-as-a-Service Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Supabase Platform                                          │
│  - PostgreSQL Database with RLS                             │
│  - Authentication Service                                   │
│  - Real-time Subscriptions                                  │
│  - File Storage                                             │
│  - Edge Functions                                           │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack Architecture

### Frontend Architecture

#### Next.js 15 App Router Implementation

```
src/app/
├── layout.tsx              # Root layout with providers
├── page.tsx               # Landing page (marketing)
├── globals.css            # Global styles and design tokens
├── not-found.tsx          # Custom 404 page
├── (auth)/                # Authentication route group
│   ├── login/page.tsx     # Login page
│   └── signup/page.tsx    # Signup page
├── auth/                  # Authentication API routes
│   ├── callback/route.ts  # OAuth callback handler
│   └── signout/route.ts   # Enhanced signout handler (POST/GET support)
└── dashboard/             # Protected application routes
    ├── page.tsx           # Main dashboard
    ├── layout.tsx         # Dashboard layout
    └── actions.ts         # Server actions
```

**Key Architectural Decisions:**

- **App Router**: Leveraging Next.js 15's App Router for improved performance and developer experience
- **Server Components**: Using React Server Components for optimal performance and SEO
- **Route Groups**: Organizing routes with `(auth)` for authentication flows
- **API Routes**: Implementing secure API endpoints for server-side operations

#### Component Architecture

```
src/components/
├── ui/                    # Base UI components (Shadcn)
│   ├── button.tsx        # Reusable button component
│   ├── card.tsx          # Card container component
│   ├── dialog.tsx        # Modal dialog component
│   └── ...
├── auth/                 # Authentication-specific components
│   ├── LogoutButton.tsx  # Logout button with confirmation dialog
│   └── ...
├── layout/               # Layout-specific components
│   ├── NavBar.tsx        # Navigation bar
│   ├── AnimatedBackground.tsx # Background animations
│   └── LandingContent.tsx # Landing page content
├── applications/         # Feature-specific components
│   ├── ApplicationCard.tsx # Application display card
│   ├── ApplicationForm.tsx # Application creation/editing
│   ├── ApplicationDetail.tsx # Detailed view
│   └── KanbanBoardV2.tsx # Kanban board interface
├── landing/              # Landing page sections
│   ├── HeroSection.tsx   # Hero section
│   ├── FeaturesSection.tsx # Features showcase
│   └── ...
└── providers/            # React context providers
    ├── ThemeProvider.tsx # Theme management
    └── ...
```

**Design Patterns:**

- **Compound Components**: Shadcn UI components follow compound pattern
- **Custom Hooks**: Business logic encapsulated in custom hooks
- **Render Props**: Used for complex component composition
- **Higher-Order Components**: Applied for cross-cutting concerns

### Backend Architecture

#### Supabase Integration

```
src/lib/supabase/
├── client.ts             # Client-side Supabase instance
├── server.ts             # Server-side Supabase instance
└── middleware.ts         # Auth middleware
```

**Implementation Details:**

- **Dual Client Pattern**: Separate client and server instances for optimal security
- **Type Safety**: Auto-generated TypeScript types from database schema
- **Row Level Security**: Database-level access control for multi-tenancy
- **Real-time Subscriptions**: Live data updates across connected clients

#### Database Schema Architecture

```sql
-- Core application tracking
applications (id, user_id, company, position, status, created_at, updated_at, ...)
├── Foreign Key: user_id → auth.users.id
├── Indexes: user_id, status, created_at
└── RLS Policies: User isolation

-- Contact management
contacts (id, user_id, name, email, phone, company_id, ...)
├── Foreign Keys: user_id, company_id
└── RLS Policies: User isolation

-- Document storage
documents (id, user_id, application_id, file_path, file_type, ...)
├── Foreign Keys: user_id, application_id
└── Storage Integration: Supabase Storage

-- Reminder system
reminders (id, user_id, application_id, reminder_date, message, ...)
├── Foreign Keys: user_id, application_id
└── Scheduling: Automated notifications

-- User profiles
user_profiles (id, user_id, preferences, settings, ...)
├── Foreign Key: user_id → auth.users.id
└── Extended User Data: Beyond auth.users
```

## Data Flow Architecture

### Authentication Flow

```
Login Flow:
1. User Login Request
   ↓
2. Next.js Middleware → Supabase Auth
   ↓
3. Supabase validates credentials
   ↓
4. JWT token generation
   ↓
5. Session storage in cookies
   ↓
6. Redirect to protected route
   ↓
7. Server-side session validation on each request

Logout Flow:
1. User clicks logout button in authenticated navbar
   ↓
2. Confirmation dialog prevents accidental logouts
   ↓
3. POST request to /auth/signout API route
   ↓
4. Supabase auth.signOut() called server-side
   ↓
5. Session invalidated and cookies cleared
   ↓
6. Redirect to landing page (/) instead of login
   ↓
7. Client-side fallback ensures proper redirect
```

### Application Data Flow

```
1. User Action (Create/Update/Delete)
   ↓
2. Client Component → Custom Hook
   ↓
3. API Route / Server Action
   ↓
4. Supabase Client (Server-side)
   ↓
5. Database Operation with RLS
   ↓
6. Response with Type Safety
   ↓
7. UI Update + Optimistic Updates
   ↓
8. Real-time Subscription Updates (if applicable)
```

### Real-time Data Synchronization

```
1. Database Change Event
   ↓
2. Supabase Real-time Engine
   ↓
3. WebSocket Connection
   ↓
4. Client Subscription Handler
   ↓
5. State Update (React Query/Zustand)
   ↓
6. UI Re-render with New Data
```

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────┐
│                  Security Layers                            │
├─────────────────────────────────────────────────────────────┤
│  1. Supabase Auth (Email/Password)                         │
│     - JWT token management                                  │
│     - Session persistence                                   │
│     - Automatic token refresh                               │
├─────────────────────────────────────────────────────────────┤
│  2. Next.js Middleware                                      │
│     - Route protection                                      │
│     - Session validation                                    │
│     - Redirect handling                                    │
├─────────────────────────────────────────────────────────────┤
│  3. Row Level Security (RLS)                               │
│     - Database-level access control                         │
│     - User data isolation                                   │
│     - Fine-grained permissions                             │
├─────────────────────────────────────────────────────────────┤
│  4. API Route Security                                      │
│     - Server-side validation                                │
│     - Type-safe requests/responses                          │
│     - Error handling                                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Protection Strategies

- **Input Validation**: Zod schemas for all user inputs
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **XSS Protection**: React's built-in XSS prevention
- **CSRF Protection**: Next.js built-in CSRF protection
- **Secure Headers**: Security headers configuration
- **Environment Security**: Secure environment variable management

## Performance Architecture

### Frontend Performance

```
┌─────────────────────────────────────────────────────────────┐
│                Performance Optimizations                     │
├─────────────────────────────────────────────────────────────┤
│  1. Code Splitting                                           │
│     - Route-based splitting                                 │
│     - Component-level lazy loading                          │
│     - Dynamic imports                                        │
├─────────────────────────────────────────────────────────────┤
│  2. Bundle Optimization                                      │
│     - Tree shaking                                          │
│     - Unused code elimination                               │
│     - 11.7% bundle size reduction achieved                  │
├─────────────────────────────────────────────────────────────┤
│  3. Caching Strategy                                         │
│     - Next.js automatic caching                             │
│     - Supabase client-side caching                          │
│     - Image optimization with Next.js Image                 │
├─────────────────────────────────────────────────────────────┤
│  4. Performance Monitoring                                   │
│     - Vercel Analytics                                      │
│     - Speed Insights                                        │
│     - Core Web Vitals tracking                              │
└─────────────────────────────────────────────────────────────┘
```

### Database Performance

- **Indexing Strategy**: Optimized indexes on frequently queried columns
- **Query Optimization**: Efficient query patterns with proper joins
- **Connection Pooling**: Supabase managed connection pooling
- **Caching Layer**: Supabase edge caching for frequently accessed data

## Design Patterns Implementation

### Repository Pattern

```typescript
// Abstract data access layer
export class ApplicationRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Application | null> {
    const { data } = await this.supabase.from('applications').select('*').eq('id', id).single()

    return data
  }

  async findByUserId(userId: string): Promise<Application[]> {
    const { data } = await this.supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return data || []
  }
}
```

### Service Layer Pattern

```typescript
// Business logic layer
export class ApplicationService {
  constructor(
    private repository: ApplicationRepository,
    private notificationService: NotificationService
  ) {}

  async createApplication(userId: string, data: CreateApplicationData): Promise<Application> {
    // Business logic validation
    if (await this.existsDuplicateApplication(userId, data)) {
      throw new ApplicationError('Duplicate application', 'DUPLICATE_APPLICATION')
    }

    // Create application
    const application = await this.repository.create({
      ...data,
      user_id: userId,
    })

    // Send notification
    await this.notificationService.sendApplicationCreated(application)

    return application
  }
}
```

### Observer Pattern (Real-time Updates)

```typescript
// Real-time subscription management
export class RealtimeManager {
  private subscriptions: Map<string, RealtimeChannel> = new Map()

  subscribeToApplications(userId: string, callback: (application: Application) => void): void {
    const channel = supabase
      .channel(`applications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `user_id=eq.${userId}`,
        },
        payload => callback(payload.new as Application)
      )
      .subscribe()

    this.subscriptions.set(userId, channel)
  }

  unsubscribe(userId: string): void {
    const channel = this.subscriptions.get(userId)
    if (channel) {
      supabase.removeChannel(channel)
      this.subscriptions.delete(userId)
    }
  }
}
```

### Factory Pattern (Component Creation)

```typescript
// Dynamic component creation
export class ComponentFactory {
  static createApplicationCard(
    application: Application,
    actions: ApplicationCardActions
  ): React.ReactElement {
    return React.createElement(ApplicationCard, {
      key: application.id,
      application,
      ...actions,
    })
  }

  static createKanbanColumn(
    status: ApplicationStatus,
    applications: Application[],
    onMove: (id: string, newStatus: ApplicationStatus) => void
  ): React.ReactElement {
    return React.createElement(KanbanColumn, {
      key: status,
      status,
      applications,
      onMove,
    })
  }
}
```

## State Management Architecture

### Client State Management

```typescript
// Custom hook-based state management
export function useApplicationState() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Optimistic updates
  const updateApplicationOptimistically = useCallback(
    (id: string, updates: Partial<Application>) => {
      setApplications(prev => prev.map(app => (app.id === id ? { ...app, ...updates } : app)))
    },
    []
  )

  // Rollback on error
  const rollbackUpdate = useCallback((id: string, originalApplication: Application) => {
    setApplications(prev => prev.map(app => (app.id === id ? originalApplication : app)))
  }, [])

  return {
    applications,
    loading,
    error,
    updateApplicationOptimistically,
    rollbackUpdate,
  }
}
```

### Server State Management

```typescript
// Server Actions for Next.js 15
export async function createApplicationAction(
  formData: FormData
): Promise<ActionResult<Application>> {
  try {
    const userId = await getCurrentUserId()
    const data = createApplicationSchema.parse({
      company: formData.get('company'),
      position: formData.get('position'),
      status: formData.get('status'),
      // ... other fields
    })

    const application = await applicationService.createApplication(userId, data)

    revalidatePath('/dashboard') // Invalidate cache
    return { success: true, data: application }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
```

## Error Handling Architecture

### Global Error Boundaries

```typescript
// React Error Boundary
export class ApplicationErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// Centralized error handling
export class ApiErrorHandler {
  static handleError(error: unknown): ApiResponse<null> {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors,
      }
    }

    if (error instanceof ApplicationError) {
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    // Log unexpected errors
    console.error('Unexpected API error:', error)

    return {
      success: false,
      error: 'Internal server error',
    }
  }
}
```

## Deployment Architecture

### Production Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Platform                           │
├─────────────────────────────────────────────────────────────┤
│  • Automatic deployments from Git                            │
│  • Global CDN distribution                                   │
│  • Edge functions support                                   │
│  • Environment variable management                          │
│  • Analytics and monitoring                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Platform                           │
├─────────────────────────────────────────────────────────────┤
│  • Managed PostgreSQL database                               │
│  • Authentication service                                   │
│  • File storage                                             │
│  • Edge functions                                           │
│  • Real-time subscriptions                                  │
└─────────────────────────────────────────────────────────────┘
```

### Environment Configuration

```typescript
// Environment-specific configuration
const config = {
  development: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    apiBaseUrl: 'http://localhost:3000/api',
    enableDebugMode: true,
  },
  production: {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    apiBaseUrl: 'https://jobhunt.kaitran.ca/api',
    enableDebugMode: false,
  },
}

export const env = config[process.env.NODE_ENV as keyof typeof config]
```

## Monitoring & Observability

### Performance Monitoring

- **Core Web Vitals**: Automatic tracking with Vercel Speed Insights
- **Bundle Analysis**: Regular bundle size monitoring and optimization
- **Database Performance**: Query performance tracking via Supabase
- **API Performance**: Response time monitoring and error rates

### Error Monitoring

```typescript
// Error tracking setup
export function setupErrorMonitoring() {
  if (typeof window !== 'undefined') {
    // Client-side error handling
    window.addEventListener('error', event => {
      console.error('Client Error:', event.error)
      // Send to error reporting service
    })

    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled Promise Rejection:', event.reason)
      // Send to error reporting service
    })
  }
}
```

### Analytics Integration

- **User Analytics**: Privacy-focused usage tracking
- **Feature Adoption**: Feature usage monitoring
- **Performance Metrics**: Application performance tracking
- **Business Metrics**: User engagement and retention

## Scalability Considerations

### Database Scaling

- **Read Replicas**: Planned for high read volume scenarios
- **Connection Pooling**: Supabase managed connection optimization
- **Query Optimization**: Efficient query patterns and indexing
- **Data Archiving**: Strategy for historical data management

### Application Scaling

- **Horizontal Scaling**: Stateless application design supports multiple instances
- **CDN Distribution**: Global content delivery via Vercel Edge Network
- **Caching Strategy**: Multi-layer caching for optimal performance
- **Load Balancing**: Automatic load balancing via Vercel platform

### Future Architecture Enhancements

```
Phase 2 Enhancements (Q4 2025 - Q1 2026):
├── Microservices Architecture
│   ├── Notification Service
│   ├── Analytics Service
│   └── Export Service
├── Advanced Caching
│   ├── Redis Integration
│   └── Application-level Caching
└── API Gateway
    ├── Rate Limiting
    └── Request Transformation

Phase 3 Enhancements (Q2 2026 - Q3 2026):
├── Event-Driven Architecture
│   ├── Message Queues
│   └── Event Sourcing
├── Multi-tenant Support
│   ├── Database Isolation
│   └── Custom Domains
└── Advanced Analytics
    ├── Data Warehouse
    └── Business Intelligence
```

## Security Best Practices

### OWASP Compliance

- **Injection Protection**: Parameterized queries and input validation
- **Authentication Security**: Secure session management and token handling
- **Data Protection**: Encryption at rest and in transit
- **Access Control**: Principle of least privilege with RLS
- **Security Monitoring**: Regular security audits and vulnerability scanning

### Compliance Requirements

- **GDPR Compliance**: Data protection for EU users
- **CCPA Compliance**: Privacy rights for California users
- **Data Retention**: Configurable data retention policies
- **Privacy by Design**: Privacy considerations in all features

## Conclusion

The JobHunt system architecture represents a modern, scalable approach to web application development. By leveraging Next.js 15's App Router, Supabase's comprehensive backend services, and following established design patterns, the system provides:

1. **High Performance**: Optimized bundle size, efficient rendering, and caching strategies
2. **Strong Security**: Multi-layer security with RLS, authentication, and input validation
3. **Excellent Developer Experience**: Type safety, comprehensive testing, and modern tooling
4. **Scalability**: Architecture designed for growth and future enhancements
5. **Maintainability**: Clean code organization and well-documented patterns

This architecture serves as a solid foundation for current functionality while providing the flexibility needed for future feature development and scaling requirements.
