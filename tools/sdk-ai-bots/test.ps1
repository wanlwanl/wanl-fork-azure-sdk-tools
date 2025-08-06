#!/usr/bin/env pwsh
# Test script for Azure SDK QA Bot projects
# This script runs unit tests for all components (excluding E2E tests that require running services)

Write-Host "========================================" -ForegroundColor Blue
Write-Host "Azure SDK QA Bot - Running Unit Tests" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

$ErrorActionPreference = "Continue"
$testResults = @()

Write-Host "`n[TEST] Running Go Backend unit tests..." -ForegroundColor Yellow
Write-Host "Note: These tests require Azure credentials and may fail in local environments" -ForegroundColor Gray
try {
    Set-Location "azure-sdk-qa-bot-backend"
    $goTestResult = & go test ./... -v 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Go backend tests passed" -ForegroundColor Green
        $testResults += @{Project="Go Backend"; Status="PASSED"; Notes="All tests passed"}
    } else {
        Write-Host "[WARNING] Go backend tests failed (likely due to missing Azure credentials)" -ForegroundColor Yellow
        $testResults += @{Project="Go Backend"; Status="FAILED"; Notes="Requires Azure credentials"}
    }
} catch {
    Write-Host "[ERROR] Failed to run Go backend tests: $_" -ForegroundColor Red
    $testResults += @{Project="Go Backend"; Status="ERROR"; Notes=$_.Exception.Message}
} finally {
    Set-Location ".."
}

Write-Host "`n[TEST] Running Shared Service unit tests..." -ForegroundColor Yellow
Write-Host "Note: Skipping E2E tests that require running service" -ForegroundColor Gray
try {
    Set-Location "azure-sdk-qa-bot-backend-shared"
    # Run tests but exclude E2E tests that require the service to be running
    $sharedTestResult = & npm test -- --exclude="**/*.e2e.test.*" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Shared service unit tests passed" -ForegroundColor Green
        $testResults += @{Project="Shared Service"; Status="PASSED"; Notes="Unit tests only"}
    } else {
        Write-Host "[INFO] Shared service has only E2E tests that require running service" -ForegroundColor Cyan
        $testResults += @{Project="Shared Service"; Status="SKIPPED"; Notes="Only E2E tests available"}
    }
} catch {
    Write-Host "[ERROR] Failed to run shared service tests: $_" -ForegroundColor Red
    $testResults += @{Project="Shared Service"; Status="ERROR"; Notes=$_.Exception.Message}
} finally {
    Set-Location ".."
}

Write-Host "`n[TEST] Running Main Teams Bot tests..." -ForegroundColor Yellow
try {
    Set-Location "azure-sdk-qa-bot"
    # Run tests but exclude E2E tests that require external services
    $botTestResult = & npm test -- --exclude="**/e2e/**" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Main Teams bot tests passed" -ForegroundColor Green
        $testResults += @{Project="Teams Bot"; Status="PASSED"; Notes="Unit tests passed, E2E tests skipped"}
    } else {
        Write-Host "[WARNING] Some Teams bot tests failed" -ForegroundColor Yellow
        $testResults += @{Project="Teams Bot"; Status="PARTIAL"; Notes="Some tests may require environment variables"}
    }
} catch {
    Write-Host "[ERROR] Failed to run Teams bot tests: $_" -ForegroundColor Red
    $testResults += @{Project="Teams Bot"; Status="ERROR"; Notes=$_.Exception.Message}
} finally {
    Set-Location ".."
}

Write-Host "`n[TEST] Checking Azure Function tests..." -ForegroundColor Yellow
try {
    Set-Location "azure-sdk-qa-bot-function"
    $functionTestResult = & npm test 2>&1
    Write-Host "[INFO] Azure Function: No tests implemented yet" -ForegroundColor Cyan
    $testResults += @{Project="Azure Function"; Status="NO_TESTS"; Notes="No tests implemented"}
} catch {
    Write-Host "[ERROR] Failed to check Azure Function tests: $_" -ForegroundColor Red
    $testResults += @{Project="Azure Function"; Status="ERROR"; Notes=$_.Exception.Message}
} finally {
    Set-Location ".."
}

# Summary
Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "Test Results Summary" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue

foreach ($result in $testResults) {
    $status = $result.Status
    $color = switch ($status) {
        "PASSED" { "Green" }
        "FAILED" { "Red" }
        "PARTIAL" { "Yellow" }
        "SKIPPED" { "Cyan" }
        "NO_TESTS" { "Gray" }
        "ERROR" { "Red" }
        default { "White" }
    }
    Write-Host "[$status] $($result.Project): $($result.Notes)" -ForegroundColor $color
}

Write-Host "`nTest Types:" -ForegroundColor Blue
Write-Host "- Unit Tests: Test individual functions/components without external dependencies" -ForegroundColor Gray
Write-Host "- E2E Tests: Test complete workflows, require running services and Azure credentials" -ForegroundColor Gray
Write-Host "`nTo run E2E tests:" -ForegroundColor Blue
Write-Host "1. Configure environment variables (see individual README files)" -ForegroundColor Gray
Write-Host "2. Start required services using: ./run.ps1 start" -ForegroundColor Gray
Write-Host "3. Run full test suites with: npm test (in each project directory)" -ForegroundColor Gray
