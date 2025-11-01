# JobHunt Deployment Guide

**Document Version:** 1.2
**Last Updated:** October 31, 2025
**Deployment Platforms:** Vercel, Docker, Netlify

## Overview

This guide provides comprehensive instructions for deploying JobHunt using Vercel and Supabase. JobHunt is designed for modern deployment platforms with support for serverless hosting, containerized deployments, and traditional hosting environments.

## Deployment Architecture

### Production Architecture

- **Frontend:** Next.js 15 application hosted on Vercel
- **Backend:** Supabase (managed PostgreSQL + services)
- **Database:** Supabase PostgreSQL with automatic scaling
- **Storage:** Supabase Storage for file uploads
- **CDN:** Vercel Edge Network for global distribution
- **Monitoring:** Vercel Analytics + comprehensive health monitoring
- **Performance Metrics:** Real-time metrics, reports, and analytics endpoints
- **Health Checks:** Automated health monitoring with detailed diagnostics

### Environment Tiers

- **Development:** Local development with Supabase local
- **Staging:** Preview deployments on Vercel
- **Production:** Optimized production deployment

## Prerequisites

### Required Accounts and Services

- **Vercel Account** (for hosting)
- **Supabase Project** (for backend services)
- **Custom Domain** (optional, for production)
- **SSL Certificate** (managed by Vercel)

### Development Environment

```bash
# Node.js version
node --version  # v22.x or higher

# Package manager
yarn --version  # 4.x or higher

# Supabase CLI
supabase --version  # 1.x or higher
```

## Environment Configuration

### Required Environment Variables

Create `.env.local` for local development and configure in hosting platform:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Local
NEXT_PUBLIC_APP_URL=https://your-domain.com  # Production

# Monitoring (Optional)
VERCEL_ANALYTICS_ID=your_analytics_id
```

### Security Notes

- **NEVER commit environment files** to version control
- **Use different keys** for development and production
- **Rotate keys regularly** following security best practices
- **Monitor key usage** for unauthorized access

## Vercel Deployment (Recommended)

### 1. Project Setup

#### Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import from GitHub repository
4. Configure project settings

#### Build Configuration

```javascript
// vercel.json (optional - auto-configured by Vercel)
{
  "framework": "nextjs",
  "buildCommand": "yarn build",
  "outputDirectory": ".next",
  "installCommand": "yarn install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. Environment Variables Setup

#### In Vercel Dashboard

1. Go to Project Settings → Environment Variables
2. Add required variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-side only)

#### Environment-Specific Values

```bash
# Production Environment
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=prod_anon_key

# Preview Environment (staging)
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=staging_anon_key
```

### 3. Domain Configuration

#### Custom Domain Setup

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records (provided by Vercel)
4. SSL certificate is automatically configured

#### DNS Configuration

```dns
# Example DNS records for your-domain.com
A    @     76.76.21.21     # Vercel's IP
CNAME www  cname.vercel-dns.com.
```

### 4. Deployment Process

#### Automatic Deployment

```bash
# Push to main branch → Automatic production deployment
git push origin main

# Push to feature branch → Automatic preview deployment
git push origin feature-branch
```

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

### 5. Production Optimizations

#### Build Settings

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['@dnd-kit/core', '@dnd-kit/sortable'],
  },
  images: {
    domains: ['your-project.supabase.co'],
  },
}

module.exports = nextConfig
```

#### Performance Optimizations

- **Bundle Analysis:** Regular bundle size monitoring
- **Image Optimization:** Next.js Image component usage
- **Code Splitting:** Dynamic imports for large components
- **CDN Configuration:** Vercel Edge Network utilization

## Docker Deployment

### 1. Docker Configuration

#### Dockerfile

```dockerfile
# Multi-stage build for production optimization
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  jobhunt:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 2. Docker Deployment

#### Build and Run

```bash
# Build Docker image
docker build -t jobhunt:latest .

# Run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f jobhunt

# Scale the service
docker-compose up -d --scale jobhunt=3
```

#### Production Docker Commands

```bash
# Build production image
docker build -t jobhunt:prod --target runner .

# Run with environment file
docker run -d \
  --name jobhunt \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  jobhunt:prod

# Health check
docker exec jobhunt curl http://localhost:3000/api/health
```

## Vercel Advanced Configuration

### 1. Vercel Project Optimization

#### Performance Settings

```javascript
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "yarn build",
  "outputDirectory": ".next",
  "installCommand": "yarn install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "s-maxage=86400" }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

#### Environment-Specific Deployments

```bash
# Production Environment
vercel --prod

# Preview Deployment for Staging
vercel

# Custom Environment
vercel --env staging
```

### 2. Vercel Analytics Integration

#### Analytics Setup

```typescript
// next.config.js
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  analytics: {
    Vercel: {
      beforeSend: event => {
        // Filter or modify analytics events
        return event
      },
    },
  },
}

module.exports = nextConfig
```

#### Custom Analytics Dashboard

```typescript
// src/lib/analytics.ts
import { getAnalytics } from '@vercel/analytics/server'

export async function getPageViews(timeRange: string) {
  const analytics = await getAnalytics()
  return analytics.pageviews.filter(
    view => view.timestamp >= new Date(Date.now() - parseTimeRange(timeRange))
  )
}

export async function getPerformanceMetrics() {
  const analytics = await getAnalytics()
  return analytics.webVitals
}
```

### 3. Vercel Edge Functions

#### Edge Function Configuration

```typescript
// src/app/api/edge-example/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name') || 'World'

  return NextResponse.json({
    message: `Hello ${name} from the edge!`,
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION || 'unknown',
  })
}
```

#### Edge Middleware for Authentication

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Add security headers
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
}
```

## Supabase Configuration

### 1. Supabase Project Setup

#### Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Configure project settings:
   - Database name: `jobhunt`
   - Region: Choose closest to your users
   - Pricing plan: Free tier (sufficient for development)
   - Database password: Generate a strong password

#### Project Configuration

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local project
supabase init

# Link to remote project
supabase link --project-ref your-project-ref

# Start local development
supabase start
```

#### Environment Variables

```bash
# Get project credentials
supabase status

# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
```

### 2. Database Migration

#### Migration Workflow

```bash
# Create new migration
supabase migration new create_applications_table

# Apply migrations to remote
supabase db push

# Generate types
supabase gen types typescript --local > src/lib/database.types.ts

# Reset local database
supabase db reset
```

#### Seed Data

```sql
-- supabase/seed.sql
INSERT INTO profiles (id, email, full_name, created_at)
VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'demo@jobhunt.com', 'Demo User', NOW());

INSERT INTO application_columns (id, name, position, user_id, created_at)
VALUES
  ('123e4567-e89b-12d3-a456-426614174001', 'Applied', 1, '123e4567-e89b-12d3-a456-426614174000', NOW()),
  ('123e4567-e89b-12d3-a456-426614174002', 'Interview', 2, '123e4567-e89b-12d3-a456-426614174000', NOW()),
  ('123e4567-e89b-12d3-a456-426614174003', 'Offer', 3, '123e4567-e89b-12d3-a456-426614174000', NOW());
```

### 3. Database Configuration

#### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Applications policies
CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications" ON applications
  FOR DELETE USING (auth.uid() = user_id);

-- Application columns policies
CREATE POLICY "Users can manage own columns" ON application_columns
  FOR ALL USING (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

#### Storage Setup

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('documents', 'documents', false, 5242880, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Set up storage policies
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
```

### 4. Database Functions

#### Utility Functions

```sql
-- Get user's application statistics
CREATE OR REPLACE FUNCTION get_user_application_stats(user_uuid UUID)
RETURNS TABLE (
  total_applications BIGINT,
  status_counts JSONB,
  latest_application DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_applications,
    jsonb_object_agg(status, status_count) as status_counts,
    MAX(created_at)::DATE as latest_application
  FROM (
    SELECT
      status,
      COUNT(*) as status_count
    FROM applications
    WHERE user_id = user_uuid
    GROUP BY status
  ) status_counts
  CROSS JOIN (SELECT MAX(created_at) FROM applications WHERE user_id = user_uuid) latest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Archive old applications
CREATE OR REPLACE FUNCTION archive_old_applications(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  UPDATE applications
  SET archived = true
  WHERE created_at < NOW() - INTERVAL '1 day' * days_old AND archived = false;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Vercel + Supabase Integration

### 1. Authentication Integration

#### Supabase Auth Configuration

```typescript
// src/lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

#### Client-side Auth

```typescript
// src/lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUp = async (email: string, password: string, metadata?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}
```

### 2. Real-time Subscriptions

#### Real-time Data Sync

```typescript
// src/hooks/useRealtimeApplications.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Application } from '@/types/database'

export function useRealtimeApplications(userId: string) {
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    // Initial fetch
    fetchApplications()

    // Set up real-time subscription
    const subscription = supabase
      .channel('applications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  const fetchApplications = async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setApplications(data)
    }
  }

  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setApplications(prev => [payload.new, ...prev])
        break
      case 'UPDATE':
        setApplications(prev => prev.map(app => (app.id === payload.new.id ? payload.new : app)))
        break
      case 'DELETE':
        setApplications(prev => prev.filter(app => app.id !== payload.old.id))
        break
    }
  }

  return applications
}
```

### 3. File Upload Integration

#### File Upload Handler

```typescript
// src/lib/storage.ts
import { supabase } from '@/lib/supabase/client'

export async function uploadFile(file: File, bucket: string, userId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`
  const filePath = `${bucket}/${fileName}`

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw error
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath)

  return { data, publicUrl }
}

export async function deleteFile(bucket: string, filePath: string) {
  const { error } = await supabase.storage.from(bucket).remove([filePath])

  if (error) {
    throw error
  }
}
```

### 4. Database Helpers

#### Type-safe Database Operations

```typescript
// src/lib/database.ts
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type Application = Database['public']['Tables']['applications']['Row']
type ApplicationInsert = Database['public']['Tables']['applications']['Insert']

export async function getApplications(userId: string): Promise<Application[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}

export async function createApplication(application: ApplicationInsert): Promise<Application> {
  const supabase = createClient()
  const { data, error } = await supabase.from('applications').insert(application).select().single()

  if (error) {
    throw error
  }

  return data
}

export async function updateApplication(
  id: string,
  updates: Partial<Application>
): Promise<Application> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteApplication(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('applications').delete().eq('id', id)

  if (error) {
    throw error
  }
}
```

## Monitoring and Observability

### 1. Health Monitoring

#### Health Check Endpoint

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()

    // Check database connection
    const { error } = await supabase.from('applications').select('count').limit(1)

    if (error) {
      throw new Error('Database connection failed')
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        storage: 'healthy',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
```

### 2. Performance Monitoring

#### Vercel Analytics

```typescript
// next.config.js
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
}
```

#### Custom Monitoring

```typescript
// src/lib/monitoring/performance.ts
export class PerformanceMonitor {
  static trackPageView(path: string) {
    // Track page views
  }

  static trackApiCall(endpoint: string, duration: number) {
    // Track API performance
  }

  static trackError(error: Error, context: string) {
    // Track errors
  }
}
```

### 3. Log Management

#### Structured Logging

```typescript
// src/lib/logging.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        meta,
        timestamp: new Date().toISOString(),
      })
    )
  },

  error: (message: string, error?: Error) => {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        error: error?.stack,
        timestamp: new Date().toISOString(),
      })
    )
  },
}
```

## Security Configuration

### 1. Environment Security

#### Environment Variable Management

```bash
# Use Vercel's encrypted environment variables
# Never expose service role keys to client-side code
# Rotate keys regularly
# Use different keys for each environment
```

#### CORS Configuration

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGIN || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          {
            key: 'Access-Control-Allow-Headers',
            value:
              'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ]
  },
}
```

### 2. Security Headers

#### Security Headers Configuration

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  )

  return response
}
```

## CI/CD Pipeline

### 1. GitHub Actions

#### Workflow Configuration

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run tests
        run: yarn test

      - name: Run linting
        run: yarn lint

      - name: Type check
        run: yarn typecheck

      - name: Build
        run: yarn build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 2. Pre-commit Hooks

#### Husky Configuration

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run quality gates
yarn lint
yarn typecheck
yarn test

# Check build
yarn build
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules yarn.lock
yarn install

# Check TypeScript compilation
yarn typecheck
```

#### 2. Database Connection Issues

```bash
# Check Supabase connection
supabase status

# Test database URL
curl -X POST https://your-project.supabase.co/rest/v1/applications \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

#### 3. Environment Variable Issues

```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Test API connection
curl http://localhost:3000/api/health
```

### Performance Issues

#### 1. Slow Load Times

- Check bundle size: `yarn analyze`
- Optimize images: Use Next.js Image component
- Enable caching: Configure CDN properly
- Monitor database queries: Check Supabase logs

#### 2. Memory Issues

```bash
# Monitor memory usage
docker stats jobhunt

# Check Node.js heap
node --inspect app.js
```

### Deployment Failures

#### 1. Vercel Deployment Issues

```bash
# Check deployment logs
vercel logs

# Redeploy with debug
vercel --prod --debug
```

#### 2. Docker Issues

```bash
# Check container logs
docker logs jobhunt

# Debug container
docker exec -it jobhunt sh
```

## Maintenance

### Regular Tasks

#### Weekly

- Monitor error rates and performance
- Update dependencies
- Review security advisories
- Check resource usage

#### Monthly

- Database performance review
- SSL certificate verification
- Backup verification
- Security audit

#### Quarterly

- Major dependency updates
- Architecture review
- Performance optimization
- Disaster recovery testing

### Backup Strategy

#### Database Backups

- Supabase automatic backups (daily)
- Point-in-time recovery (7 days)
- Export data regularly

#### Application Backups

- Git version control
- Configuration backups
- Environment variable documentation

### Scaling Considerations

#### Horizontal Scaling

- Load balancer configuration
- Container orchestration
- Database read replicas
- CDN optimization

#### Vertical Scaling

- Memory and CPU upgrades
- Database performance tuning
- Storage optimization

## Support

### Documentation Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Documentation](https://docs.docker.com)

### Troubleshooting Contacts

- **Infrastructure Issues:** Vercel support
- **Database Issues:** Supabase support
- **Application Issues:** GitHub Issues

### Emergency Contacts

- **DevOps Lead:** devops@jobhunt.kaitran.ca
- **Technical Lead:** tech-lead@jobhunt.kaitran.ca
- **Product Manager:** pm@jobhunt.kaitran.ca

---

**Last Updated:** October 31, 2025
**Document Version:** 1.2
**Supported Platforms:** Vercel, Docker, Netlify

For the most up-to-date deployment information, visit: https://docs.jobhunt.kaitran.ca/deployment
