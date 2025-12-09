# PowerShell Script to create Azure Resource Group for Monshy

param(
    [string]$ResourceGroupName = "monshy-rg",
    [string]$Location = "westeurope",
    [string]$SubscriptionId = ""
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Creating Azure Resource Group" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroupName"
Write-Host "Location: $Location"
Write-Host ""

# Check if Azure CLI is installed
try {
    $azVersion = az version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Azure CLI not found"
    }
} catch {
    Write-Host "❌ Azure CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    $account = az account show 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Not logged in to Azure. Logging in..." -ForegroundColor Yellow
        az login
    }
} catch {
    Write-Host "⚠️  Not logged in to Azure. Logging in..." -ForegroundColor Yellow
    az login
}

# Set subscription if provided
if ($SubscriptionId) {
    Write-Host "Setting subscription to: $SubscriptionId"
    az account set --subscription $SubscriptionId
}

# Show current subscription
$currentSub = az account show --query name -o tsv
Write-Host "Current subscription: $currentSub"
Write-Host ""

# Check if resource group already exists
$existingRG = az group show --name $ResourceGroupName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Resource Group '$ResourceGroupName' already exists." -ForegroundColor Yellow
    $response = Read-Host "Do you want to use the existing resource group? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Aborted. Please choose a different resource group name." -ForegroundColor Red
        exit 1
    }
} else {
    # Create resource group
    Write-Host "Creating resource group..."
    az group create `
        --name $ResourceGroupName `
        --location $Location `
        --output table
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Resource Group '$ResourceGroupName' created successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create resource group" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resource Group Details" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
az group show --name $ResourceGroupName --output table

Write-Host ""
Write-Host "✅ Resource Group setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Run: .\02-create-container-registry.ps1"
Write-Host "  2. Or set variables and run all scripts:"
Write-Host "     `$env:RESOURCE_GROUP_NAME = '$ResourceGroupName'"
Write-Host "     `$env:LOCATION = '$Location'"

