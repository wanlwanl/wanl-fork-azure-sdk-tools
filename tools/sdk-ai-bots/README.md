# Azure SDK AI Bots

## Overview

This directory contains a collection of intelligent tools that leverage AI technologies to enhance developer productivity and support within the Azure SDK ecosystem.

### Azure SDK QA Bot

The Azure SDK QA Bot is an intelligent Microsoft Teams chatbot designed to assist developers with Azure SDK and TypeSpec-related queries. Built with TypeScript and powered by Azure OpenAI, this bot provides comprehensive support for development teams.

**Key Capabilities:**

- **Intelligent Q&A**: Provides accurate answers by searching through a comprehensive knowledge base that includes:
  - Azure SDK documentation from the [Engineering Hub](https://eng.ms/docs/products/azure-developer-experience)
  - TypeSpec documentation from the [TypeSpec Azure repository](https://github.com/azure/typespec-azure)

## Project Structure

This workspace contains multiple interconnected services:

| Service | Technology | Purpose |
|---------|------------|---------|
| **azure-sdk-qa-bot** | TypeScript/Node.js | Main Teams bot application |
| **azure-sdk-qa-bot-backend** | Go | Backend API service for AI processing |
| **azure-sdk-qa-bot-backend-shared** | TypeScript/Node.js | Shared preprocessing service |
| **azure-sdk-qa-bot-function** | TypeScript/Azure Functions | Azure Functions for bot operations |

## Building the Projects

### Prerequisites

Before building any project, ensure you have the following installed:

- **Node.js** (version 18, 20, or 22)
- **npm** (comes with Node.js)
- **Go** (version 1.23 or higher)
- **TypeScript** (installed globally or via npm)

### Build All Projects

To build all projects in the correct order, use the provided build scripts:

**For Linux/macOS/WSL:**
```bash
./build.sh
```

**For Windows PowerShell:**
```powershell
.\build.ps1
```

**Manual build (all platforms):**
```bash
# Build the Go backend service
cd azure-sdk-qa-bot-backend
go mod download
go build -v
cd ..

# Build the shared TypeScript service
cd azure-sdk-qa-bot-backend-shared
npm install
npm run build
cd ..

# Build the main Teams bot
cd azure-sdk-qa-bot
npm install
npm run build
cd ..

# Build the Azure Function
cd azure-sdk-qa-bot-function
npm install
npm run build
cd ..
```

### Individual Project Build Instructions

#### Azure SDK QA Bot (Main Bot)
```bash
cd azure-sdk-qa-bot
npm install          # Install dependencies
npm run build        # Compile TypeScript and copy assets
npm run dev          # Start in development mode
npm start            # Start in production mode
```

#### Backend Service (Go)
```bash
cd azure-sdk-qa-bot-backend
go mod download      # Download dependencies
go build -v          # Build with verbose output
go run .             # Run in development mode
```

#### Shared Service (TypeScript)
```bash
cd azure-sdk-qa-bot-backend-shared
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run dev:local    # Start in development mode
npm start            # Start in production mode
npm test             # Run tests
```

#### Azure Function
```bash
cd azure-sdk-qa-bot-function
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run clean        # Clean dist folder
npm start            # Start Azure Functions runtime
```

## Running the Complete System

### Using the Management Script

The easiest way to run the system is using the provided management script:

```bash
# Start all services
./run.sh start

# Check service status
./run.sh status

# Restart all services
./run.sh restart

# Stop all services
./run.sh stop
```

### Manual Service Startup

If you prefer to start services individually:

1. **Start the Go Backend Service:**
   ```bash
   cd azure-sdk-qa-bot-backend
   go run .
   ```

2. **Start the Shared Service:**
   ```bash
   cd azure-sdk-qa-bot-backend-shared
   npm run dev:local
   ```

3. **Start the Main Bot:**
   ```bash
   cd azure-sdk-qa-bot
   npm run dev
   ```

## Development Workflow

### For TypeScript Projects

1. **Install dependencies**: `npm install`
2. **Development mode**: `npm run dev` (with hot reload)
3. **Type checking**: `npm run typecheck` (where available)
4. **Build for production**: `npm run build`
5. **Run tests**: `npm test`

### For Go Project

1. **Install dependencies**: `go mod download`
2. **Development mode**: `go run .`
3. **Build for production**: `go build`
4. **Run tests**: `go test ./...`
5. **Format code**: `go fmt ./...`

## Build Troubleshooting

### Common Issues

**TypeScript Build Errors:**
- Ensure all dependencies are installed: `npm install`
- Check TypeScript version compatibility
- Verify environment variables are set correctly

**Go Build Errors:**
- Verify Go version (1.23+): `go version`
- Update dependencies: `go mod tidy`
- Check module cache: `go clean -modcache`

**Node.js Version Issues:**
- Use Node Version Manager (nvm) to switch versions
- Supported versions: 18, 20, 22

### Build Scripts Summary

| Project | Build Command | Output Location |
|---------|---------------|-----------------|
| azure-sdk-qa-bot | `npm run build` | `./lib/` |
| azure-sdk-qa-bot-backend | `go build` | `./azure-sdk-qa-bot-backend` (executable) |
| azure-sdk-qa-bot-backend-shared | `npm run build` | `./dist/` |
| azure-sdk-qa-bot-function | `npm run build` | `./dist/` |

## Next Steps

- For detailed setup instructions, see individual project README files
- For deployment information, see [deployment documentation](./deploy.sh)
- For troubleshooting, see [troubleshooting guide](./azure-sdk-qa-bot-backend/TROUBLE_SHOOTING.md)