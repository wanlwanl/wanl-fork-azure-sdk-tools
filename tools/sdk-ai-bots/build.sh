#!/bin/bash

# Azure SDK QA Bot - Build All Projects Script
# This script builds all projects in the workspace in the correct order

set -e  # Exit on any error

echo "========================================"
echo "Azure SDK QA Bot - Building All Projects"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[BUILD]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18, 20, or 22"
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js found: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm"
    exit 1
fi
NPM_VERSION=$(npm --version)
print_success "npm found: $NPM_VERSION"

# Check Go
if ! command -v go &> /dev/null; then
    print_error "Go is not installed. Please install Go 1.23 or higher"
    exit 1
fi
GO_VERSION=$(go version)
print_success "Go found: $GO_VERSION"

# Build Go Backend Service
print_status "Building Go Backend Service..."
cd azure-sdk-qa-bot-backend
if go mod download && go build -v; then
    print_success "Go backend service built successfully"
else
    print_error "Failed to build Go backend service"
    exit 1
fi
cd ..

# Build Shared TypeScript Service
print_status "Building Shared TypeScript Service..."
cd azure-sdk-qa-bot-backend-shared
if npm install && npm run build; then
    print_success "Shared service built successfully"
else
    print_error "Failed to build shared service"
    exit 1
fi
cd ..

# Build Main Teams Bot
print_status "Building Main Teams Bot..."
cd azure-sdk-qa-bot
if npm install && npm run build; then
    print_success "Main Teams bot built successfully"
else
    print_error "Failed to build main Teams bot"
    exit 1
fi
cd ..

# Build Azure Function
print_status "Building Azure Function..."
cd azure-sdk-qa-bot-function
if npm install && npm run build; then
    print_success "Azure Function built successfully"
else
    print_error "Failed to build Azure Function"
    exit 1
fi
cd ..

echo ""
print_success "========================================="
print_success "All projects built successfully!"
print_success "========================================="
echo ""
echo "Next steps:"
echo "  1. Configure environment variables (see individual README files)"
echo "  2. Start services using: ./run.sh start"
echo "  3. Check service status: ./run.sh status"
echo ""
echo "Individual project outputs:"
echo "  - Go Backend: ./azure-sdk-qa-bot-backend/azure-sdk-qa-bot-backend"
echo "  - Shared Service: ./azure-sdk-qa-bot-backend-shared/dist/"
echo "  - Teams Bot: ./azure-sdk-qa-bot/lib/"
echo "  - Azure Function: ./azure-sdk-qa-bot-function/dist/"
