# JobHunt - Code Standards & Development Guidelines

**Document Version:** 1.0
**Last Updated:** October 25, 2025
**Enforcement Level:** Mandatory

## Overview

This document defines the coding standards, patterns, and best practices that all developers must follow when contributing to the JobHunt project. These standards ensure code quality, maintainability, and consistency across the entire codebase.

## 🚨 CRITICAL: Non-Negotiable Standards

### Quality Gates (MUST PASS)

Every commit MUST pass all quality gates:

```bash
bun run lint           # Zero ESLint errors/warnings
bun run typecheck      # Zero TypeScript compilation errors
bun run test           # All tests passing (399 tests)
```

**ABSOLUTELY FORBIDDEN:**

- ❌ `// eslint-disable` or `// eslint-disable-next-line`
- ❌ `// @ts-ignore` or `// @ts-expect-error`
- ❌ `any` types
- ❌ Bypassing quality gates

## TypeScript Standards

### Type Safety Requirements

```typescript
// ✅ CORRECT: Explicit interfaces and types
interface Application {
  id: string
  company: string
  position: string
  status: ApplicationStatus
  createdAt: Date
  updatedAt: Date
}

// ✅ CORRECT: Union types for status values
type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'phone_screen'
  | 'assessment'
  | 'take_home'
  | 'interviewing'
  | 'final_round'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'ghosted'

// ❌ FORBIDDEN: any types
const data: any = response // NEVER DO THIS
```

### Function Signatures

```typescript
// ✅ CORRECT: Explicit return types
async function createApplication(data: CreateApplicationData): Promise<Application> {
  // Implementation
}

// ✅ CORRECT: Generic types with constraints
function createApiResponse<T>(data: T, status: number = 200): ApiResponse<T> {
  return { data, status }
}

// ❌ FORBIDDEN: Implicit any returns
function processData(data) {
  return data.map(item => item.name) // Missing type annotations
}
```

### Error Handling Patterns

```typescript
// ✅ CORRECT: Proper error types and handling
class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message)
    this.name = 'ApplicationError'
  }
}

// ✅ CORRECT: Result pattern for operations
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E }

async function updateApplication(
  id: string,
  data: UpdateApplicationData
): Promise<Result<Application>> {
  try {
    const updated = await supabase.from('applications').update(data).eq('id', id).single()

    if (updated.error) {
      return {
        success: false,
        error: new ApplicationError(updated.error.message, 'UPDATE_FAILED'),
      }
    }

    return { success: true, data: updated.data }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error : new ApplicationError('Unknown error', 'UNKNOWN_ERROR'),
    }
  }
}
```

## React Component Standards

### Component Structure

```typescript
// ✅ CORRECT: Component structure with proper types
interface ApplicationCardProps {
  application: Application;
  onUpdate: (id: string, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function ApplicationCard({
  application,
  onUpdate,
  onDelete,
  className = ''
}: ApplicationCardProps): JSX.Element {
  // Custom hooks at the top
  const [isDeleting, setIsDeleting] = useState(false);
  const { formatDate } = useDateUtils();

  // Event handlers
  const handleStatusChange = useCallback(
    (newStatus: ApplicationStatus) => {
      onUpdate(application.id, newStatus);
    },
    [application.id, onUpdate]
  );

  const handleDelete = useCallback(() => {
    setIsDeleting(true);
    onDelete(application.id);
  }, [application.id, onDelete]);

  // Conditional rendering early returns
  if (isDeleting) {
    return <CardSkeleton />;
  }

  // Main render
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{application.company}</CardTitle>
        <CardDescription>{application.position}</CardDescription>
      </CardHeader>
      <CardContent>
        <StatusSelect
          value={application.status}
          onChange={handleStatusChange}
        />
        <p className="text-sm text-muted-foreground">
          Applied: {formatDate(application.createdAt)}
        </p>
      </CardContent>
    </Card>
  );
}
```

### Custom Hook Patterns

```typescript
// ✅ CORRECT: Custom hook with proper typing
interface UseApplicationsReturn {
  applications: Application[];
  loading: boolean;
  error: string | null;
  createApplication: (data: CreateApplicationData) => Promise<void>;
  updateApplication: (id: string, data: UpdateApplicationData) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useApplications(): UseApplicationsReturn {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, []);

  const createApplication = useCallback(async (data: CreateApplicationData) => {
    try {
      const { data: newApplication, error } = await supabase
        .from('applications')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      setApplications(prev => [newApplication, ...prev]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create application');
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    loading,
    error,
    createApplication,
    updateApplication: /* implementation */,
    deleteApplication: /* implementation */,
    refetch: fetchApplications,
  };
}
```

## Database & API Standards

### Supabase Client Usage

```typescript
// ✅ CORRECT: Typed database operations
import { Database } from '@/lib/types/database.types'

type Application = Database['public']['Tables']['applications']['Row']
type ApplicationInsert = Database['public']['Tables']['applications']['Insert']

export class ApplicationService {
  private supabase = createClient<Database>()

  async getApplications(userId: string): Promise<Application[]> {
    const { data, error } = await this.supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new ApplicationError(
        `Failed to fetch applications: ${error.message}`,
        'FETCH_FAILED',
        500
      )
    }

    return data || []
  }

  async createApplication(data: ApplicationInsert): Promise<Application> {
    const { data: application, error } = await this.supabase
      .from('applications')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new ApplicationError(
        `Failed to create application: ${error.message}`,
        'CREATE_FAILED',
        400
      )
    }

    return application
  }
}
```

### API Route Patterns

```typescript
// ✅ CORRECT: API route with proper error handling
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createApplicationSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  position: z.string().min(1, 'Position is required'),
  status: z.enum([
    'wishlist',
    'applied',
    'phone_screen',
    'assessment',
    'take_home',
    'interviewing',
    'final_round',
    'offered',
    'accepted',
    'rejected',
    'withdrawn',
    'ghosted',
  ]),
  job_url: z.string().url().optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createApplicationSchema.parse(body)

    // Create application
    const { data, error } = await supabase
      .from('applications')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Testing Standards

### Test Structure & Patterns

```typescript
// ✅ CORRECT: Component test structure
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ApplicationCard } from '../ApplicationCard';
import { Application } from '@/lib/types/database.types';

describe('ApplicationCard', () => {
  const mockApplication: Application = {
    id: '1',
    company: 'Tech Corp',
    position: 'Senior Developer',
    status: 'applied',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    job_url: 'https://example.com',
    notes: 'Test notes',
  };

  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render application information correctly', () => {
      render(
        <ApplicationCard
          application={mockApplication}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('Senior Developer')).toBeInTheDocument();
      expect(screen.getByText('Applied: 1/1/2024')).toBeInTheDocument();
    });

    it('should render status select with correct value', () => {
      render(
        <ApplicationCard
          application={mockApplication}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const statusSelect = screen.getByRole('combobox');
      expect(statusSelect).toHaveValue('applied');
    });
  });

  describe('Interactions', () => {
    it('should call onUpdate when status changes', async () => {
      render(
        <ApplicationCard
          application={mockApplication}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const statusSelect = screen.getByRole('combobox');
      fireEvent.change(statusSelect, { target: { value: 'interviewing' } });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith('1', 'interviewing');
      });
    });

    it('should call onDelete when delete button is clicked', async () => {
      render(
        <ApplicationCard
          application={mockApplication}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing job_url gracefully', () => {
      const applicationWithoutUrl = {
        ...mockApplication,
        job_url: null,
      };

      render(
        <ApplicationCard
          application={applicationWithoutUrl}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should handle long notes with truncation', () => {
      const applicationWithLongNotes = {
        ...mockApplication,
        notes: 'A'.repeat(200),
      };

      render(
        <ApplicationCard
          application={applicationWithLongNotes}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
        />
      );

      const notesElement = screen.getByText(/A+/);
      expect(notesElement).toHaveClass('line-clamp-3');
    });
  });
});
```

### Schema Testing

```typescript
// ✅ CORRECT: Schema validation testing
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { applicationFormSchema } from '../application.schema'

describe('applicationFormSchema', () => {
  describe('Valid inputs', () => {
    it('should accept valid application data', () => {
      const validData = {
        company: 'Tech Corp',
        position: 'Senior Developer',
        status: 'applied',
        job_url: 'https://example.com',
        notes: 'Test notes',
      }

      expect(() => applicationFormSchema.parse(validData)).not.toThrow()
    })

    it('should accept data without optional fields', () => {
      const minimalData = {
        company: 'Tech Corp',
        position: 'Senior Developer',
        status: 'wishlist',
      }

      expect(() => applicationFormSchema.parse(minimalData)).not.toThrow()
    })
  })

  describe('Invalid inputs', () => {
    it('should reject empty company name', () => {
      const invalidData = {
        company: '',
        position: 'Developer',
        status: 'applied',
      }

      expect(() => applicationFormSchema.parse(invalidData)).toThrow()
    })

    it('should reject invalid URLs', () => {
      const invalidData = {
        company: 'Tech Corp',
        position: 'Developer',
        status: 'applied',
        job_url: 'not-a-url',
      }

      expect(() => applicationFormSchema.parse(invalidData)).toThrow()
    })

    it('should reject invalid status values', () => {
      const invalidData = {
        company: 'Tech Corp',
        position: 'Developer',
        status: 'invalid-status',
      }

      expect(() => applicationFormSchema.parse(invalidData)).toThrow()
    })
  })
})
```

## File Organization Standards

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Main application
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable components
│   ├── applications/      # Application-specific components
│   ├── landing/          # Landing page components
│   ├── layout/           # Layout components
│   ├── providers/        # React context providers
│   └── ui/               # Base UI components (Shadcn)
├── lib/                  # Utilities and configurations
│   ├── api/             # API client functions
│   ├── design-tokens/   # Design system tokens
│   ├── schemas/         # Zod validation schemas
│   ├── supabase/        # Supabase configurations
│   ├── types/           # TypeScript type definitions
│   └── utils.ts         # Utility functions
└── test/                # Testing utilities
    ├── mocks/           # Mock data and functions
    └── setup.ts         # Test configuration
```

### File Naming Conventions

```typescript
// ✅ CORRECT: Naming conventions
components/
├── applications/
│   ├── ApplicationCard.tsx          # PascalCase for components
│   ├── ApplicationCard.test.tsx     # .test.tsx for test files
│   ├── ApplicationForm.tsx
│   ├── ApplicationForm.test.tsx
│   └── __tests__/                   # __tests__ directory for complex tests
│       ├── ApplicationDetail.test.tsx
│       └── KanbanBoardV2.test.tsx

lib/
├── api/
│   └── applications.ts              # camelCase for modules
├── schemas/
│   ├── application.schema.ts        # .schema.ts for Zod schemas
│   └── __tests__/
│       └── application.schema.test.ts
├── types/
│   └── database.types.ts            # .types.ts for type definitions
└── utils.ts                         # .ts for utility modules
```

## CSS & Styling Standards

### Tailwind CSS Patterns

```typescript
// ✅ CORRECT: Consistent utility usage
<div className="flex items-center justify-between p-4 border rounded-lg">
  <div className="space-y-1">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
  <Button variant="outline" size="sm">
    Action
  </Button>
</div>

// ✅ CORRECT: Responsive design
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Content */}
</div>

// ✅ CORRECT: Dark mode support
<div className="bg-background text-foreground border-border">
  {/* Content */}
</div>
```

### CSS Custom Properties

```css
/* ✅ CORRECT: Design tokens in CSS */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
}
```

## Git & Commit Standards

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(applications): add drag-and-drop status updates

Implement @dnd-kit for Kanban board status changes with proper
error handling and optimistic updates.

Fixes #123
```

```
fix(auth): resolve session validation on page refresh

Update middleware to properly handle session validation and
redirect unauthenticated users to login page.
```

## Performance Standards

### Code Splitting

```typescript
// ✅ CORRECT: Dynamic imports for large components
import dynamic from 'next/dynamic';

const ApplicationDetail = dynamic(
  () => import('./ApplicationDetail'),
  {
    loading: () => <div>Loading...</div>,
    ssr: false, // Client-side only for heavy components
  }
);

// ✅ CORRECT: Lazy loading routes
const Dashboard = lazy(() => import('./dashboard/page'));
```

### Image Optimization

```typescript
// ✅ CORRECT: Next.js Image component
import Image from 'next/image';

<Image
  src="/company-logo.png"
  alt={`${company} logo`}
  width={48}
  height={48}
  className="rounded-lg"
  priority={false}
/>
```

### Bundle Optimization

```typescript
// ✅ CORRECT: Tree-shakeable imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ❌ AVOID: Full library imports
import * as UI from '@/components/ui' // Bad - imports everything
```

## Security Standards

### Input Validation

```typescript
// ✅ CORRECT: Zod schema validation
const createApplicationSchema = z.object({
  company: z.string().min(1, 'Company is required').max(100, 'Company name too long').trim(),
  position: z.string().min(1, 'Position is required').max(100, 'Position title too long').trim(),
  job_url: z.string().url('Invalid URL format').optional().nullable(),
})
```

### Environment Variables

```typescript
// ✅ CORRECT: Secure environment handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### XSS Prevention

```typescript
// ✅ CORRECT: Safe HTML rendering
import { renderToString } from 'react-dom/server';

// Use React's built-in XSS protection
const safeHtml = <div>{userInput}</div>;

// ❌ AVOID: Direct HTML injection
const dangerousHtml = `<div>${userInput}</div>`; // XSS risk
```

## Documentation Standards

### Code Comments

````typescript
// ✅ CORRECT: JSDoc comments for public APIs
/**
 * Creates a new job application
 * @param data - Application data to create
 * @returns Promise resolving to the created application
 * @throws {ApplicationError} When creation fails
 * @example
 * ```typescript
 * const application = await createApplication({
 *   company: 'Tech Corp',
 *   position: 'Developer',
 *   status: 'applied'
 * });
 * ```
 */
export async function createApplication(data: CreateApplicationData): Promise<Application> {
  // Implementation
}

// ✅ CORRECT: Inline comments for complex logic
if (application.status === 'applied' && !application.follow_up_date) {
  // Set follow-up date to 7 days from application date
  // if no follow-up has been scheduled yet
  const followUpDate = new Date(application.created_at)
  followUpDate.setDate(followUpDate.getDate() + 7)

  await updateApplication(application.id, {
    follow_up_date: followUpDate.toISOString(),
  })
}
````

### README Standards

Each component and utility file should include:

- Purpose and functionality
- Props/parameters with types
- Usage examples
- Dependencies and requirements

## Conclusion

These code standards ensure the JobHunt project maintains high quality, security, and maintainability. All developers are expected to follow these standards strictly.

**Remember:** Quality gates are non-negotiable. Every commit must pass linting, type checking, and testing before being merged.

For questions or clarifications about these standards, please refer to the project maintainers or create an issue for discussion.
