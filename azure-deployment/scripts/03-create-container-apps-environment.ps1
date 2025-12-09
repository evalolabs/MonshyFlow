# PowerShell Script to create Azure Container Apps Environment for Monshy

param(
    [string]$ResourceGroupName = "monshy-rg",
    [string]$Location = "westeurope",
    [string]$EnvName = "monshy-env",
    [string]$LogAnalyticsWorkspace = "monshy-logs"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Creating Container Apps Environment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroupName"
Write-Host "Environment Name: $EnvName"
Write-Host "Location: $Location"
Write-Host ""

# Check if resource group exists
$rgExists = az group show --name $ResourceGroupName 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Resource Group '$ResourceGroupName' does not exist." -ForegroundColor Red
    Write-Host "   Please run .\01-create-resource-group.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Check if Log Analytics Workspace exists, create if not
Write-Host "Checking Log Analytics Workspace..."
$laExists = az monitor log-analytics workspace show --resource-group $ResourceGroupName --workspace-name $LogAnalyticsWorkspace 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Log Analytics Workspace..."
    az monitor log-analytics workspace create `
        --resource-group $ResourceGroupName `
        --workspace-name $LogAnalyticsWorkspace `
        --location $Location `
        --output table
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Log Analytics Workspace created" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create Log Analytics Workspace" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Log Analytics Workspace already exists" -ForegroundColor Green
}

# Get Log Analytics Workspace ID
$logAnalyticsId = az monitor log-analytics workspace show `
    --resource-group $ResourceGroupName `
    --workspace-name $LogAnalyticsWorkspace `
    --query customerId -o tsv

$logAnalyticsKey = az monitor log-analytics workspace get-shared-keys `
    --resource-group $ResourceGroupName `
    --workspace-name $LogAnalyticsWorkspace `
    --query primarySharedKey -o tsv

Write-Host ""
Write-Host "Creating Container Apps Environment..."
az containerapp env create `
    --name $EnvName `
    --resource-group $ResourceGroupName `
    --location $Location `
    --logs-workspace-id $logAnalyticsId `
    --logs-workspace-key $logAnalyticsKey `
    --output table

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container Apps Environment '$EnvName' created successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create Container Apps Environment" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Environment Details" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
az containerapp env show --name $EnvName --resource-group $ResourceGroupName --output table

Write-Host ""
Write-Host "✅ Container Apps Environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Run: .\04-create-cosmos-db.ps1"
Write-Host "  2. Run: .\05-create-redis-cache.ps1"
Write-Host "  3. Run: .\06-create-key-vault.ps1"

