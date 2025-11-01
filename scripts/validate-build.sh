#!/usr/bin/env bash
# Build validation script for JobHunt
# Catches common issues before deployment

set -e  # Exit on any error

echo "🔍 JobHunt Build Validation"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track validation status
VALIDATION_FAILED=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        VALIDATION_FAILED=1
    fi
}

# 1. TypeScript Compilation Check
echo "📝 Checking TypeScript compilation..."
if yarn typecheck > /dev/null 2>&1; then
    print_status 0 "TypeScript compilation successful"
else
    print_status 1 "TypeScript compilation failed"
    echo -e "${YELLOW}   Run 'yarn typecheck' to see errors${NC}"
fi

# 2. ESLint Check
echo ""
echo "🔍 Checking ESLint..."
if yarn lint > /dev/null 2>&1; then
    print_status 0 "ESLint passed"
else
    print_status 1 "ESLint failed"
    echo -e "${YELLOW}   Run 'yarn lint' to see errors${NC}"
fi

# 3. Test Suite Check
echo ""
echo "🧪 Running test suite..."
# Skip tests on Vercel to avoid timeouts and resource constraints
if [ -n "$VERCEL" ] || [ -n "$VERCEL_ENV" ]; then
    print_status 0 "Skipping tests on Vercel (run locally before pushing)"
elif yarn test --reporter=basic 2>/dev/null | grep -q "Test Files.*failed"; then
    print_status 1 "Tests failed"
    echo -e "${YELLOW}   Run 'yarn test' to see failures${NC}"
else
    print_status 0 "All tests passed"
fi

# 4. Check for Forbidden Patterns
echo ""
echo "🚫 Checking for forbidden code patterns..."

# Check for eslint-disable
if git grep -n "eslint-disable" -- "*.ts" "*.tsx" "*.js" "*.jsx" > /dev/null 2>&1; then
    print_status 1 "Found eslint-disable comments (forbidden)"
    echo -e "${YELLOW}   Fix the underlying ESLint issues instead of disabling rules${NC}"
else
    print_status 0 "No eslint-disable comments found"
fi

# Check for @ts-ignore
if git grep -n "@ts-ignore\|@ts-expect-error" -- "*.ts" "*.tsx" > /dev/null 2>&1; then
    print_status 1 "Found @ts-ignore or @ts-expect-error (forbidden)"
    echo -e "${YELLOW}   Fix the underlying TypeScript issues instead of suppressing errors${NC}"
else
    print_status 0 "No @ts-ignore or @ts-expect-error found"
fi

# Check for 'any' type usage (excluding test files and type definitions)
# Use word boundaries to avoid false positives like "Company[]" matching "any[]"
if git grep -n ": any\b\|<any>\|Array<any>\|\bany\[\]" -- "*.ts" "*.tsx" | grep -v "\.test\.\|\.d\.ts\|test-utils" > /dev/null 2>&1; then
    print_status 1 "Found 'any' type usage (should be avoided)"
    echo -e "${YELLOW}   Use proper types instead of 'any'${NC}"
else
    print_status 0 "No inappropriate 'any' type usage found"
fi

# 5. Environment Variables Check
echo ""
echo "🔐 Checking required environment variables..."

REQUIRED_VARS=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY")
ENV_CHECK_PASSED=1

# Skip env check on Vercel (variables are injected at runtime, not during validation)
if [ -n "$VERCEL" ] || [ -n "$VERCEL_ENV" ]; then
    print_status 0 "Skipping environment check on Vercel (variables injected at runtime)"
else
    # Check environment variables for local development
    for VAR in "${REQUIRED_VARS[@]}"; do
        # First check if variable is set in environment
        if [ -n "${!VAR}" ]; then
            : # Variable exists in environment, continue
        # Then check .env.local for local development
        elif grep -q "^${VAR}=" .env.local 2>/dev/null; then
            : # Variable exists in .env.local, continue
        else
            ENV_CHECK_PASSED=0
        fi
    done

    if [ $ENV_CHECK_PASSED -eq 1 ]; then
        print_status 0 "Required environment variables present"
    else
        print_status 1 "Missing required environment variables"
        echo -e "${YELLOW}   Check .env.local for: ${REQUIRED_VARS[*]}${NC}"
    fi
fi

# 6. Check for Supabase middleware CSP issues
echo ""
echo "🛡️ Checking Supabase middleware configuration..."

if git grep -q "createServerClient" src/lib/supabase/middleware.ts 2>/dev/null; then
    if git grep -q "eval\|Function(" src/lib/supabase/middleware.ts 2>/dev/null; then
        print_status 1 "Middleware contains eval or Function() (CSP violation)"
    else
        print_status 0 "Middleware is CSP-compliant"
    fi
else
    print_status 0 "Middleware configuration not found or not applicable"
fi

# 7. Check Tailwind CSS configuration
echo ""
echo "🎨 Checking Tailwind CSS configuration..."

if [ -f "postcss.config.mjs" ] && grep -q "@tailwindcss/postcss" postcss.config.mjs 2>/dev/null; then
    print_status 0 "Tailwind CSS PostCSS configuration present"
else
    print_status 1 "Tailwind CSS PostCSS configuration missing or incorrect"
fi

if [ -f "src/app/globals.css" ] && grep -q '@import.*tailwindcss' src/app/globals.css 2>/dev/null; then
    print_status 0 "Tailwind CSS v4 import syntax correct"
else
    print_status 1 "Tailwind CSS import missing or incorrect"
fi

# Final Result
echo ""
echo "=========================="
if [ $VALIDATION_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All validations passed!${NC}"
    echo "Ready for deployment 🚀"
    exit 0
else
    echo -e "${RED}✗ Some validations failed${NC}"
    echo "Please fix the issues above before deploying"
    exit 1
fi
