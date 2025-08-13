#!/usr/bin/env pwsh

#Requires -Version 7.0
#Requires -PSEdition Core

<#
.SYNOPSIS
    Install Azure SDK QA Bot MCP Server for easy integration with VS Code and other MCP clients.

.DESCRIPTION
    This script downloads, builds, and configures the Azure SDK QA Bot MCP Server.
    It can automatically update your VS Code MCP configuration to include the server.

.PARAMETER InstallDirectory
    Directory where the MCP server should be installed. Defaults to a system-appropriate location.

.PARAMETER Repository
    GitHub repository to download from. Defaults to 'wanlwanl/wanl-fork-azure-sdk-tools'.

.PARAMETER Branch
    Git branch to download from. Defaults to 'support_mcp_tools'.

.PARAMETER UpdateVsCodeConfig
    Automatically update VS Code MCP configuration to include this server.

.PARAMETER ServerName
    Name to use for the MCP server configuration. Defaults to 'azure-sdk-qa-bot'.

.PARAMETER Force
    Force reinstallation even if already installed.

.EXAMPLE
    .\install-mcp-server.ps1
    Basic installation of the MCP server.

.EXAMPLE
    .\install-mcp-server.ps1 -UpdateVsCodeConfig
    Install and automatically configure VS Code MCP settings.

.EXAMPLE
    .\install-mcp-server.ps1 -InstallDirectory "C:\Tools\MCPServers" -UpdateVsCodeConfig -Force
    Force reinstall to a custom directory and update VS Code configuration.
#>

param(
    [string]$InstallDirectory = '',
    [string]$Repository = 'wanlwanl/wanl-fork-azure-sdk-tools',
    [string]$Branch = 'support_mcp_tools',
    [switch]$UpdateVsCodeConfig,
    [string]$ServerName = 'azure-sdk-qa-bot',
    [switch]$Force,
    [string]$BackendUrl = '',
    [string]$ApiKey = '',
    [switch]$Interactive = $true
)

$ErrorActionPreference = "Stop"

function Get-EnvironmentConfig {
    # Use provided parameters if available and not interactive
    if (-not $Interactive -and $BackendUrl) {
        $envConfig = @{
            "NODE_ENV" = "production"
            "BACKEND_URL" = $BackendUrl
        }
        
        if ($ApiKey) {
            $envConfig["API_KEY"] = $ApiKey
        }
        
        Write-Host "Using provided environment configuration" -ForegroundColor Green
        return $envConfig
    }
    
    # Interactive configuration
    Write-Host "`n=== Environment Configuration ===" -ForegroundColor Cyan
    Write-Host "Configure the MCP server environment variables:" -ForegroundColor Yellow
    
    # Backend URL
    $defaultBackendUrl = "https://azuresdkbot-azuresdkbot-dev-czhxctdndmfdb5hq.eastasia-01.azurewebsites.net"
    Write-Host ""
    Write-Host "Backend URL - The Azure SDK QA Bot backend service endpoint" -ForegroundColor White
    
    if ($BackendUrl) {
        $backendUrl = $BackendUrl
        Write-Host "Using provided Backend URL: $BackendUrl" -ForegroundColor Green
    } else {
        $backendUrl = Read-Host "Backend URL (press Enter for default: $defaultBackendUrl)"
        if ([string]::IsNullOrWhiteSpace($backendUrl)) {
            $backendUrl = $defaultBackendUrl
        }
    }
    
    # API Key (optional)
    Write-Host ""
    Write-Host "API Key - Optional for localhost, required for remote backends" -ForegroundColor White
    
    if ($ApiKey) {
        Write-Host "Using provided API Key" -ForegroundColor Green
        $apiKeyToUse = $ApiKey
    } else {
        $apiKeyToUse = Read-Host "API Key (press Enter to skip)"
    }
    
    # Create environment config
    $envConfig = @{
        "NODE_ENV" = "production"
        "BACKEND_URL" = $backendUrl
    }
    
    if (-not [string]::IsNullOrWhiteSpace($apiKeyToUse)) {
        $envConfig["API_KEY"] = $apiKeyToUse
    }
    
    Write-Host "✓ Environment configuration completed" -ForegroundColor Green
    return $envConfig
}

# Determine install directory
if (-not $InstallDirectory) {
    if ($IsWindows -or $env:OS -eq "Windows_NT") {
        $InstallDirectory = Join-Path $env:USERPROFILE ".mcp-servers"
    } else {
        $InstallDirectory = Join-Path $env:HOME ".mcp-servers"
    }
}

$serverInstallPath = Join-Path $InstallDirectory "azure-sdk-qa-bot-mcp-server"

Write-Host "Azure SDK QA Bot MCP Server Installer" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Check if already installed
if (Test-Path $serverInstallPath -and -not $Force) {
    Write-Warning "MCP Server already installed at: $serverInstallPath"
    Write-Host "Use -Force to reinstall or remove the directory manually."
    
    if ($UpdateVsCodeConfig) {
        Write-Host "Updating VS Code configuration only..."
    } else {
        exit 1
    }
}

# Prerequisites check
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion -match "v(\d+)\.") {
        $majorVersion = [int]$matches[1]
        if ($majorVersion -lt 18) {
            Write-Error "Node.js version 18 or higher is required. Found: $nodeVersion"
        }
        Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
    }
} catch {
    Write-Error "Node.js is required but not found. Please install Node.js 18+ from https://nodejs.org"
}

# Check npm
try {
    $npmVersion = npm --version 2>$null
    Write-Host "✓ npm $npmVersion found" -ForegroundColor Green
} catch {
    Write-Error "npm is required but not found."
}

# Check git
try {
    $gitVersion = git --version 2>$null
    Write-Host "✓ $gitVersion found" -ForegroundColor Green
} catch {
    Write-Error "git is required but not found. Please install git from https://git-scm.com"
}

Write-Host ""

# Create install directory
if (-not (Test-Path $InstallDirectory)) {
    Write-Host "Creating install directory: $InstallDirectory" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $InstallDirectory -Force | Out-Null
}

# Remove existing installation if Force is specified
if ($Force -and (Test-Path $serverInstallPath)) {
    Write-Host "Removing existing installation..." -ForegroundColor Yellow
    Remove-Item -Path $serverInstallPath -Recurse -Force
}

# Clone or download the repository
Write-Host "Downloading MCP server from GitHub..." -ForegroundColor Yellow
$tempPath = Join-Path ([System.IO.Path]::GetTempPath()) "azure-sdk-qa-bot-mcp-$(Get-Random)"

try {
    # Clone the specific subdirectory using sparse-checkout
    Write-Host "Cloning repository..."
    git clone --no-checkout --filter=blob:none "https://github.com/$Repository.git" $tempPath
    
    Push-Location $tempPath
    git sparse-checkout init --cone
    git sparse-checkout set "tools/sdk-ai-bots/azure-sdk-qa-bot-mcp-server"
    git checkout $Branch
    Pop-Location
    
    $sourcePath = Join-Path $tempPath "tools" "sdk-ai-bots" "azure-sdk-qa-bot-mcp-server"
    
    if (-not (Test-Path $sourcePath)) {
        throw "Source path not found after clone: $sourcePath"
    }
    
    # Copy to install location
    Write-Host "Installing to: $serverInstallPath" -ForegroundColor Yellow
    Copy-Item -Path $sourcePath -Destination $serverInstallPath -Recurse -Force
    
} catch {
    Write-Error "Failed to download repository: $_"
} finally {
    # Cleanup temp directory
    if (Test-Path $tempPath) {
        Remove-Item -Path $tempPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# Install dependencies and build
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Push-Location $serverInstallPath

try {
    npm install --production
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
    
    Write-Host "Building TypeScript..." -ForegroundColor Yellow
    npm run build
    Write-Host "✓ Build completed" -ForegroundColor Green
    
    Write-Host "Installing globally for executable access..." -ForegroundColor Yellow
    npm install -g .
    Write-Host "✓ Global installation completed" -ForegroundColor Green
    
} catch {
    Write-Error "Failed to install dependencies or build: $_"
} finally {
    Pop-Location
}

# Test the installation
Write-Host "Testing installation..." -ForegroundColor Yellow
$testResult = & azure-sdk-qa-bot-mcp-server --help 2>$null
if ($LASTEXITCODE -eq 0 -or $testResult) {
    Write-Host "✓ Installation test passed" -ForegroundColor Green
} else {
    Write-Warning "Installation test failed, but server may still work"
}

Write-Host ""
Write-Host "Installation completed successfully!" -ForegroundColor Green
Write-Host "Server installed at: $serverInstallPath" -ForegroundColor Cyan

# Get environment configuration (needed for both VS Code config and manual examples)
$envConfig = Get-EnvironmentConfig

# Update VS Code configuration
if ($UpdateVsCodeConfig) {
    Write-Host ""
    Write-Host "Updating VS Code MCP configuration..." -ForegroundColor Yellow
    
    # Try common VS Code config locations
    $vscodeConfigPaths = @()

    # Check current directory and workspace
    $vscodeConfigPaths += Join-Path (Get-Location) ".vscode" "mcp.json"
    
    $configUpdated = $false
    
    foreach ($vscodeConfigPath in $vscodeConfigPaths) {
        $configDir = Split-Path $vscodeConfigPath -Parent
        
        if (Test-Path $configDir -or (Split-Path $vscodeConfigPath -Leaf) -eq "mcp.json") {
            try {
                # Create directory if it doesn't exist
                if (-not (Test-Path $configDir)) {
                    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
                }
                
                # Load or create config
                if (Test-Path $vscodeConfigPath) {
                    $vscodeConfig = Get-Content -Raw $vscodeConfigPath | ConvertFrom-Json -AsHashtable
                } else {
                    $vscodeConfig = @{}
                }
                
                # Ensure servers section exists
                if (-not $vscodeConfig.ContainsKey('servers')) {
                    $vscodeConfig['servers'] = @{}
                }
                
                # Add our server configuration
                $serverConfig = @{
                    "type" = "stdio"
                    "command" = "azure-sdk-qa-bot-mcp-server"
                    "args" = @()
                    "env" = $envConfig
                }
                
                $vscodeConfig.servers[$ServerName] = $serverConfig
                
                # Ensure inputs section exists
                if (-not $vscodeConfig.ContainsKey('inputs')) {
                    $vscodeConfig['inputs'] = @()
                }
                
                # Save updated config
                $vscodeConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $vscodeConfigPath -Force
                Write-Host "✓ Updated VS Code config: $vscodeConfigPath" -ForegroundColor Green
                $configUpdated = $true
                
                break  # Stop after first successful update
                
            } catch {
                Write-Warning "Could not update VS Code config at $vscodeConfigPath : $_"
                continue
            }
        }
    }
    
    if (-not $configUpdated) {
        Write-Warning "Could not find or update VS Code MCP configuration."
        Write-Host "You can manually add this configuration to your VS Code mcp.json file:" -ForegroundColor Yellow
        
        $manualConfig = @{
            "servers" = @{
                $ServerName = @{
                    "type" = "stdio"
                    "command" = "azure-sdk-qa-bot-mcp-server"
                    "args" = @()
                    "env" = @{
                        "NODE_ENV" = "production"
                    }
                }
            }
        }
        
        Write-Host ($manualConfig | ConvertTo-Json -Depth 10) -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Green
Write-Host "1. Restart VS Code if you have it open" -ForegroundColor White
Write-Host "2. The MCP server should now be available as '$ServerName'" -ForegroundColor White
if (-not $UpdateVsCodeConfig) {
    Write-Host "3. Run with -UpdateVsCodeConfig to automatically configure VS Code" -ForegroundColor White
}

Write-Host ""
Write-Host "Manual Configuration Examples:" -ForegroundColor Yellow

Write-Host ""
Write-Host "VS Code (add to mcp.json):" -ForegroundColor White
$envConfigJson = $envConfig | ConvertTo-Json -Compress
Write-Host @"
{
  "servers": {
    "$ServerName": {
      "type": "stdio",
      "command": "azure-sdk-qa-bot-mcp-server",
      "args": [],
      "env": $envConfigJson
    }
  }
}
"@ -ForegroundColor Cyan

Write-Host ""
Write-Host "Claude Desktop (add to claude_desktop_config.json):" -ForegroundColor White
Write-Host @"
{
  "mcpServers": {
    "$ServerName": {
      "command": "azure-sdk-qa-bot-mcp-server",
      "args": [],
      "env": $envConfigJson
    }
  }
}
"@ -ForegroundColor Cyan

Write-Host ""
Write-Host "Installation completed! 🚀" -ForegroundColor Green
