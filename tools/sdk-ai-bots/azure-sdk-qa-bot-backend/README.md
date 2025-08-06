# Azure SDK QA Bot Backend

The Azure SDK QA Bot Backend is a Go-based service that powers an intelligent conversational assistant for Microsoft Teams. This service is specifically designed to help developers with TypeSpec and Azure SDK-related questions by leveraging Azure's AI services to provide accurate, context-aware responses.

## Overview

This service provides a Teams-integrated chatbot that can:
- Answer questions about TypeSpec syntax, usage, and best practices
- Provide relevant code examples and documentation references
- Search through comprehensive TypeSpec and Azure SDK documentation
- Assist with troubleshooting TypeSpec-related development issues
- Collect user feedback for continuous improvement

## Knowledge Base

The bot provides intelligent responses by searching through comprehensive knowledge bases including:
- [TypeSpec documentation](https://typespec.io/docs/)
- [TypeSpec Azure documentation](https://azure.github.io/typespec-azure/docs/intro/)
- Azure SDK development guides and best practices

## Key Features

- **Real-time Document Search**: Fast and accurate retrieval of relevant documentation
- **Context-Aware Responses**: Maintains conversation context for better assistance
- **Microsoft Teams Integration**: Seamless integration with Teams workflows
- **Feedback Collection**: Continuous improvement through user feedback
- **Intent Recognition**: Advanced understanding of user queries and intent

## Prerequisites

- **Go 1.23 or higher**
- **Azure Subscription** with access to the following services:
  - Azure AI Search
  - Azure Storage Account
  - Azure OpenAI Service
  - Azure Key Vault

## Building the Project

### Local Development Build

1. **Clone and Navigate to Project**:
   ```bash
   git clone <repository-url>
   cd tools/sdk-ai-bots/azure-sdk-qa-bot-backend
   ```

2. **Download Dependencies**:
   ```bash
   go mod download
   ```

3. **Verify Dependencies**:
   ```bash
   go mod verify
   ```

4. **Build the Application**:
   ```bash
   go build -v
   ```
   This creates an executable named `azure-sdk-qa-bot-backend` (or `.exe` on Windows)

5. **Alternative: Build and Run**:
   ```bash
   go run .
   ```

### Build Scripts and Commands

```bash
# Development commands
go mod download      # Download dependencies
go mod verify        # Verify dependencies
go mod tidy          # Clean up dependencies

# Build commands
go build            # Build executable
go build -v         # Build with verbose output
go build -o mybot   # Build with custom output name

# Development and testing
go run .            # Build and run in one step
go test ./...       # Run all tests
go fmt ./...        # Format code
go vet ./...        # Analyze code for issues

# Production build
go build -ldflags="-s -w" .  # Build optimized for production
```

### Build Output

- **Development**: No output files (when using `go run .`)
- **Production**: Executable file `azure-sdk-qa-bot-backend` in the current directory

## Installation and Setup

### Azure Virtual Machine Setup

1. **Create Azure Virtual Machine**:
   - Navigate to Azure Portal → Virtual Machines
   - Create a new VM with Ubuntu (recommended)

2. **Configure Managed Identity Permissions**:
   Assign the following roles to your VM's managed identity:
   - `Storage Blob Data Contributor`
   - `Key Vault Secrets User`

### Local Development Setup

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd tools/sdk-ai-bots/azure-sdk-qa-bot-backend
   ```

2. **Build the Application**:
   ```bash
   go mod download
   go build -v
   ```

3. **Start the Service**:
   ```bash
   # Using the management script (recommended)
   ./run.sh start
   
   # Or manually
   go run .
   ```

   **Available Management Commands**:
   ```bash
   ./run.sh start    # Start the service
   ./run.sh stop     # Stop the service
   ./run.sh restart  # Restart the service
   ./run.sh status   # Check service status
   ```

## API Usage

### Completion Endpoint

The primary endpoint for querying the bot is `/completion`. Here's how to use it:

**Request Example**:
```bash
curl --request POST \
  --url http://localhost:8088/completion \
  --header 'content-type: application/json; charset=utf8' \
  --header 'x-api-key: YOUR_API_KEY' \
  --data '{
    "tenant_id": "azure_sdk_qa_bot",
    "message": {
      "role": "user",
      "content": "What is TypeSpec?"
    }
  }'
```

## Development

### Project Structure

- **`config/`** - Configuration and Azure service setup
- **`handler/`** - HTTP request handlers for API endpoints
- **`model/`** - Data models, structs, and constants
- **`service/`** - Core business logic and service implementations
- **`scripts/`** - Utility scripts for maintenance tasks
- **`test/`** - Unit tests and API integration tests

### Running Tests

Execute the test suite with:
```bash
go test ./...
```

### Code Quality

Ensure code quality by running:
```bash
go fmt ./...
go vet ./...
```

## Deployment

Deploy the application using the deployment script:

```bash
./deploy.sh -t [tag] -m [environment]
```

**Parameters**:
- `-t [tag]`: Docker image tag (defaults to timestamp)
- `-m [environment]`: Target environment
  - `preview` (default): Deploy to preview slot
  - `prod`: Deploy to production
  - `slot`: Deploy to development slot

**Examples**:
```bash
# Deploy to preview with custom tag
./deploy.sh -t v1.2.3 -m preview

# Deploy to production
./deploy.sh -t v1.2.3 -m prod
```

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Your Changes**:
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to Your Branch**:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

## Troubleshooting

For common issues and debugging steps, see the [Troubleshooting Guide](./TROUBLE_SHOOTING.md).

## License

This project is part of the Azure SDK Tools and follows the same licensing terms.