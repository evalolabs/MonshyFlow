# Master PowerShell script to create all Azure resources for Monshy
# This script runs all resource creation scripts in sequence

param(
    [string]$ResourceGroupName = "monshy-rg",
    [string]$Location = "westeurope"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Monshy Azure Resources Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will create all necessary Azure resources:"
Write-Host "  1. Resource Group"
Write-Host "  2. Container Registry (ACR)"
Write-Host "  3. Container Apps Environment"
Write-Host "  4. Cosmos DB (MongoDB API)"
Write-Host "  5. Redis Cache"
Write-Host "  6. Key Vault"
Write-Host ""
$response = Read-Host "Do you want to continue? (y/n)"
if ($response -ne "y" -and $response -ne "Y") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting resource creation..." -ForegroundColor Green
Write-Host ""

# Set environment variables
$env:RESOURCE_GROUP_NAME = $ResourceGroupName
$env:LOCATION = $Location

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Run all scripts in sequence
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 1/6: Resource Group" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
& "$scriptDir\01-create-resource-group.ps1" -ResourceGroupName $ResourceGroupName -Location $Location
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 2/6: Container Registry" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
& "$scriptDir\02-create-container-registry.ps1" -ResourceGroupName $ResourceGroupName -Location $Location
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 3/6: Container Apps Environment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
& "$scriptDir\03-create-container-apps-environment.ps1" -ResourceGroupName $ResourceGroupName -Location $Location
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 4/6: Cosmos DB" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
& "$scriptDir\04-create-cosmos-db.ps1" -ResourceGroupName $ResourceGroupName -Location $Location
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 5/6: Redis Cache" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
& "$scriptDir\05-create-redis-cache.ps1" -ResourceGroupName $ResourceGroupName -Location $Location
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Step 6/6: Key Vault" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
& "$scriptDir\06-create-key-vault.ps1" -ResourceGroupName $ResourceGroupName -Location $Location
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
& "$scriptDir\07-summary.ps1" -ResourceGroupName $ResourceGroupName

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ All resources created successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Add secrets to Key Vault (see script output above)"
Write-Host "  2. Save all connection strings securely"
Write-Host "  3. Build and push Docker images to ACR"
Write-Host "  4. Deploy Container Apps"

