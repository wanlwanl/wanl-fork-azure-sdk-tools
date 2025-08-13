# MCP Server for azure-sdk-qa-bot-backend

This project is an MCP (Model Context Protocol) server in TypeScript/Node.js. It exposes tool endpoints to call the completion API of the `azure-sdk-qa-bot-backend` service.

## Features

- **Simple completion**: Basic question-answering tool
- **Advanced completion**: Full control over tenant, sources, history, and other options
- **Multiple tenants**: Support for different QA bot configurations
- **Rich responses**: Includes references, reasoning progress, and intention analysis
- **Authentication**: Optional API key support (not needed for localhost)

## Installation

### Automated Installation (Recommended)

Use the installation script to automatically set up the MCP server:

**Windows (PowerShell):**

```powershell
# Download and run with VS Code configuration
irm https://raw.githubusercontent.com/wanlwanl/wanl-fork-azure-sdk-tools/support_mcp_tools/tools/sdk-ai-bots/azure-sdk-qa-bot-mcp-server/install-mcp-server.ps1 -OutFile install-mcp-server.ps1
.\install-mcp-server.ps1 -UpdateVsCodeConfig
Remove-Item install-mcp-server.ps1
```

**What the script does:**

- Downloads and installs the MCP server package
- Configures it in your MCP settings file
- Sets up the npm executable for easy usage
- Prompts for environment configuration (Backend URL, API Key)

## Run MCP Server

Click Start button at mcp.json file, and make sure the mcp server is running.