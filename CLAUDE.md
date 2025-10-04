# JobHunt - AI Assistant Development Guidelines

**Security Policies**
> **⚠️ NEVER COMMIT ENVIRONMENT FILES TO GIT**
> Never `git add` or `git commit` any `.env*` files except `.env.example`.

## Project Overview

JobHunt is a job application tracking system built with Next.js 15, TypeScript, Supabase, and Shadcn UI.

**📌 NOTE: This file contains strict development rules for AI assistants ONLY. See README.md for project documentation.**

---

## 🚨 CRITICAL: Code Quality Gates (NON-NEGOTIABLE)

**BEFORE any commit, ALWAYS run and ensure these pass:**
```bash
yarn lint              # ESLint must pass with zero errors/warnings
yarn typecheck         # TypeScript must compile with zero errors
yarn test              # All tests must pass
```

**If quality gates fail, you MUST fix the issues before proceeding. No exceptions.**

**🛑 ABSOLUTELY FORBIDDEN:**
- ❌ **NEVER use `// eslint-disable` or `// eslint-disable-next-line`** - Fix the issue properly
- ❌ **NEVER use `// @ts-ignore` or `// @ts-expect-error`** - Fix type issues correctly
- ❌ **NEVER use `any` types** - Always find or define proper types
- ❌ **NEVER bypass quality gates** - All errors must be resolved, not suppressed

**These bypasses are code smell indicators. If you're tempted to use them, the real issue needs fixing.**

---

## 🧪 Core Development Rules (MANDATORY)

### 1. Test-Driven Development (TDD) - REQUIRED

**ALWAYS write tests BEFORE implementation.**

**TDD Workflow**:
1. 📝 Write failing test
2. ✅ Make test pass with minimal code
3. 🔄 Refactor while keeping tests green
4. 🔁 Repeat for next feature

**Testing Strategy - Test Value, Not Lines:**
- ✅ **MUST TEST**: Business logic (auth, CRUD, validation schemas)
- ✅ **MUST TEST**: Reusable UI components (buttons, forms, cards)
- ✅ **MUST TEST**: Error handling and edge cases
- ❌ **SKIP**: Thin library wrappers (Supabase clients, Next.js middleware)
- ❌ **SKIP**: Pure presentational components without logic
- ❌ **SKIP**: Configuration files

**Test Pattern Examples:**
```typescript
// ✅ Business Logic Tests (applications.test.ts, application.schema.test.ts)
- CRUD operations with proper mocking
- Validation schemas with comprehensive edge cases
- Error handling and data transformation

// ✅ Component Tests (login/page.test.tsx, button.test.tsx)
- Form rendering and user interactions
- All component variants and props
- Accessibility and keyboard navigation
- Loading states and error handling

// ❌ DO NOT Test (unless they contain business logic)
- Supabase client wrappers (thin SDK abstractions)
- Next.js middleware delegation (framework patterns)
- Type definition files (no runtime behavior)
```

### 2. Package Management - STRICT REQUIREMENTS

- **Use latest `yarn` (modern Yarn) ONLY** - no npm, pnpm, or legacy yarn versions
- Lock file: `yarn.lock` must be committed
- Installation: `yarn install` or simply `yarn`
- **NOTE: We use modern Yarn (latest stable), NOT outdated Yarn Classic v1**

### 3. Clean Architecture - MANDATORY

- **Single Responsibility**: Each file/function has one clear purpose
- **Type Safety**: Strict TypeScript, NO `any` types
- **Error Handling**: All operations must handle failures gracefully
- **Proper Typing**: Never bypass TypeScript with `@ts-ignore` - define proper types instead

### 4. TypeScript & ESLint Standards - ENFORCED

**🚨 CRITICAL: Never use `any` types - Always find proper types**

**Quality Standards - NO BYPASSES ALLOWED:**
- Define proper TypeScript interfaces and types for all data structures
- Use strict type checking - resolve all type errors properly
- Import types from libraries or define custom types
- For test mocks, use `Partial<T>`, `Pick<T>`, or proper mock types
- Never suppress ESLint rules - fix the underlying issue

**Common Proper Solutions:**
- **Unused variables** → Add underscore prefix (`_unusedVar`) or remove them
- **Missing properties** → Use proper interfaces with `Partial<T>` or `Pick<T>`
- **Type issues** → Import correct types or define custom interfaces
- **Complex types** → Break down into smaller, manageable type definitions

---

## 🛡️ Quality Standards

### Test Coverage Requirements
- **Business Logic**: 80%+ coverage required
- **Components**: 70%+ coverage required
- **Integration**: Critical paths tested
- **E2E**: Planned for Phase 2

### Code Quality Validation Commands
```bash
# Daily Development (RECOMMENDED)
yarn lint                   # ESLint validation
yarn typecheck              # TypeScript compilation check
yarn test                   # Run all tests
yarn test:watch             # Watch mode for TDD

# Coverage & Build
yarn test:coverage          # Generate coverage report
yarn build                  # Production build verification
```

### Pre-Deployment Checklist
- [ ] Tests passing (`yarn test`) ✅ **CRITICAL**
- [ ] TypeScript compilation clean (`yarn typecheck`) ✅ **CRITICAL**
- [ ] ESLint passing (`yarn lint`) ✅ **CRITICAL**
- [ ] Build successful (`yarn build`) ✅ **CRITICAL**
- [ ] Coverage targets met (`yarn test:coverage`)
- [ ] **NO eslint-disable or @ts-ignore comments in code** ✅ **CRITICAL**

---

## 🗄️ Database & Supabase

### Database Operations Requirements
- **All database calls must be typed** with Supabase generated types
- **All database operations must have error handling**
- **All queries must be tested** with mocked Supabase client
- **Row Level Security (RLS) policies must be respected**

### Supabase Auth Requirements
- **All authenticated routes must verify user session**
- **Use Supabase Auth Helpers for Next.js**
- **Implement proper error handling for auth failures**

---

## 🎨 UI/UX Development with Shadcn UI

### Component Development Rules
1. **Use Shadcn UI components** - Don't reinvent the wheel
2. **Responsive Design** - Mobile-first approach
3. **Accessibility** - WCAG 2.1 AA compliance required
4. **Dark Mode** - Support via Tailwind dark: prefix

### Form Handling with React Hook Form + Zod
- Use Zod schemas for validation
- Implement proper error handling and user feedback
- Type all form data with proper interfaces

---

## 🔄 Development Workflow

### Always Maintain Working State
- **Never break the main branch**
- **Always deployable after each phase**
- **All features must be fully functional when merged**

### Development Process
1. 📋 Check TODO.md for current phase requirements
2. 🧪 Write tests for the feature/component
3. 💻 Implement to make tests pass
4. 🔄 Refactor while keeping tests green
5. ✅ **CRITICAL**: Run `yarn lint && yarn typecheck && yarn test`
6. 📝 Update TODO.md checkboxes
7. 🚀 Deploy to Vercel to verify working state

---

## 🚨 Critical Mistakes to Avoid

### ❌ NEVER DO THESE
1. **Skip quality gates**: Commit without running `yarn lint && yarn typecheck && yarn test`
2. **Skip tests**: Writing implementation before tests
3. **Use wrong package manager**: npm/pnpm instead of yarn
4. **Break working state**: Commit non-functional code
5. **Use `any` types**: Bypass TypeScript safety
6. **Use eslint-disable**: Suppress linting errors instead of fixing them
7. **Use @ts-ignore/@ts-expect-error**: Suppress type errors instead of fixing them
8. **Skip error handling**: Unhandled promise rejections
9. **Hardcode sensitive data**: Use environment variables
10. **Ignore RLS policies**: Direct database access without proper auth

### ✅ ALWAYS DO THESE
1. **Run quality gates**: `yarn lint && yarn typecheck && yarn test` before every commit
2. **Write tests first**: TDD approach for all features
3. **Maintain working state**: Every commit is deployable
4. **Strong typing**: Explicit interfaces and return types - NO bypasses
5. **Fix, don't suppress**: Resolve ESLint and TypeScript errors properly
6. **Handle errors**: Graceful failure with user feedback
7. **Use environment variables**: Never commit secrets
8. **Respect RLS**: All database queries must respect user permissions
9. **Mobile-first design**: Ensure responsive layouts

---

## 📚 Project Documentation References

**For AI Assistants:**
- **TODO.md** - Progressive development checklist (check here for current tasks)
- **README.md** - Project setup, architecture, and documentation (for reference only)

**External Documentation:**
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

---

**Remember: Quality gates are non-negotiable. Run `yarn lint && yarn typecheck && yarn test` before every commit.**

**NEVER use eslint-disable, @ts-ignore, or any types. Fix issues properly.**
