# PowerShell Script to create Azure Container Apps for MonshyFlow
# Fixed version that handles environment variables correctly

param(
    [string]$ResourceGroupName = "",
    [string]$EnvironmentName = "",
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
    if ([string]::IsNullOrEmpty($EnvironmentName)) {
        $EnvironmentName = $ENV_NAME
    }
    if ([string]::IsNullOrEmpty($KeyVaultName)) {
        $KeyVaultName = $KEY_VAULT_NAME
    }
} else {
    # Use defaults if no local config
    if ([string]::IsNullOrEmpty($ResourceGroupName)) {
        Write-Host "❌ ResourceGroupName is required!" -ForegroundColor Red
        Write-Host "   Either provide -ResourceGroupName parameter or create config.local.ps1" -ForegroundColor Yellow
        exit 1
    }
    if ([string]::IsNullOrEmpty($EnvironmentName)) {
        $EnvironmentName = "monshy-env"
    }
    if ([string]::IsNullOrEmpty($KeyVaultName)) {
        $KeyVaultName = "monshy-kv"
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Creating Azure Container Apps" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroupName"
Write-Host "Environment: $EnvironmentName"
Write-Host "Key Vault: $KeyVaultName"
Write-Host ""

# Check if resource group exists
$rgExists = az group show --name $ResourceGroupName 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Resource Group '$ResourceGroupName' does not exist." -ForegroundColor Red
    exit 1
}

# Check if Container Apps Environment exists
$envExists = az containerapp env show --name $EnvironmentName --resource-group $ResourceGroupName 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Container Apps Environment '$EnvironmentName' does not exist." -ForegroundColor Red
    exit 1
}

# Get Key Vault URI
$keyVaultUri = az keyvault show --name $KeyVaultName --resource-group $ResourceGroupName --query properties.vaultUri -o tsv
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Key Vault '$KeyVaultName' does not exist." -ForegroundColor Red
    exit 1
}

Write-Host "Key Vault URI: $keyVaultUri" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Creating Container Apps..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Auth Service
Write-Host "Creating auth-service..." -ForegroundColor Yellow
az containerapp create `
    --name auth-service `
    --resource-group $ResourceGroupName `
    --environment $EnvironmentName `
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest `
    --target-port 80 `
    --ingress internal `
    --min-replicas 0 `
    --max-replicas 1 `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ auth-service created" -ForegroundColor Green
    Write-Host "Setting environment variables..." -ForegroundColor Yellow
    az containerapp update `
        --name auth-service `
        --resource-group $ResourceGroupName `
        --set-env-vars `
            "PORT=80" `
            "NODE_ENV=production" `
            "MONGODB_URL=@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/MongoDBConnectionStringFlow/)" `
            "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/JwtSecretKey/)" `
            "JWT_ISSUER=monshy-auth-service" `
            "JWT_AUDIENCE=monshy-services" `
        --output none
} else {
    Write-Host "❌ Failed to create auth-service" -ForegroundColor Red
}

Write-Host ""

# 2. Secrets Service
Write-Host "Creating secrets-service..." -ForegroundColor Yellow
az containerapp create `
    --name secrets-service `
    --resource-group $ResourceGroupName `
    --environment $EnvironmentName `
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest `
    --target-port 80 `
    --ingress internal `
    --min-replicas 0 `
    --max-replicas 1 `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ secrets-service created" -ForegroundColor Green
    Write-Host "Setting environment variables..." -ForegroundColor Yellow
    az containerapp update `
        --name secrets-service `
        --resource-group $ResourceGroupName `
        --set-env-vars `
            "PORT=80" `
            "NODE_ENV=production" `
            "MONGODB_URL=@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/MongoDBConnectionStringFlow/)" `
            "SECRETS_ENCRYPTION_KEY=@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/EncryptionKey/)" `
            "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/JwtSecretKey/)" `
            "JWT_ISSUER=monshy-auth-service" `
            "JWT_AUDIENCE=monshy-services" `
            "AUTH_SERVICE_URL=http://auth-service:80" `
        --output none
} else {
    Write-Host "❌ Failed to create secrets-service" -ForegroundColor Red
}

Write-Host ""

# 3. API Service
Write-Host "Creating api-service..." -ForegroundColor Yellow
az containerapp create `
    --name api-service `
    --resource-group $ResourceGroupName `
    --environment $EnvironmentName `
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest `
    --target-port 80 `
    --ingress external `
    --min-replicas 0 `
    --max-replicas 2 `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ api-service created" -ForegroundColor Green
    Write-Host "Setting environment variables..." -ForegroundColor Yellow
    az containerapp update `
        --name api-service `
        --resource-group $ResourceGroupName `
        --set-env-vars `
            "PORT=80" `
            "NODE_ENV=production" `
            "MONGODB_URL=@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/MongoDBConnectionStringFlow/)" `
            "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/JwtSecretKey/)" `
            "JWT_ISSUER=monshy-auth-service" `
            "JWT_AUDIENCE=monshy-services" `
            "AUTH_SERVICE_URL=http://auth-service:80" `
            "SECRETS_SERVICE_URL=http://secrets-service:80" `
            "EXECUTION_SERVICE_URL=http://execution-service:5004" `
            "SCHEDULER_SERVICE_URL=http://scheduler-service:80" `
        --output none
} else {
    Write-Host "❌ Failed to create api-service" -ForegroundColor Red
}

Write-Host ""

# 4. Execution Service
Write-Host "Creating execution-service..." -ForegroundColor Yellow
az containerapp create `
    --name execution-service `
    --resource-group $ResourceGroupName `
    --environment $EnvironmentName `
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest `
    --target-port 5004 `
    --ingress internal `
    --min-replicas 0 `
    --max-replicas 2 `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ execution-service created" -ForegroundColor Green
    Write-Host "Setting environment variables..." -ForegroundColor Yellow
    az containerapp update `
        --name execution-service `
        --resource-group $ResourceGroupName `
        --set-env-vars `
            "PORT=5004" `
            "NODE_ENV=production" `
            "MONGODB_URL=@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/MongoDBConnectionStringFlow/)" `
            "SECRETS_SERVICE_URL=http://secrets-service:80" `
        --output none
} else {
    Write-Host "❌ Failed to create execution-service" -ForegroundColor Red
}

Write-Host ""

# 5. Scheduler Service
Write-Host "Creating scheduler-service..." -ForegroundColor Yellow
az containerapp create `
    --name scheduler-service `
    --resource-group $ResourceGroupName `
    --environment $EnvironmentName `
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest `
    --target-port 80 `
    --ingress internal `
    --min-replicas 0 `
    --max-replicas 1 `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ scheduler-service created" -ForegroundColor Green
    Write-Host "Setting environment variables..." -ForegroundColor Yellow
    az containerapp update `
        --name scheduler-service `
        --resource-group $ResourceGroupName `
        --set-env-vars `
            "PORT=80" `
            "NODE_ENV=production" `
            "MONGODB_URL=@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/MongoDBConnectionStringFlow/)" `
            "EXECUTION_SERVICE_URL=http://execution-service:5004" `
        --output none
} else {
    Write-Host "❌ Failed to create scheduler-service" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Container Apps created!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: These Container Apps use placeholder images." -ForegroundColor Yellow
Write-Host "   Next steps:" -ForegroundColor Yellow
Write-Host "   1. Build your Docker images" -ForegroundColor Yellow
Write-Host "   2. Push images to Azure Container Registry" -ForegroundColor Yellow
Write-Host "   3. Update Container Apps with your images" -ForegroundColor Yellow
Write-Host ""
Write-Host "Get API Service URL:" -ForegroundColor Cyan
$apiUrl = az containerapp show --name api-service --resource-group $ResourceGroupName --query properties.configuration.ingress.fqdn -o tsv 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  https://$apiUrl" -ForegroundColor Green
} else {
    Write-Host "  (Service not yet available)" -ForegroundColor Yellow
}

