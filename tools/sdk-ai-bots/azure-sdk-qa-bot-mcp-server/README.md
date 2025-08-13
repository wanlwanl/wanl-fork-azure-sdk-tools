# MCP Server for azure-sdk-qa-bot-backend

This project is an MCP (Model Context Protocol) server in TypeScript/Node.js. It exposes tool endpoints to call the completion API of the `azure-sdk-qa-bot-backend` service.

## Features

- **Simple completion**: Basic question-answering tool
- **Advanced completion**: Full control over tenant, sources, history, and other options
- **Multiple tenants**: Support for different QA bot configurations
- **Rich responses**: Includes references, reasoning progress, and intention analysis
- **Authentication**: Optional API key support (not needed for localhost)

## Installation

### Option 1: Automated Installation (Recommended)

Use the installation script to automatically set up the MCP server:

**Windows (PowerShell):**

Method 1 - Direct from repository:
```powershell
# Run the installation script directly from the repository
irm https://raw.githubusercontent.com/wanlwanl/wanl-fork-azure-sdk-tools/support_mcp_tools/tools/sdk-ai-bots/azure-sdk-qa-bot-mcp-server/install-mcp-server.ps1 -UpdateVsCodeConfig | iex
```

Method 2 - Download and run locally:
```powershell
# Download the installation script
Invoke-RestMethod -Uri "https://raw.githubusercontent.com/wanlwanl/wanl-fork-azure-sdk-tools/support_mcp_tools/tools/sdk-ai-bots/azure-sdk-qa-bot-mcp-server/install-mcp-server.ps1" -OutFile "install-mcp-server.ps1"

# Run the script with VS Code configuration update
.\install-mcp-server.ps1 -UpdateVsCodeConfig

# Or run with custom environment variables
.\install-mcp-server.ps1 -UpdateVsCodeConfig -BackendUrl "https://your-backend-url.com" -ApiKey "your-api-key"
```

Method 3 - Clone repository and run:
```powershell
# Clone the repository
git clone https://github.com/wanlwanl/wanl-fork-azure-sdk-tools.git
cd wanl-fork-azure-sdk-tools/tools/sdk-ai-bots/azure-sdk-qa-bot-mcp-server

# Run the installation script
.\install-mcp-server.ps1 -UpdateVsCodeConfig
```

This script will:
- Download and install the MCP server package
- Configure it in your MCP settings file
- Set up the npm executable for easy usage

### Option 2: Manual Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment configuration:

   ```bash
   cp .env.example .env
   ```

3. Build the project:

   ```bash
   npm run build
   ```

4. Install globally to use as npm executable:

   ```bash
   npm install -g .
   ```

## Usage

### As MCP Server (Recommended)

After installation, the server can be used as an MCP server with compatible clients like Claude Desktop. The installation script automatically configures this.

### Direct Usage

You can also run the server directly:

**Using npm executable (after global installation):**
```bash
azure-sdk-qa-bot-mcp-server
```

### Development

Start the server in development mode:

```bash
npm run dev
```

### Production Build

Build and start the server manually:

```bash
npm run build
npm start
```

## Environment Configuration

The MCP server uses environment variables for configuration:

### Required/Recommended Variables

- **`BACKEND_URL`**: The Azure SDK QA Bot backend service endpoint
  - Default: `http://localhost:8088`
  - Production: `https://azuresdkbot-azuresdkbot-dev-czhxctdndmfdb5hq.eastasia-01.azurewebsites.net`

### Optional Variables

- **`API_KEY`**: API key for authentication (optional for localhost)
- **`PORT`**: Server port (default: 3000, mainly for development)
- **`NODE_ENV`**: Node environment (set to "production" for MCP usage)

### Configuration Methods

#### Option 1: Environment Variables in MCP Configuration

When using with MCP clients (VS Code, Claude Desktop), set environment variables in your MCP configuration:

**VS Code (mcp.json):**
```json
{
  "servers": {
    "azure-sdk-qa-bot": {
      "type": "stdio",
      "command": "azure-sdk-qa-bot-mcp-server",
      "env": {
        "NODE_ENV": "production",
        "BACKEND_URL": "https://azuresdkbot-azuresdkbot-dev-czhxctdndmfdb5hq.eastasia-01.azurewebsites.net",
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Claude Desktop (claude_desktop_config.json):**
```json
{
  "mcpServers": {
    "azure-sdk-qa-bot": {
      "command": "azure-sdk-qa-bot-mcp-server",
      "env": {
        "NODE_ENV": "production",
        "BACKEND_URL": "https://azuresdkbot-azuresdkbot-dev-czhxctdndmfdb5hq.eastasia-01.azurewebsites.net",
        "API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### Option 2: `.env` File (for development)

Create a `.env` file in the project directory:

```bash
# Copy .env.example to .env and update values
cp .env.example .env
```

Edit `.env`:
```env
BACKEND_URL=https://azuresdkbot-azuresdkbot-dev-czhxctdndmfdb5hq.eastasia-01.azurewebsites.net
API_KEY=your-api-key-here
NODE_ENV=production
```

## API Endpoints

### GET `/ping`
Health check endpoint

### GET `/info`
Returns available tenants and sources

### POST `/tools/completion`
Simple completion tool

Request body:
```json
{
  "prompt": "Your question here",
  "options": {
    "tenant_id": "azure_sdk_qa_bot",
    "top_k": 10,
    "with_full_context": false,
    "with_preprocess": true
  }
}
```

### POST `/tools/completion/advanced`
Advanced completion tool with full request control

Request body matches the backend API exactly:
```json
{
  "tenant_id": "azure_sdk_qa_bot",
  "message": {
    "role": "user",
    "content": "Your question here"
  },
  "history": [],
  "top_k": 10,
  "sources": ["azure-sdk-guidelines"],
  "with_full_context": false,
  "with_preprocess": true
}
```

## Available Tenants

- `azure_sdk_qa_bot` - General Azure SDK questions
- `typespec_extension` - TypeSpec specific questions
- `python_channel_qa_bot` - Python SDK specific questions  
- `azure_sdk_onboarding` - Onboarding and getting started questions

## Available Sources

- `typespec_docs` - TypeSpec documentation
- `typespec_azure_docs` - TypeSpec for Azure documentation
- `azure_rest_api_specs_wiki` - Azure REST API specifications wiki
- `azure_sdk_for_python_docs` - Azure SDK for Python docs
- `azure-sdk-guidelines` - Azure SDK guidelines
- And more... (see `/info` endpoint)

## Configuration

Update the completion API URL in `src/tools/completion.ts` if your backend runs on a different host/port.

Set the `API_KEY` environment variable if your backend requires authentication.

## Examples

See `examples.json` for sample API calls you can make to test the server.

## Project Structure

- `src/index.ts` - Express server with MCP tool endpoints
- `src/tools/completion.ts` - Tool logic to call the backend completion API
- `examples.json` - Example API calls
- `.env.example` - Environment configuration template
