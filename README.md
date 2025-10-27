# JobHunt

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-399%20passing-brightgreen.svg)](https://github.com/kaitranntt/jobhunt)
[![Quality](https://img.shields.io/badge/Quality-A%2B-orange.svg)](https://github.com/kaitranntt/jobhunt)

> **A streamlined, modern job application tracking system with beautiful glass-morphism UI.**

Track your job applications with an intuitive Kanban board interface. Built with cutting-edge web technologies, comprehensive testing, and a focus on core functionality that matters most to job seekers.

**[Live Demo](https://jobhunt.kaitran.ca/)** • **[Documentation](./docs/)** • **[Report Bug](https://github.com/kaitranntt/jobhunt/issues)** • **[Request Feature](https://github.com/kaitranntt/jobhunt/issues)**

## ✨ Features

### Core Functionality

- 🔐 **Secure Authentication** - Email/password authentication via Supabase with session management
- 📋 **Application Tracking** - Complete CRUD operations for job applications
- 📊 **Kanban Board** - Intuitive drag-and-drop interface with visual status management
- 🏢 **Company Management** - Track company information and job details
- 🔍 **Search & Filter** - Find applications quickly by company or job title
- 📝 **Rich Notes** - Detailed application notes and metadata tracking

### User Experience

- 📱 **Responsive Design** - Perfect on mobile, tablet, and desktop
- 🎨 **Glass-morphism UI** - Modern macOS-inspired design system
- ✨ **Fluid Animations** - Spring physics for natural interactions
- 🌓 **Dark Mode Support** - Automatic light/dark theme adaptation
- ⚡ **Lightning Fast** - Optimized performance with 11.7% bundle reduction

### Quality Assurance

- 🚫 **Zero Errors** - Clean TypeScript and ESLint compliance
- 🔒 **Production Ready** - Deployed and battle-tested on Vercel
- 📊 **A+ Quality** - Code quality metrics and best practices

## 🛠 Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router and Server Components
- **TypeScript 5** - Strict type safety with zero `any` types
- **React 18** - Modern React with hooks and concurrent features
- **Shadcn UI** - Premium component library built on Radix UI
- **Tailwind CSS 4** - Modern utility-first CSS framework
- **React Hook Form + Zod** - Form validation with type safety
- **@dnd-kit** - Accessible drag-and-drop functionality

### Backend & Database

- **Supabase** - Complete Backend-as-a-Service
  - PostgreSQL database with Row Level Security (RLS)
  - Secure authentication system
  - Real-time subscriptions
  - RESTful API with TypeScript types

### Development & Testing

- **Vitest** - Modern testing framework with UI
- **Testing Library** - Component testing utilities
- **ESLint + Prettier** - Code quality and formatting
- **Husky + lint-staged** - Git hooks and pre-commit checks
- **Yarn (Modern)** - Fast, reliable package management

## 🚀 Quick Start

### Prerequisites

- **Node.js 22+** - Modern JavaScript runtime
- **Yarn (Modern)** - Package manager (version 4.x)
- **Supabase Account** - Free tier sufficient for development

### Option 1: Docker (Recommended for Production)

```bash
# Clone the repository
git clone https://github.com/kaitranntt/jobhunt.git
cd jobhunt

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_key

# Start with Docker Compose
docker-compose up -d
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

### Option 2: Local Development

```bash
# Clone and install dependencies
git clone https://github.com/kaitranntt/jobhunt.git
cd jobhunt
yarn install

# Set up Supabase (choose one method)

# Method A: Link to existing Supabase project
supabase link --project-ref your-project-ref
supabase db push  # Apply database migrations

# Method B: Start local Supabase instance
supabase start    # Starts local development environment
supabase db reset # Applies all migrations to local DB

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase project details

# Start development server
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

### Environment Variables Required

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Server-side only
```

## 🗃 Database Management

Database schema is managed via Supabase CLI migrations in `supabase/migrations/`.

**Essential Commands:**

```bash
# Apply migrations to remote project
supabase db push

# Reset local database and apply all migrations
supabase db reset

# Create new migration file
supabase migration new migration_name

# Generate migration from schema changes
supabase db diff
```

## 🛠 Development

**Core Commands:**

```bash
yarn dev              # Start development server (localhost:3000)
yarn build            # Build for production
yarn test             # Run all tests (399 tests passing)
yarn test:watch       # Watch mode for TDD development
yarn test:coverage    # Generate coverage report
yarn lint             # Run ESLint
yarn lint:fix         # Auto-fix ESLint issues
yarn typecheck        # TypeScript compilation check
yarn format           # Format code with Prettier
```

**Quality Gates (MUST PASS before commit):**

```bash
yarn lint && yarn typecheck && yarn test
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Deploy to Vercel
vercel

# Deploy with custom domain
vercel --prod
```

**Environment Variables in Vercel Dashboard:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Build Docker image manually
docker build -t jobhunt:latest .
docker run -p 3000:3000 --env-file .env.local jobhunt:latest
```

See [DOCKER.md](./DOCKER.md) for detailed deployment instructions.

## 🎨 Design System

**macOS 26 "Liquid Glass"** - A modern glass-morphism design system inspired by Apple's aesthetics.

### Design Features

- **Glass Materials** - Ultra, Light, Medium, Heavy, Frosted variants with realistic blur
- **Semantic Colors** - RGBA-based colors with automatic light/dark mode adaptation
- **Typography Scale** - Responsive type based on 4pt baseline grid
- **Spacing System** - 8pt grid with half-step support
- **Fluid Animations** - Spring physics for natural interactions

### Design Tokens Location

- **Colors**: `/src/lib/design-tokens/colors.ts`
- **Typography**: `/src/lib/design-tokens/typography.ts`
- **Spacing**: `/src/lib/design-tokens/spacing.ts`
- **Global Styles**: `/src/app/globals.css`

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for:

- Development environment setup
- Code quality standards (strict TypeScript, comprehensive testing)
- Commit message conventions (Conventional Commits enforced)
- Quality gates and CI/CD pipeline
- Pull request guidelines
- Bug reporting and feature requests

**Quick Contributor Setup:**

```bash
# Fork and clone repository
git clone https://github.com/kaitranntt/jobhunt.git
cd jobhunt

# Install dependencies
yarn install

# Start local development environment
supabase start
supabase db reset

# Run development server
yarn dev
```

## 📚 Documentation

**Comprehensive Documentation Suite:**

- **[./docs/project-overview-pdr.md](./docs/project-overview-pdr.md)** - Project overview and Product Development Requirements
- **[./docs/system-architecture.md](./docs/system-architecture.md)** - System architecture, design patterns, and technical decisions
- **[./docs/code-standards.md](./docs/code-standards.md)** - Development standards, patterns, and best practices
- **[./docs/codebase-summary.md](./docs/codebase-summary.md)** - Comprehensive codebase analysis and summary
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines and development setup
- **[DOCKER.md](./DOCKER.md)** - Docker deployment instructions

## 🗺️ Project Roadmap

See [TODO.md](./TODO.md) for detailed development phases.

**Planned Enhancements:**

- 📊 **Analytics Dashboard** - Job application success metrics
- 🔍 **Advanced Search** - Enhanced filtering and search capabilities
- 📄 **Export Features** - CSV/PDF export for application data
- 📧 **Email Notifications** - Interview reminders and status updates
- 📱 **Mobile App** - Progressive Web App (PWA) capabilities

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

Built with exceptional open-source technologies:

- [Next.js](https://nextjs.org/) - React framework with App Router
- [Supabase](https://supabase.com/) - Backend-as-a-Service platform
- [Shadcn UI](https://ui.shadcn.com/) - Premium component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives

## 💬 Support & Community

- 📖 **Documentation** - [./docs/](./docs/)
- 🐛 **Report Issues** - [GitHub Issues](https://github.com/kaitranntt/jobhunt/issues)
- 💡 **Request Features** - [GitHub Issues](https://github.com/kaitranntt/jobhunt/issues)
- ⭐ **Star Repository** - Show your support!

---

**Built with ❤️ for job seekers everywhere** 🚀

**Current Status**: ✅ Production Ready | ✅ 399 Tests Passing | ✅ A+ Quality
