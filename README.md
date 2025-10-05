# JobHunt

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)

> **A modern, open-source job application tracking system with beautiful UI and powerful features.**

Track your job applications with an intuitive Kanban board interface. Manage company information, interview stages, and application status all in one place. Built with modern web technologies and best practices.

**[Live Demo](https://jobhunt.kaitran.ca/)** • **[Documentation](./CONTRIBUTING.md)** • **[Report Bug](../../issues)** • **[Request Feature](../../issues)**

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

### Option 1: Docker (Easiest)

```bash
# Clone and setup
git clone https://github.com/kaitranntt/jobhunt.git
cd jobhunt
cp .env.example .env.local

# Edit .env.local with your Supabase credentials

# Run with Docker
docker-compose up -d
```

Visit [http://localhost:3000](http://localhost:3000)

See [DOCKER.md](./DOCKER.md) for detailed Docker instructions.

### Option 2: Local Development

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

### Vercel (Recommended)

```bash
vercel
```

Add environment variables in Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build Docker image
docker build -t jobhunt:latest .
docker run -p 3000:3000 --env-file .env.local jobhunt:latest
```

See [DOCKER.md](./DOCKER.md) for detailed deployment instructions.

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

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Setting up your development environment
- Code quality standards and testing requirements
- Commit message conventions (Conventional Commits enforced)
- CI/CD pipeline and automated quality gates
- Submitting pull requests
- Reporting bugs and requesting features

**Quick start for contributors:**

```bash
# Fork and clone the repo
git clone https://github.com/kaitranntt/jobhunt.git

# Install dependencies
yarn install

# Set up local Supabase
supabase start
supabase db reset

# Run development server
yarn dev
```

## 📖 Documentation

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines and setup
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture overview
- **[DOCKER.md](./DOCKER.md)** - Docker deployment guide
- **[CI/CD](./.github/CICD.md)** - CI/CD pipeline documentation
- **[TODO.md](./TODO.md)** - Development roadmap and progress
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant development guidelines

## 🗺️ Roadmap

See [TODO.md](./TODO.md) for detailed development phases and progress.

**Upcoming features:**

- Advanced filtering and search
- Analytics dashboard
- Email notifications
- Resume management
- Interview preparation tools

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [Shadcn UI](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## 💬 Support

- 📖 [Documentation](./CONTRIBUTING.md)
- 🐛 [Report Issues](../../issues)
- 💡 [Request Features](../../issues)
- ⭐ Star this repo if you find it helpful!

---

**Made with ❤️ for job seekers everywhere**
