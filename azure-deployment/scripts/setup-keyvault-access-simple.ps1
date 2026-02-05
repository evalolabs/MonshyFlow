# Setup Key Vault Access for all Container Apps
param(
    [string]$ResourceGroupName = "",
    [string]$KeyVaultName = ""
)

# Load local configuration if it exists
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configDir = Split-Path -Parent $scriptDir
$localConfigPath = Join-Path $configDir "config.local.ps1"

if (Test-Path $localConfigPath) {
    Write-Host "Loading local configuration from config.local.ps1..." -ForegroundColor Cyan
    . $localConfigPath
    
    # Use local config values if parameters not provided
    if ([string]::IsNullOrEmpty($ResourceGroupName)) {
        $ResourceGroupName = $RESOURCE_GROUP_NAME
    }
    if ([string]::IsNullOrEmpty($KeyVaultName)) {
        $KeyVaultName = $KEY_VAULT_NAME
    }
} else {
    # Require parameters if no local config
    if ([string]::IsNullOrEmpty($ResourceGroupName)) {
        Write-Host "❌ ResourceGroupName is required!" -ForegroundColor Red
        Write-Host "   Either provide -ResourceGroupName parameter or create config.local.ps1" -ForegroundColor Yellow
        exit 1
    }
    if ([string]::IsNullOrEmpty($KeyVaultName)) {
        $KeyVaultName = "monshy-kv"
    }
}

Write-Host "Setting up Key Vault Access..." -ForegroundColor Cyan
Write-Host ""

# Get Key Vault resource ID
$keyVaultId = az keyvault show --name $KeyVaultName --resource-group $ResourceGroupName --query id -o tsv
Write-Host "Key Vault ID: $keyVaultId" -ForegroundColor Green
Write-Host ""

# Services to configure
$services = @("auth-service", "secrets-service", "api-service", "execution-service", "scheduler-service")

foreach ($service in $services) {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Configuring: $service" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Cyan
    
    # Enable Managed Identity
    Write-Host "1. Enabling Managed Identity..." -ForegroundColor Yellow
    az containerapp identity assign --name $service --resource-group $ResourceGroupName --system-assigned --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK" -ForegroundColor Green
    } else {
        Write-Host "   (Might already be enabled)" -ForegroundColor Gray
    }
    
    # Get Principal ID
    $principalId = az containerapp show --name $service --resource-group $ResourceGroupName --query "identity.principalId" -o tsv
    
    if ($principalId) {
        Write-Host "   Principal ID: $principalId" -ForegroundColor Gray
        
        # Grant Key Vault Secrets User role
        Write-Host "2. Granting Key Vault Secrets User role..." -ForegroundColor Yellow
        az role assignment create --role "Key Vault Secrets User" --assignee $principalId --scope $keyVaultId --output none
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   OK" -ForegroundColor Green
        } else {
            Write-Host "   (Might already exist)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   Failed to get Principal ID" -ForegroundColor Red
    }
    
    Write-Host ""
    Start-Sleep -Seconds 1
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Note: RBAC role assignments can take 2-3 minutes to propagate." -ForegroundColor Yellow

