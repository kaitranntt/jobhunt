# Contributing to JobHunt

Thank you for your interest in contributing to JobHunt! This guide will help you get started.

## 🤝 How to Contribute

We welcome contributions of all kinds:

- 🐛 **Bug reports** - Found a bug? Let us know!
- ✨ **Feature requests** - Have an idea? Share it!
- 📝 **Documentation** - Help improve our docs
- 💻 **Code contributions** - Fix bugs or add features
- 🎨 **Design improvements** - Enhance the UI/UX

## 🚀 Getting Started

### Prerequisites

**Choose one setup method:**

**Option A: Docker (Easiest)**

- **Docker** 20.10+ and **Docker Compose** 2.0+
- **Git** for version control

**Option B: Local Development**

- **Node.js** 20+ (check `.nvmrc` for exact version)
- **Bun** - Latest version
- **Supabase CLI** - [Installation guide](https://supabase.com/docs/guides/cli)
- **Git** for version control

### Initial Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/kaitranntt/jobhunt.git
cd jobhunt
```

2. **Choose your setup method**

**Method A: Docker (Quick Start)**

```bash
# Copy environment file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials

# Start with Docker
docker-compose up -d

# Access at http://localhost:3000
```

See [DOCKER.md](./DOCKER.md) for detailed Docker instructions.

**Method B: Local Development**

```bash
# Install dependencies
bun install
```

3. **Set up Supabase (Local Development only)**

Choose one of these options:

**Option A: Local Development (Recommended for contributors)**

```bash
# Start local Supabase instance (requires Docker)
supabase start

# Apply database migrations
supabase db reset

# Copy the output credentials to .env.local
```

**Option B: Link to existing Supabase project**

```bash
supabase link --project-ref your-project-ref
supabase db push
```

4. **Configure environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`

5. **Run the development server**

```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## 🧪 Development Workflow

### Quality Gates (REQUIRED)

**Before every commit, run:**

```bash
bun run lint && bun run typecheck && bun run test
```

All three must pass with zero errors. No exceptions.

### Test-Driven Development (TDD)

We follow TDD practices:

1. 📝 Write a failing test first
2. ✅ Write minimal code to make it pass
3. 🔄 Refactor while keeping tests green
4. 🔁 Repeat

**Test commands:**

```bash
bun run test              # Run all tests
bun run test:watch        # Watch mode for TDD
bun run test:coverage     # Generate coverage report
```

### Code Quality Standards

**🚨 ABSOLUTELY FORBIDDEN:**

- ❌ `// eslint-disable` or `// eslint-disable-next-line`
- ❌ `// @ts-ignore` or `// @ts-expect-error`
- ❌ `any` types
- ❌ Bypassing quality gates

**✅ ALWAYS DO:**

- Define proper TypeScript types
- Handle errors gracefully
- Write tests for new features
- Follow existing code patterns
- Keep commits focused and atomic

### Development Commands

```bash
bun run dev              # Start development server
bun run build            # Build for production
bun run lint             # Run ESLint
bun run lint:fix         # Auto-fix ESLint issues
bun run typecheck        # TypeScript validation
bun run test             # Run tests
bun run test:watch       # Watch mode
bun run test:coverage    # Coverage report
bun run format           # Format code with Prettier
bun run format:check     # Check formatting
```

## 📝 Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

### 2. Make Your Changes

- Follow the existing code style
- Write/update tests for your changes
- Update documentation if needed
- Keep commits small and focused

### 3. Test Your Changes

```bash
# Run quality gates
bun run lint && bun run typecheck && bun run test

# Test the build
bun run build

# Manual testing
bun run dev
```

### 4. Commit Your Changes

**We enforce strict commit message standards with automated validation.**

Write clear, descriptive commit messages following [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add drag-and-drop to kanban board"
git commit -m "fix: resolve authentication redirect loop"
git commit -m "docs: update setup instructions"
```

**Commit Message Format:**

```
<type>: <subject>

[optional body]

[optional footer]
```

**Required Types:**

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style (formatting, etc.)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Test changes
- `build:` - Build system changes
- `ci:` - CI/CD changes
- `chore:` - Other changes (deps, config)
- `revert:` - Revert previous commit

**Commit Message Rules:**

- Subject line max 100 characters
- Use lowercase for type
- No period at end of subject
- Use imperative mood ("add" not "added")
- Body and footer separated by blank line

**Pre-commit Hooks:**

When you commit, automated hooks will:

1. ✅ Lint and format staged files
2. ✅ Run ESLint validation
3. ✅ Run TypeScript type checking
4. ✅ Run all tests
5. ✅ Validate commit message format

If any check fails, the commit will be rejected. Fix the issues and try again.

### 5. Push and Create Pull Request

```bash
git push origin your-branch-name
```

**Automated CI/CD Pipeline:**

When you push or create a PR, GitHub Actions automatically runs:

- ✅ **Quality Gates**: ESLint, TypeScript, Tests
- ✅ **Commit Lint**: Validates all commit messages
- ✅ **Docker Build**: Ensures Docker image builds successfully
- ✅ **Coverage Report**: Generates test coverage (uploaded to Codecov)

All checks must pass before your PR can be merged.

**Creating a Pull Request:**

Use the PR template and include:

- Clear title describing the change
- Description of what changed and why
- Reference any related issues
- Screenshots/videos for UI changes
- Checked all quality checkboxes

## 🗄️ Database Changes

### Creating Migrations

```bash
# Create a new migration
supabase migration new descriptive_name

# Edit the migration file in supabase/migrations/

# Test locally
supabase db reset

# Verify changes
supabase db diff
```

**Migration Guidelines:**

- Always include both `up` and `down` migrations
- Test migrations locally before submitting
- Include RLS policies for new tables
- Document complex migrations

## 🎨 UI/UX Contributions

We use:

- **Shadcn UI** for components
- **Tailwind CSS** for styling
- **macOS 26 "Liquid Glass"** design system

**Design Guidelines:**

- Mobile-first responsive design
- WCAG 2.1 AA accessibility compliance
- Support light and dark modes
- Use existing design tokens (`src/lib/design-tokens/`)
- Follow spring physics animation patterns

## 🐛 Reporting Bugs

**Before submitting a bug report:**

1. Check if the bug has already been reported
2. Try to reproduce it on the latest version
3. Gather relevant information

**Include in your bug report:**

- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/videos if applicable
- Environment details (OS, browser, Node version)
- Error messages or console logs

## 💡 Feature Requests

**Before submitting a feature request:**

1. Check if it's already been requested
2. Consider if it fits the project's scope
3. Think about implementation details

**Include in your feature request:**

- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Mockups/examples if applicable

## 📚 Documentation

Documentation improvements are always welcome!

**Areas to contribute:**

- README improvements
- Code comments
- API documentation
- Tutorial content
- Architecture diagrams

## 🔒 Security

**Found a security vulnerability?**

Please **DO NOT** open a public issue. Instead:

1. Email the maintainer directly (see package.json)
2. Include detailed description
3. Provide steps to reproduce
4. Suggest a fix if possible

## 📜 Code of Conduct

This project follows a Code of Conduct. By participating, you agree to uphold this code. Please report unacceptable behavior to the project maintainers.

## ❓ Questions?

- 📖 Check the [README](./README.md) for project overview
- 🏗️ See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- 💬 Open a GitHub Discussion for questions
- 🐛 Open an issue for bugs

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

---

**Happy coding! 🚀**
