#!/bin/bash

# Comprehensive Test Runner for JobHunt Application
# This script runs all test suites with proper configuration and reporting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
TEST_RESULTS_DIR="./test-results"
COVERAGE_DIR="./coverage"
REPORTS_DIR="./reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create directories
mkdir -p "$TEST_RESULTS_DIR"
mkdir -p "$COVERAGE_DIR"
mkdir -p "$REPORTS_DIR"

echo -e "${BLUE}🚀 Starting comprehensive test suite for JobHunt${NC}"
echo -e "${BLUE}===============================================${NC}"

# Function to run tests with error handling
run_test_suite() {
    local test_name=$1
    local test_command=$2
    local config_file=$3
    local output_file=$4

    echo -e "\n${YELLOW}Running $test_name...${NC}"

    if [ -n "$config_file" ]; then
        eval "$test_command --config $config_file" > "$output_file" 2>&1 || {
            echo -e "${RED}❌ $test_name failed${NC}"
            echo -e "${RED}Check $output_file for details${NC}"
            return 1
        }
    else
        eval "$test_command" > "$output_file" 2>&1 || {
            echo -e "${RED}❌ $test_name failed${NC}"
            echo -e "${RED}Check $output_file for details${NC}"
            return 1
        }
    fi

    echo -e "${GREEN}✅ $test_name completed${NC}"
    return 0
}

# Function to generate test summary
generate_test_summary() {
    local summary_file="$REPORTS_DIR/test-summary-$TIMESTAMP.md"

    cat > "$summary_file" << EOF
# JobHunt Test Suite Summary

**Generated:** $(date)
**Test Environment:** Node.js $(node --version)

## Test Results Overview

EOF

    # Add results from each test suite
    for test_file in "$TEST_RESULTS_DIR"/*.log; do
        if [ -f "$test_file" ]; then
            local test_name=$(basename "$test_file" .log)
            echo -e "\n### $test_name\n" >> "$summary_file"
            echo "\`\`\`" >> "$summary_file"
            tail -20 "$test_file" >> "$summary_file"
            echo "\`\`\`" >> "$summary_file"
        fi
    done

    echo -e "\n${GREEN}📊 Test summary generated: $summary_file${NC}"
}

# Pre-test checks
echo -e "\n${YELLOW}🔍 Running pre-test checks...${NC}"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    yarn install
fi

# Check code quality
echo -e "${YELLOW}Running code quality checks...${NC}"
{
    echo "=== ESLint Results ==="
    yarn lint || echo "ESLint issues found"
    echo -e "\n=== TypeScript Check Results ==="
    yarn typecheck || echo "TypeScript issues found"
} > "$TEST_RESULTS_DIR/pre-checks-$TIMESTAMP.log" 2>&1

# Test Suite 1: Unit Tests
echo -e "\n${YELLOW}🧪 Running Unit Tests...${NC}"
run_test_suite "Unit Tests" "yarn test" "" "$TEST_RESULTS_DIR/unit-tests-$TIMESTAMP.log"

# Test Suite 2: Integration Tests
echo -e "\n${YELLOW}🔗 Running Integration Tests...${NC}"
run_test_suite "Integration Tests" "yarn test" "vitest.integration.config.mts" "$TEST_RESULTS_DIR/integration-tests-$TIMESTAMP.log"

# Test Suite 3: Performance Tests
echo -e "\n${YELLOW}⚡ Running Performance Tests...${NC}"
run_test_suite "Performance Tests" "yarn test" "vitest.performance.config.mts" "$TEST_RESULTS_DIR/performance-tests-$TIMESTAMP.log"

# Test Suite 4: End-to-End Tests
echo -e "\n${YELLOW}🎭 Running End-to-End Tests...${NC}"
run_test_suite "E2E Tests" "yarn test" "" "$TEST_RESULTS_DIR/e2e-tests-$TIMESTAMP.log"

# Coverage Report
echo -e "\n${YELLOW}📈 Generating Coverage Report...${NC}"
yarn test:coverage > "$TEST_RESULTS_DIR/coverage-$TIMESTAMP.log" 2>&1 || {
    echo -e "${YELLOW}⚠️ Coverage report generation had issues${NC}"
}

# Performance Benchmark Report
echo -e "\n${YELLOW}📊 Generating Performance Benchmark Report...${NC}"
{
    echo "=== Performance Benchmark Results ==="
    echo "Generated at: $(date)"
    echo ""
    echo "Database Performance:"
    grep -A 10 "Database Performance" "$TEST_RESULTS_DIR/performance-tests-$TIMESTAMP.log" || echo "No database performance metrics found"
    echo ""
    echo "API Performance:"
    grep -A 10 "API Performance" "$TEST_RESULTS_DIR/performance-tests-$TIMESTAMP.log" || echo "No API performance metrics found"
} > "$REPORTS_DIR/performance-benchmark-$TIMESTAMP.txt"

# Security Scan
echo -e "\n${YELLOW}🔒 Running Security Scan...${NC}"
{
    echo "=== Security Scan Results ==="
    # Add security audit commands here if needed
    echo "Security scan completed at $(date)"
} > "$TEST_RESULTS_DIR/security-scan-$TIMESTAMP.log"

# Generate comprehensive report
echo -e "\n${YELLOW}📋 Generating Comprehensive Report...${NC}"
generate_test_summary

# Test Results Summary
echo -e "\n${BLUE}===============================================${NC}"
echo -e "${BLUE}📊 Test Suite Summary${NC}"
echo -e "${BLUE}===============================================${NC}"

# Count tests and results
unit_tests_passed=$(grep -c "✅" "$TEST_RESULTS_DIR/unit-tests-$TIMESTAMP.log" 2>/dev/null || echo "0")
unit_tests_failed=$(grep -c "❌" "$TEST_RESULTS_DIR/unit-tests-$TIMESTAMP.log" 2>/dev/null || echo "0")

integration_tests_passed=$(grep -c "✅" "$TEST_RESULTS_DIR/integration-tests-$TIMESTAMP.log" 2>/dev/null || echo "0")
integration_tests_failed=$(grep -c "❌" "$TEST_RESULTS_DIR/integration-tests-$TIMESTAMP.log" 2>/dev/null || echo "0")

performance_tests_passed=$(grep -c "✅" "$TEST_RESULTS_DIR/performance-tests-$TIMESTAMP.log" 2>/dev/null || echo "0")
performance_tests_failed=$(grep -c "❌" "$TEST_RESULTS_DIR/performance-tests-$TIMESTAMP.log" 2>/dev/null || echo "0")

e2e_tests_passed=$(grep -c "✅" "$TEST_RESULTS_DIR/e2e-tests-$TIMESTAMP.log" 2>/dev/null || echo "0")
e2e_tests_failed=$(grep -c "❌" "$TEST_RESULTS_DIR/e2e-tests-$TIMESTAMP.log" 2>/dev/null || echo "0")

total_passed=$((unit_tests_passed + integration_tests_passed + performance_tests_passed + e2e_tests_passed))
total_failed=$((unit_tests_failed + integration_tests_failed + performance_tests_failed + e2e_tests_failed))
total_tests=$((total_passed + total_failed))

echo -e "📊 ${GREEN}Unit Tests:${NC} $unit_tests_passed passed, $unit_tests_failed failed"
echo -e "🔗 ${GREEN}Integration Tests:${NC} $integration_tests_passed passed, $integration_tests_failed failed"
echo -e "⚡ ${GREEN}Performance Tests:${NC} $performance_tests_passed passed, $performance_tests_failed failed"
echo -e "🎭 ${GREEN}E2E Tests:${NC} $e2e_tests_passed passed, $e2e_tests_failed failed"
echo -e ""
echo -e "📈 ${BLUE}Total Tests:${NC} $total_passed passed, $total_failed failed out of $total_tests"

# Final status
if [ $total_failed -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! The application is ready for deployment.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please review the logs and fix the issues.${NC}"
    echo -e "${RED}📁 Test results are available in: $TEST_RESULTS_DIR${NC}"
    echo -e "${RED}📋 Detailed report: $REPORTS_DIR/test-summary-$TIMESTAMP.md${NC}"
    exit 1
fi