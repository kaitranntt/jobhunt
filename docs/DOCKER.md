# Docker Deployment Guide

This guide explains how to run JobHunt using Docker for easy deployment and development.

## Prerequisites

- **Docker** 20.10+ installed
- **Docker Compose** 2.0+ installed
- Supabase account (or local Supabase instance)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Clone the repository**

```bash
git clone https://github.com/kaitranntt/jobhunt.git
cd jobhunt
```

2. **Create environment file**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. **Build and run**

```bash
docker-compose up -d
```

4. **Access the application**

- Application: http://localhost:3000

### Option 2: Using Docker Only

1. **Build the image**

```bash
docker build -t jobhunt:latest .
```

2. **Run the container**

```bash
docker run -d \
  --name jobhunt \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-key \
  -e NEXT_PUBLIC_SITE_URL=http://localhost:3000 \
  jobhunt:latest
```

3. **Access the application**

- Application: http://localhost:3000

## Docker Architecture

### Multi-Stage Build

The Dockerfile uses a multi-stage build for optimization:

1. **deps** - Installs dependencies
2. **builder** - Builds the Next.js application
3. **runner** - Minimal production image

### Image Details

- **Base**: Node.js 20 Alpine (minimal size)
- **User**: Non-root user (nextjs:nodejs)
- **Port**: 3000
- **Health Check**: Built-in health endpoint monitoring

## Configuration

### Environment Variables

Required environment variables:

| Variable                                       | Description              | Example                   |
| ---------------------------------------------- | ------------------------ | ------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | Supabase project URL     | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase publishable key | `sb_publishable_xxx`      |
| `NEXT_PUBLIC_SITE_URL`                         | Application URL          | `http://localhost:3000`   |

### Docker Compose Configuration

The `docker-compose.yml` includes:

- Next.js application service
- Network configuration
- Health checks
- Restart policies
- Optional Supabase local stack (commented out)

## Development with Docker

### Live Development

For development with hot-reload, use Docker Compose with volume mounts:

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: deps # Stop at deps stage for dev
    command: yarn dev
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
```

Run with:

```bash
docker-compose -f docker-compose.dev.yml up
```

### Running Tests in Docker

```bash
# Run tests
docker-compose exec app yarn test

# Run with coverage
docker-compose exec app yarn test:coverage

# Run linting
docker-compose exec app yarn lint

# Type checking
docker-compose exec app yarn typecheck
```

## Production Deployment

### Building for Production

```bash
# Build optimized image
docker build -t jobhunt:v1.0.0 .

# Tag for registry
docker tag jobhunt:v1.0.0 your-registry/jobhunt:v1.0.0

# Push to registry
docker push your-registry/jobhunt:v1.0.0
```

### Running in Production

```bash
docker run -d \
  --name jobhunt-prod \
  -p 3000:3000 \
  --restart unless-stopped \
  --env-file .env.production \
  --health-cmd="node -e \"require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\"" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  jobhunt:v1.0.0
```

## Docker with Supabase Local

To run with local Supabase instance:

1. **Uncomment Supabase services** in `docker-compose.yml`

2. **Start full stack**

```bash
docker-compose up -d
```

3. **Access services**

- Application: http://localhost:3000
- Supabase Studio: http://localhost:3001
- PostgreSQL: localhost:5432

## Troubleshooting

### Container won't start

Check logs:

```bash
docker-compose logs app
```

### Health check failing

Manually check health endpoint:

```bash
docker-compose exec app curl http://localhost:3000/api/health
```

### Build errors

Clear Docker cache and rebuild:

```bash
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### Permission issues

Ensure proper file permissions:

```bash
chmod -R 755 .
```

### Out of memory

Increase Docker memory limit in Docker Desktop settings or add to docker-compose.yml:

```yaml
services:
  app:
    mem_limit: 2g
```

## Performance Optimization

### Image Size

Current optimizations:

- Multi-stage build
- Alpine base image
- Standalone Next.js output
- Minimal dependencies in final image

Typical image size: ~200-300MB

### Build Cache

Speed up builds with BuildKit:

```bash
DOCKER_BUILDKIT=1 docker build -t jobhunt:latest .
```

### Layer Caching

Dependencies are cached in separate layer for faster rebuilds.

## Security Best Practices

1. **Non-root user**: Container runs as `nextjs` user
2. **Read-only filesystem**: Consider adding `--read-only` flag
3. **No secrets in image**: Use environment variables or secrets management
4. **Regular updates**: Keep base image updated
5. **Scan for vulnerabilities**:

```bash
docker scan jobhunt:latest
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t jobhunt:${{ github.sha }} .

      - name: Run tests
        run: |
          docker run jobhunt:${{ github.sha }} yarn test
```

## Monitoring

### Health Checks

The container includes automatic health checks:

- Endpoint: `/api/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

### Logs

View logs:

```bash
# Follow logs
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app

# Export logs
docker-compose logs app > logs.txt
```

## Scaling

### Horizontal Scaling

Run multiple instances:

```bash
docker-compose up -d --scale app=3
```

Add load balancer (nginx example):

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
```

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting)

## Support

For Docker-related issues:

1. Check logs: `docker-compose logs app`
2. Verify environment variables
3. Ensure Supabase is accessible
4. Open an issue on GitHub

---

**Happy Dockerizing! 🐳**
