#!/bin/bash

# Preflight check: runs tests and build to ensure stability

set -e

echo "Running preflight checks..."
echo ""

echo "1. Running tests..."
npm test -- --run

echo ""
echo "2. Running build..."
npm run build

echo ""
echo "✓ Preflight checks passed"

