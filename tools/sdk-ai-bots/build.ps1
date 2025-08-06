# Azure SDK QA Bot - Build All Projects Script (PowerShell)
# This script builds all projects in the workspace in the correct order

param(
    [switch]$SkipPrerequisites
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "Azure SDK QA Bot - Building All Projects" -ForegroundColor Blue
Write-Host "========================================"

function Write-Status {
    param($Message)
    Write-Host "[BUILD] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

if (-not $SkipPrerequisites) {
    # Check prerequisites
    Write-Status "Checking prerequisites..."

    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js found: $nodeVersion"
    }
    catch {
        Write-Error "Node.js is not installed. Please install Node.js 18, 20, or 22"
        exit 1
    }

    # Check npm
    try {
        $npmVersion = npm --version
        Write-Success "npm found: $npmVersion"
    }
    catch {
        Write-Error "npm is not installed. Please install npm"
        exit 1
    }

    # Check Go
    try {
        $goVersion = go version
        Write-Success "Go found: $goVersion"
    }
    catch {
        Write-Error "Go is not installed. Please install Go 1.23 or higher"
        exit 1
    }
}

try {
    # Build Go Backend Service
    Write-Status "Building Go Backend Service..."
    Set-Location azure-sdk-qa-bot-backend
    go mod download
    go build -v
    Write-Success "Go backend service built successfully"
    Set-Location ..

    # Build Shared TypeScript Service
    Write-Status "Building Shared TypeScript Service..."
    Set-Location azure-sdk-qa-bot-backend-shared
    npm install
    npm run build
    Write-Success "Shared service built successfully"
    Set-Location ..

    # Build Main Teams Bot
    Write-Status "Building Main Teams Bot..."
    Set-Location azure-sdk-qa-bot
    npm install
    npm run build
    Write-Success "Main Teams bot built successfully"
    Set-Location ..

    # Build Azure Function
    Write-Status "Building Azure Function..."
    Set-Location azure-sdk-qa-bot-function
    npm install
    npm run build
    Write-Success "Azure Function built successfully"
    Set-Location ..

    Write-Host ""
    Write-Success "========================================="
    Write-Success "All projects built successfully!"
    Write-Success "========================================="
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Configure environment variables (see individual README files)"
    Write-Host "  2. Start services using: ./run.sh start"
    Write-Host "  3. Check service status: ./run.sh status"
    Write-Host ""
    Write-Host "Individual project outputs:"
    Write-Host "  - Go Backend: ./azure-sdk-qa-bot-backend/azure-sdk-qa-bot-backend.exe"
    Write-Host "  - Shared Service: ./azure-sdk-qa-bot-backend-shared/dist/"
    Write-Host "  - Teams Bot: ./azure-sdk-qa-bot/lib/"
    Write-Host "  - Azure Function: ./azure-sdk-qa-bot-function/dist/"
}
catch {
    Write-Error "Build failed: $($_.Exception.Message)"
    exit 1
}
