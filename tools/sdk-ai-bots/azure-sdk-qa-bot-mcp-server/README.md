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

Method 1 - Download and run (Recommended):
```powershell
# Download and run with VS Code configuration
irm https://raw.githubusercontent.com/wanlwanl/wanl-fork-azure-sdk-tools/support_mcp_tools/tools/sdk-ai-bots/azure-sdk-qa-bot-mcp-server/install-mcp-server.ps1 -OutFile install-mcp-server.ps1
.\install-mcp-server.ps1 -UpdateVsCodeConfig
Remove-Item install-mcp-server.ps1
```

Method 2 - With custom environment variables:
```powershell
# Download the script
irm https://raw.githubusercontent.com/wanlwanl/wanl-fork-azure-sdk-tools/support_mcp_tools/tools/sdk-ai-bots/azure-sdk-qa-bot-mcp-server/install-mcp-server.ps1 -OutFile install-mcp-server.ps1

# Run with custom environment variables
.\install-mcp-server.ps1 -UpdateVsCodeConfig

# Clean up
Remove-Item install-mcp-server.ps1
```
```powershell
# Download the installation script
Invoke-RestMethod -Uri "https://raw.githubusercontent.com/wanlwanl/wanl-fork-azure-sdk-tools/support_mcp_tools/tools/sdk-ai-bots/azure-sdk-qa-bot-mcp-server/install-mcp-server.ps1" -OutFile "install-mcp-server.ps1"

# Run the script with VS Code configuration update
.\install-mcp-server.ps1 -UpdateVsCodeConfig
```

Method 3 - Clone repository and run:
```powershell
# Clone the repository
git clone https://github.com/wanlwanl/wanl-fork-azure-sdk-tools.git
cd wanl-fork-azure-sdk-tools/tools/sdk-ai-bots/azure-sdk-qa-bot-mcp-server

# Run the installation script
.\install-mcp-server.ps1 -UpdateVsCodeConfig
```

**What the script does:**
- Downloads and installs the MCP server package
- Configures it in your MCP settings file
- Sets up the npm executable for easy usage
- Prompts for environment configuration (Backend URL, API Key)