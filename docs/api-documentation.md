# JobHunt API Documentation

**Document Version:** 1.1
**Last Updated:** October 31, 2025
**API Version:** v1
**Base URL:** `https://jobhunt.kaitran.ca/api`

## Overview

The JobHunt API provides a comprehensive RESTful interface for managing job applications, user authentication, and system monitoring. Built with Next.js 15 API Routes and Supabase backend, the API follows modern REST principles with proper HTTP status codes, JSON responses, and comprehensive error handling. Recent enhancements include advanced monitoring endpoints, performance metrics collection, and system health reporting capabilities.

## Authentication

### Authentication Overview

JobHunt uses Supabase Auth for secure user authentication. All protected endpoints require a valid JWT token.

### Authentication Methods

**Email/Password Authentication:**

- **Login:** `POST /auth/signin` (via Supabase client)
- **Signup:** `POST /auth/signup` (via Supabase client)
- **Logout:** `POST /auth/signout` (via JobHunt API)

### Token Management

**JWT Tokens:**

- **Access Token:** Short-lived (1 hour) for API requests
- **Refresh Token:** Long-lived (30 days) for token renewal
- **Automatic Refresh:** Handled by Supabase client

**Token Usage:**

```http
Authorization: Bearer <jwt_token>
```

## API Endpoints

### Health Check

#### GET /api/health

Check application health status and dependencies.

**Authentication:** Not required

**Request:**

```http
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-29T12:00:00Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 86400,
  "dependencies": {
    "database": "healthy",
    "supabase": "healthy",
    "storage": "healthy"
  },
  "metrics": {
    "response_time_ms": 45,
    "memory_usage_mb": 128,
    "cpu_usage_percent": 2.5
  }
}
```

**Status Codes:**

- `200 OK`: Service is healthy
- `503 Service Unavailable`: Service is unhealthy

### Performance Metrics

#### GET /api/metrics

Retrieve application performance metrics and usage statistics.

**Authentication:** Not required

**Request:**

```http
GET /api/metrics
```

**Query Parameters:**

- `time_range` (optional): `1h`, `24h`, `7d`, `30d` (default: `24h`)
- `metric_type` (optional): `performance`, `usage`, `errors` (default: `all`)

**Response:**

```json
{
  "timestamp": "2025-10-29T12:00:00Z",
  "time_range": "24h",
  "metrics": {
    "performance": {
      "avg_response_time_ms": 125,
      "p95_response_time_ms": 250,
      "p99_response_time_ms": 400,
      "throughput_rps": 15.2,
      "error_rate_percent": 0.1
    },
    "usage": {
      "total_requests": 1313280,
      "unique_users": 1250,
      "active_users": 320,
      "page_views": 5420
    },
    "errors": {
      "total_errors": 42,
      "error_types": {
        "validation_errors": 15,
        "database_errors": 8,
        "network_errors": 19
      },
      "recent_errors": [
        {
          "timestamp": "2025-10-29T11:45:00Z",
          "type": "validation_error",
          "message": "Invalid email format",
          "endpoint": "/api/applications"
        }
      ]
    }
  }
}
```

**Status Codes:**

- `200 OK`: Metrics retrieved successfully
- `400 Bad Request`: Invalid query parameters

### System Reports

#### GET /api/reports

Generate comprehensive system reports for monitoring and analysis.

**Authentication:** Not required

**Request:**

```http
GET /api/reports
```

**Query Parameters:**

- `report_type` (optional): `daily`, `weekly`, `monthly` (default: `daily`)
- `format` (optional): `json`, `csv` (default: `json`)

**Response:**

```json
{
  "report_id": "rep_20251029_daily",
  "generated_at": "2025-10-29T12:00:00Z",
  "period": {
    "start": "2025-10-28T00:00:00Z",
    "end": "2025-10-29T00:00:00Z"
  },
  "summary": {
    "total_users": 1250,
    "active_users": 320,
    "new_applications": 142,
    "total_applications": 8567,
    "avg_applications_per_user": 6.8
  },
  "performance": {
    "uptime_percentage": 99.95,
    "avg_response_time_ms": 125,
    "error_rate_percent": 0.1,
    "data_throughput_gb": 2.4
  },
  "usage": {
    "top_features": [
      {
        "feature": "application_crud",
        "usage_count": 1250,
        "usage_percentage": 45.2
      },
      {
        "feature": "kanban_board",
        "usage_count": 890,
        "usage_percentage": 32.1
      }
    ],
    "device_breakdown": {
      "desktop": 65.5,
      "mobile": 28.3,
      "tablet": 6.2
    }
  },
  "errors": {
    "total_count": 42,
    "critical_count": 2,
    "trend": "decreasing",
    "top_errors": [
      {
        "error": "Database connection timeout",
        "count": 8,
        "percentage": 19.0
      }
    ]
  }
}
```

**Status Codes:**

- `200 OK`: Report generated successfully
- `400 Bad Request`: Invalid report type or format

### Authentication Endpoints

#### POST /auth/signout

Secure user logout with session cleanup and confirmation.

**Authentication:** Required (valid session)

**Request:**

```http
POST /auth/signout
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**

```json
{
  "logout_all_sessions": false,
  "redirect_to": "/login"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Successfully logged out",
  "timestamp": "2025-10-29T12:00:00Z",
  "redirect_url": "/login",
  "session_ended": true
}
```

**Status Codes:**

- `200 OK`: Logout successful
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: No valid session found
- `500 Internal Server Error\*\*: Server error during logout

## Database API (via Supabase)

The application uses Supabase client for all database operations. Below are the main database entities and their operations.

### Applications Table

**Table:** `applications`
**Description:** Job application records with status tracking

#### Create Application

```typescript
const { data, error } = await supabase
  .from('applications')
  .insert({
    company_name: 'Tech Corp',
    job_title: 'Senior Developer',
    job_description: 'Full-stack development role...',
    status: 'applied',
    application_date: '2025-10-29',
    user_id: user.id,
  })
  .select()
  .single()
```

#### Get Applications

```typescript
const { data, error } = await supabase
  .from('applications')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
```

#### Update Application

```typescript
const { data, error } = await supabase
  .from('applications')
  .update({
    status: 'interviewing',
    notes: 'Phone interview scheduled for next week',
  })
  .eq('id', applicationId)
  .eq('user_id', user.id)
  .select()
  .single()
```

#### Delete Application

```typescript
const { error } = await supabase
  .from('applications')
  .delete()
  .eq('id', applicationId)
  .eq('user_id', user.id)
```

### Companies Table

**Table:** `companies`
**Description:** Company information for job applications

#### Create Company

```typescript
const { data, error } = await supabase
  .from('companies')
  .insert({
    name: 'Tech Corp',
    website: 'https://techcorp.com',
    industry: 'Technology',
    description: 'Leading software company',
    user_id: user.id,
  })
  .select()
  .single()
```

### Profiles Table

**Table:** `profiles`
**Description:** User profile information

#### Get Profile

```typescript
const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
```

#### Update Profile

```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({
    full_name: 'John Doe',
    avatar_url: 'https://example.com/avatar.jpg',
    bio: 'Software developer with 5 years experience',
  })
  .eq('id', user.id)
  .select()
  .single()
```

## Real-time Subscriptions

JobHunt supports real-time data synchronization using Supabase subscriptions.

### Application Status Updates

```typescript
const subscription = supabase
  .channel('application_changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'applications',
      filter: `user_id=eq.${user.id}`,
    },
    payload => {
      console.log('Application changed:', payload.new)
      // Update local state
    }
  )
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

### New Applications

```typescript
const subscription = supabase
  .channel('new_applications')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'applications',
      filter: `user_id=eq.${user.id}`,
    },
    payload => {
      console.log('New application:', payload.new)
      // Add to local state
    }
  )
  .subscribe()
```

## Error Handling

### Error Response Format

All API endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    },
    "timestamp": "2025-10-29T12:00:00Z",
    "request_id": "req_123456789"
  }
}
```

### Common Error Codes

| Code                  | Description             | HTTP Status |
| --------------------- | ----------------------- | ----------- |
| `VALIDATION_ERROR`    | Invalid request data    | 400         |
| `UNAUTHORIZED`        | Authentication required | 401         |
| `FORBIDDEN`           | Access denied           | 403         |
| `NOT_FOUND`           | Resource not found      | 404         |
| `RATE_LIMITED`        | Too many requests       | 429         |
| `INTERNAL_ERROR`      | Server error            | 500         |
| `SERVICE_UNAVAILABLE` | Service down            | 503         |

### Client-Side Error Handling

```typescript
try {
  const { data, error } = await supabase.from('applications').select('*').eq('user_id', user.id)

  if (error) throw error

  return data
} catch (error) {
  console.error('API Error:', error)

  // Handle specific error types
  if (error.code === 'PGRST116') {
    // Row not found
    return []
  }

  if (error.code === 'PGRST301') {
    // Relation doesn't exist
    throw new Error('Invalid query')
  }

  // Generic error handling
  throw new Error('Failed to fetch applications')
}
```

## Rate Limiting

### Rate Limiting Policy

- **Public Endpoints:** 100 requests per minute
- **Authenticated Endpoints:** 1000 requests per minute
- **Admin Endpoints:** 5000 requests per minute

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1698566400
```

### Rate Limit Response (429)

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "details": {
      "limit": 1000,
      "reset_time": "2025-10-29T12:01:00Z",
      "retry_after": 60
    }
  }
}
```

## Caching Strategy

### Client-Side Caching

- **GET Requests:** Cached for 5 minutes by default
- **POST/PUT/DELETE:** Invalidate relevant caches
- **ETags:** Support for conditional requests

### Cache Headers

```http
Cache-Control: public, max-age=300
ETag: "abc123"
Last-Modified: Wed, 29 Oct 2025 12:00:00 GMT
```

## Security

### Security Headers

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### CORS Configuration

```http
Access-Control-Allow-Origin: https://jobhunt.kaitran.ca
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Monitoring & Logging

### Request Logging

All API requests are logged with:

- Request ID for tracking
- User ID (if authenticated)
- Endpoint and method
- Response time and status code
- Error details (if applicable)

### Performance Monitoring

- **Response Time Tracking:** All endpoints monitored
- **Error Rate Monitoring:** Real-time error tracking
- **Usage Analytics:** API usage patterns
- **Health Checks:** Continuous service monitoring

## SDK and Client Libraries

### JavaScript/TypeScript Client

```typescript
import { createJobHuntClient } from '@/lib/api'

const client = createJobHuntClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_KEY,
})

// Use the client
const applications = await client.applications.list()
const newApp = await client.applications.create({
  company_name: 'Tech Corp',
  job_title: 'Developer',
})
```

### React Hooks

```typescript
import { useApplications, useCreateApplication } from '@/hooks/api'

function ApplicationList() {
  const { data: applications, loading, error } = useApplications()
  const createApplication = useCreateApplication()

  const handleSubmit = async data => {
    await createApplication.mutateAsync(data)
  }

  // Render logic
}
```

## Testing

### API Testing

The API includes comprehensive test coverage:

```typescript
// Example API test
describe('API Health Check', () => {
  it('should return healthy status', async () => {
    const response = await fetch('/api/health')
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
  })
})
```

### Integration Testing

```typescript
// Database integration test
describe('Applications API', () => {
  it('should create and retrieve application', async () => {
    const { data: created } = await supabase
      .from('applications')
      .insert(mockApplication)
      .select()
      .single()

    expect(created).toBeDefined()

    const { data: retrieved } = await supabase
      .from('applications')
      .select('*')
      .eq('id', created.id)
      .single()

    expect(retrieved.id).toBe(created.id)
  })
})
```

## API Versioning

### Version Strategy

- **Current Version:** v1
- **Versioning Method:** URL path versioning (`/api/v1/`)
- **Backward Compatibility:** Maintained for minor versions
- **Deprecation Notice:** 3 months advance notice

### Version Migration

```typescript
// v1 API (current)
GET / api / applications

// Future v2 API (backward compatible changes)
GET / api / v2 / applications
```

## Changelog

### v1.0.0 (October 29, 2025)

- Initial API release
- Authentication endpoints
- Application CRUD operations
- Health monitoring endpoints
- Real-time subscriptions
- Comprehensive error handling

### Planned Features

- Email notification endpoints
- Analytics and reporting API
- Export functionality
- Advanced search API
- File upload endpoints

## Support

### Documentation

- **API Reference:** This document
- **SDK Documentation:** See `/docs/`
- **Example Applications:** GitHub repository
- **Postman Collection:** Available on request

### Support Channels

- **Issues:** GitHub Issues
- **Email:** support@jobhunt.kaitran.ca
- **Discord:** Community server
- **Status Page:** status.jobhunt.kaitran.ca

### Contact Information

- **API Team:** api-team@jobhunt.kaitran.ca
- **Technical Lead:** tech-lead@jobhunt.kaitran.ca
- **Product Manager:** pm@jobhunt.kaitran.ca

---

**Last Updated:** October 29, 2025
**Document Version:** 1.0
**API Version:** v1.0.0

For the most up-to-date API documentation, visit: https://docs.jobhunt.kaitran.ca/api
