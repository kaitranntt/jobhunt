# JobHunt - Code Standards and Implementation Guidelines

**Document Version:** 1.0
**Last Updated:** 2025-10-25
**Status:** Active Standards

## Overview

This document defines the coding standards, architectural patterns, and implementation guidelines for the JobHunt project. All contributors must follow these standards to ensure code quality, consistency, and maintainability.

## Core Principles

### Quality First

- **Test-Driven Development (TDD)** is mandatory for all new features
- **No bypasses allowed** - Never use eslint-disable, @ts-ignore, or any types
- **Type safety** is non-negotiable - All code must be strongly typed
- **Zero tolerance** for warnings or errors in quality gates

### Clarity and Simplicity

- **Single responsibility** for functions and components
- **Self-documenting code** with clear naming conventions
- **Consistent patterns** across the entire codebase
- **Progressive disclosure** - Simple before complex

### Performance and Accessibility

- **Mobile-first responsive design** for all components
- **Accessibility by default** (WCAG 2.1 AA compliance)
- **Performance optimization** in all implementations
- **User experience** prioritized in technical decisions

## Technology Standards

### Package Management

```bash
# Use modern Yarn ONLY - never npm, pnpm, or legacy yarn
yarn install          # Install dependencies
yarn add <package>    # Add new dependency
yarn remove <package> # Remove dependency
yarn <command>        # Run any script
```

### TypeScript Standards

#### Strict Type Safety

```typescript
// ✅ GOOD - Explicit types
interface User {
  id: string
  email: string
  createdAt: Date
}

const createUser = (data: CreateUserRequest): User => {
  // Implementation
}

// ❌ BAD - Any types or bypasses
const createUser = (data: any): any => {
  // @ts-ignore - NEVER DO THIS
  return data as User
}
```

#### Interface Definitions

```typescript
// ✅ GOOD - Proper interface organization
interface Application {
  readonly id: string
  readonly userId: string
  position: string
  status: ApplicationStatus
  salaryRange?: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

type ApplicationStatus = 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected'

// Request/Response types
interface CreateApplicationRequest {
  position: string
  status: ApplicationStatus
  salaryRange?: string
}

interface ApplicationResponse extends Application {
  company: Company
}
```

#### Generic Types and Utilities

```typescript
// ✅ GOOD - Proper generic usage
interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

const createResponse = <T>(data: T): ApiResponse<T> => ({
  data,
  success: true,
})

// ✅ GOOD - Utility types for partial updates
type UpdateApplicationRequest = Partial<
  Pick<Application, 'position' | 'status' | 'salaryRange' | 'notes'>
>
```

### React Component Standards

#### Component Structure

```typescript
// ✅ GOOD - Clean component structure
interface ApplicationCardProps {
  application: Application;
  onUpdate: (id: string, updates: UpdateApplicationRequest) => void;
  onDelete: (id: string) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onUpdate,
  onDelete
}) => {
  // Hooks first
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Event handlers
  const handleUpdate = useCallback((updates: UpdateApplicationRequest) => {
    onUpdate(application.id, updates);
    setIsEditing(false);
    toast({ title: "Application updated" });
  }, [application.id, onUpdate, toast]);

  // Render logic
  return (
    <Card className="application-card">
      {/* Component JSX */}
    </Card>
  );
};

export default ApplicationCard;
```

#### Server Components

```typescript
// ✅ GOOD - Server component for data fetching
interface DashboardPageProps {
  searchParams: { status?: ApplicationStatus };
}

const DashboardPage: React.FC<DashboardPageProps> = async ({ searchParams }) => {
  const supabase = createClient();
  const { data: applications } = await supabase
    .from('applications')
    .select('*, companies(*)')
    .eq('status', searchParams.status || 'applied');

  return <KanbanBoard applications={applications} />;
};
```

### Form Handling Standards

#### React Hook Form + Zod Integration

```typescript
// ✅ GOOD - Proper form schema and validation
const applicationSchema = z.object({
  position: z.string().min(1, "Position is required"),
  companyId: z.string().uuid("Invalid company"),
  status: applicationStatusEnum.default('wishlist'),
  salaryRange: z.string().optional(),
  notes: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

const ApplicationForm: React.FC = () => {
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      position: '',
      companyId: '',
      status: 'wishlist',
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      await createApplication(data);
      toast({ title: "Application created successfully" });
      form.reset();
    } catch (error) {
      toast({
        title: "Error creating application",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
};
```

### Database Standards

#### Supabase Client Configuration

```typescript
// ✅ GOOD - Proper client setup
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

// Type-safe database operations
const getApplications = async (userId: string): Promise<Application[]> => {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('applications')
    .select('*, companies(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch applications: ${error.message}`)
  return data || []
}
```

#### Row Level Security Patterns

```sql
-- ✅ GOOD - Proper RLS policies
CREATE POLICY "Users can view their own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own applications"
  ON applications FOR DELETE
  USING (auth.uid() = user_id);
```

### Testing Standards

#### Test Structure

```typescript
// ✅ GOOD - Comprehensive test coverage
describe('ApplicationForm', () => {
  const mockProps = {
    application: mockApplication,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders application information correctly', () => {
      render(<ApplicationCard {...mockProps} />);

      expect(screen.getByText(mockApplication.position)).toBeInTheDocument();
      expect(screen.getByText(mockApplication.company.name)).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onUpdate when status is changed', async () => {
      const user = userEvent.setup();
      render(<ApplicationCard {...mockProps} />);

      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      await user.click(statusSelect);
      await user.click(screen.getByText('Interview'));

      expect(mockProps.onUpdate).toHaveBeenCalledWith(
        mockApplication.id,
        { status: 'interview' }
      );
    });
  });

  describe('Accessibility', () => {
    it('is keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<ApplicationCard {...mockProps} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      editButton.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
```

#### Business Logic Testing

```typescript
// ✅ GOOD - Pure function testing
describe('Application Utilities', () => {
  describe('calculateApplicationStats', () => {
    it('calculates correct statistics', () => {
      const applications = [
        { status: 'applied' as const },
        { status: 'interview' as const },
        { status: 'interview' as const },
        { status: 'offer' as const },
      ]

      const stats = calculateApplicationStats(applications)

      expect(stats).toEqual({
        total: 4,
        applied: 1,
        interview: 2,
        offer: 1,
        wishlist: 0,
        rejected: 0,
      })
    })
  })
})
```

### API Route Standards

#### Route Handlers

```typescript
// ✅ GOOD - Proper API route structure
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { applicationSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ApplicationStatus | null

    let query = supabase.from('applications').select('*, companies(*)').eq('user_id', user.id)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = applicationSchema.parse(body)

    const { data, error } = await supabase
      .from('applications')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Error Handling Standards

#### Consistent Error Patterns

```typescript
// ✅ GOOD - Proper error handling
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

class ValidationError extends ApplicationError {
  constructor(
    message: string,
    public readonly details?: any
  ) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

// Usage in services
const createApplication = async (data: CreateApplicationRequest): Promise<Application> => {
  try {
    const validatedData = applicationSchema.parse(data)

    const supabase = createClient()
    const { data: result, error } = await supabase
      .from('applications')
      .insert(validatedData)
      .select()
      .single()

    if (error) {
      throw new ApplicationError(
        `Failed to create application: ${error.message}`,
        'DATABASE_ERROR',
        500
      )
    }

    return result
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid application data', error.errors)
    }
    throw error
  }
}
```

### CSS and Styling Standards

#### Tailwind CSS Patterns

```tsx
// ✅ GOOD - Consistent styling patterns
const ApplicationCard = ({ application }: { application: Application }) => {
  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate text-lg font-semibold">{application.position}</CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              {application.company.name}
            </CardDescription>
          </div>

          <Badge variant={getStatusVariant(application.status)} className="ml-2 shrink-0">
            {application.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          {application.salaryRange && (
            <p className="text-sm text-muted-foreground">💰 {application.salaryRange}</p>
          )}

          {application.location && (
            <p className="text-sm text-muted-foreground">📍 {application.location}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

#### Design Token Usage

```typescript
// ✅ GOOD - Using design tokens
import { colors } from '@/lib/design-tokens/colors'
import { typography } from '@/lib/design-tokens/typography'

const getStatusVariant = (
  status: ApplicationStatus
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants = {
    wishlist: 'outline',
    applied: 'default',
    interview: 'secondary',
    offer: 'default',
    rejected: 'destructive',
  }

  return variants[status]
}
```

## Quality Gates

### Pre-commit Requirements

```bash
# Must pass before any commit
yarn lint              # ESLint: Zero errors/warnings
yarn typecheck         # TypeScript: Zero compilation errors
yarn test              # Tests: All tests passing
```

### Additional Validation

```bash
# Recommended during development
yarn test:watch        # Watch mode for TDD
yarn test:coverage     # Coverage report generation
yarn build             # Production build verification
```

### Forbidden Patterns

```typescript
// ❌ NEVER DO THESE
const data: any = response.data // Any types
// eslint-disable-next-line                        // ESLint bypass
// @ts-ignore                                     // TypeScript bypass
const user = data as User as any // Type casting abuse

// ✅ INSTEAD DO THIS
interface ApiResponse {
  data: User[]
  success: boolean
}

const response: ApiResponse = await fetch('/api/users')
const users: User[] = response.data
```

## File Organization

### Directory Structure Standards

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route groups
│   ├── (dashboard)/       # Protected routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Shadcn UI base components
│   ├── applications/     # Feature-specific components
│   ├── contacts/         # Contact management
│   ├── documents/        # Document handling
│   └── layout/           # Layout components
├── lib/                   # Utilities and configurations
│   ├── design-tokens/    # Design system
│   ├── supabase/         # Database clients
│   ├── validations/      # Zod schemas
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript definitions
└── hooks/                 # Custom React hooks
```

### Naming Conventions

#### Files and Folders

- **Components:** PascalCase (`ApplicationCard.tsx`)
- **Utilities:** camelCase (`applicationUtils.ts`)
- **Types:** camelCase (`applicationTypes.ts`)
- **Hooks:** camelCase with `use` prefix (`useApplications.ts`)
- **Constants:** UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

#### Variables and Functions

```typescript
// ✅ GOOD naming conventions
const isLoading = false
const applicationList: Application[] = []
const handleSubmit = () => {}
const createApplication = async (data: CreateApplicationRequest) => {}
```

## Security Standards

### Data Protection

```typescript
// ✅ GOOD - Secure data handling
const secureFetch = async (endpoint: string) => {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`/api${endpoint}`, {
    headers: {
      Authorization: `Bearer ${user.id}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.statusText}`)
  }

  return response.json()
}
```

### Input Validation

```typescript
// ✅ GOOD - Comprehensive validation
const secureCreateApplication = async (data: unknown) => {
  // Validate input schema
  const validatedData = applicationSchema.parse(data)

  // Sanitize and validate fields
  const sanitizedData = {
    ...validatedData,
    position: sanitizeHtml(validatedData.position),
    notes: validatedData.notes ? sanitizeHtml(validatedData.notes) : null,
  }

  // Database operation with error handling
  return await createApplication(sanitizedData)
}
```

## Performance Standards

### Optimization Requirements

```typescript
// ✅ GOOD - Performance optimizations
const ApplicationList = React.memo(({ applications }: { applications: Application[] }) => {
  const filteredApplications = useMemo(() => {
    return applications.filter(app => app.status !== 'archived');
  }, [applications]);

  return (
    <div className="space-y-4">
      {filteredApplications.map(application => (
        <ApplicationCard
          key={application.id}
          application={application}
        />
      ))}
    </div>
  );
});
```

### Image and Asset Optimization

```tsx
// ✅ GOOD - Next.js Image optimization
import Image from 'next/image'

const CompanyLogo = ({ company }: { company: Company }) => {
  return (
    <Image
      src={company.logo || '/default-company.png'}
      alt={`${company.name} logo`}
      width={48}
      height={48}
      className="rounded-lg object-cover"
      priority={company.isFeatured}
    />
  )
}
```

## Conclusion

These code standards ensure the JobHunt project maintains high quality, security, and performance standards. All contributors must follow these guidelines to ensure consistency and maintainability of the codebase.

Regular reviews and updates to these standards will be performed as the project evolves and new best practices emerge.

---

**Document Review Date:** 2025-12-25
**Standards Owner:** Development Team
**Approval Status:** Active
