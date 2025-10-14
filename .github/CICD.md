# CI/CD Documentation

This document explains the Continuous Integration and Continuous Deployment pipeline for JobHunt.

## Overview

JobHunt uses GitHub Actions for automated testing, validation, and deployment. Our CI/CD pipeline enforces strict quality gates to maintain code quality and reliability.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

#### Quality Gates

Runs on every push and PR:

```yaml
- ESLint validation (zero errors/warnings)
- TypeScript type checking (zero errors)
- All tests passing
- Test coverage report (optional Codecov upload)
- Production build verification
```

**Node.js Version:** 20.x

**Timeout:** 10 minutes

#### Commit Lint

Validates commit messages on PRs:

```yaml
- Validates all commits in the PR
- Ensures Conventional Commits format
- Blocks merge if commit messages invalid
```

**Runs:** Only on pull requests

**Timeout:** 5 minutes

#### Docker Build

Tests Docker image build:

```yaml
- Builds Docker image
- Caches layers for performance
- Ensures Dockerfile is valid
```

**Timeout:** 15 minutes

#### All Checks Passed

Final gate that:

- Waits for all jobs to complete
- Fails if any job failed
- Required for PR merge

### 2. Deploy Workflow (`deploy.yml`)

**Triggers:**

- Push to `main` branch
- Manual workflow dispatch

**Process:**

1. Run quality gates (lint, typecheck, test)
2. Deploy to Vercel production
3. Post-deployment notification

**Requirements:**

Vercel secrets must be configured:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Timeout:** 10 minutes

## Local Quality Enforcement

### Pre-commit Hooks (Husky)

**Installed:** Automatically via `yarn install`

**Hooks:**

#### `.husky/pre-commit`

Runs before every commit:

1. **Lint-staged**: Auto-fix and format changed files
2. **ESLint**: Validate all code
3. **TypeScript**: Type checking
4. **Tests**: Run test suite

If any step fails, commit is blocked.

#### `.husky/commit-msg`

Validates commit message format:

- Enforces Conventional Commits
- Checks message structure
- Validates commit type
- Ensures subject line length

### Lint-staged Configuration

Auto-fixes and formats staged files:

```json
{
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

## Commit Message Standards

### Format

```
<type>: <subject>

[optional body]

[optional footer]
```

### Required Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test changes
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes
- `revert`: Revert previous commit

### Rules

- Subject line max 100 characters
- Use lowercase for type
- No period at end of subject
- Use imperative mood ("add" not "added")
- Body and footer separated by blank line

### Examples

```bash
# Good
feat: add drag-and-drop to kanban board
fix: resolve authentication redirect loop
docs: update setup instructions

# Bad
Add feature      # Missing type
feat: Added.     # Wrong mood, has period
FEAT: change     # Uppercase type
```

## Quality Gates

### Required Checks

All of these must pass:

1. ✅ ESLint with zero errors/warnings
2. ✅ TypeScript compilation with zero errors
3. ✅ All tests passing
4. ✅ Production build successful
5. ✅ Conventional commit format
6. ✅ Docker build successful

### Coverage Thresholds

**Target Coverage:**

- Business Logic: 80%+
- Components: 70%+
- Overall: 75%+

**Note:** Coverage is informational and doesn't block CI (yet).

## Deployment Process

### Automatic Deployment

1. Merge PR to `main` branch
2. CI workflow runs quality gates
3. If all pass, deploy workflow triggers
4. Vercel builds and deploys to production
5. New version live at https://jobhunt.kaitran.ca/

### Manual Deployment

1. Go to Actions tab in GitHub
2. Select "Deploy to Vercel" workflow
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow"

## Secrets Configuration

### GitHub Secrets

Required secrets in repository settings:

```yaml
# Vercel Deployment
VERCEL_TOKEN: 'your-vercel-token'
VERCEL_ORG_ID: 'your-org-id'
VERCEL_PROJECT_ID: 'your-project-id'

# Supabase (for build-time checks)
NEXT_PUBLIC_SUPABASE_URL: 'https://xxx.supabase.co'
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: 'your-key'

# Optional
CODECOV_TOKEN: 'your-codecov-token'
```

### Setting Secrets

1. Go to repository Settings
2. Navigate to Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with name and value

## Troubleshooting

### CI Failing on ESLint

```bash
# Run locally to see errors
yarn lint

# Auto-fix issues
yarn lint:fix
```

### CI Failing on TypeScript

```bash
# Run locally to see errors
yarn typecheck

# Fix type errors in your code
```

### CI Failing on Tests

```bash
# Run tests locally
yarn test

# Watch mode for debugging
yarn test:watch
```

### Commit Message Rejected

```bash
# Check commitlint locally
echo "feat: your message" | npx commitlint

# Fix the message format
git commit --amend -m "feat: correct message"
```

### Pre-commit Hook Failing

```bash
# Run hooks manually
yarn precommit

# Skip hooks (NOT RECOMMENDED)
git commit --no-verify
```

**⚠️ WARNING:** Never use `--no-verify` to bypass quality gates. Fix the issues instead.

### Docker Build Failing

```bash
# Test Docker build locally
docker build -t jobhunt:test .

# Check build logs
docker build --progress=plain -t jobhunt:test .
```

## Performance Optimization

### CI Performance

- **Caching:** Yarn dependencies cached per Node version
- **Concurrency:** Jobs run in parallel when possible
- **Timeout:** Reasonable timeouts prevent hanging builds

### Docker Build

- **BuildKit:** Enabled for layer caching
- **Cache Strategy:** GitHub Actions cache for Docker layers
- **Multi-stage Build:** Optimized for size and speed

## Best Practices

### For Contributors

1. ✅ Always run `yarn lint && yarn typecheck && yarn test` before committing
2. ✅ Use conventional commit messages
3. ✅ Keep commits focused and atomic
4. ✅ Write tests for new features
5. ✅ Update documentation when needed

### For Maintainers

1. ✅ Require CI to pass before merging
2. ✅ Review all changes thoroughly
3. ✅ Keep dependencies updated
4. ✅ Monitor CI performance
5. ✅ Rotate secrets regularly

## Monitoring

### Build Status

- Check Actions tab for workflow runs
- Green checkmark = all passed
- Red X = failure, click for details

### Coverage Reports

- Uploaded to Codecov (if configured)
- View coverage trends over time
- Identify untested code paths

### Deployment Status

- Check Vercel dashboard
- View deployment logs
- Monitor production performance

## Future Improvements

### Planned Enhancements

- [ ] Branch protection rules
- [ ] Required reviewers
- [ ] Automated dependency updates
- [ ] Performance budgets
- [ ] Visual regression testing
- [ ] Staging environment deployments
- [ ] Automated changelog generation

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint](https://commitlint.js.org/)
- [Husky](https://typicode.github.io/husky/)
- [Lint-staged](https://github.com/okonet/lint-staged)
- [Vercel CLI](https://vercel.com/docs/cli)

## Support

For CI/CD issues:

1. Check workflow logs in Actions tab
2. Review error messages
3. Test locally with same commands
4. Open an issue if problem persists

---

**Quality is our priority. All checks exist to maintain high standards.**
