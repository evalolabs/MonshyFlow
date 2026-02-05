# Set Environment Variables for all Container Apps
# Uses the working PATCH method

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

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setting Environment Variables for all Services" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host "Key Vault: $KeyVaultName" -ForegroundColor Yellow
Write-Host ""

# Get subscription ID and access token
$subscriptionId = az account show --query id -o tsv
$token = az account get-access-token --query accessToken -o tsv

# Get Key Vault URI
$keyVaultUri = az keyvault show --name $KeyVaultName --resource-group $ResourceGroupName --query properties.vaultUri -o tsv
Write-Host "Key Vault URI: $keyVaultUri" -ForegroundColor Green
Write-Host ""

$apiVersion = "2024-02-02-preview"
$baseUrl = "https://management.azure.com/subscriptions/$subscriptionId/resourceGroups/$ResourceGroupName/providers/Microsoft.App/containerApps"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Function to set environment variables
function Set-ContainerAppEnvVars {
    param(
        [string]$AppName,
        [array]$EnvVars,
        [string]$Image,
        [int]$Port = 80
    )
    
    Write-Host "Setting environment variables for $AppName..." -ForegroundColor Yellow
    
    $container = @{
        name = $AppName
        image = $Image
        env = $EnvVars
    }
    
    $patchBody = @{
        properties = @{
            template = @{
                containers = @($container)
            }
        }
    } | ConvertTo-Json -Depth 10
    
    $url = "$baseUrl/$AppName`?api-version=$apiVersion"
    
    try {
        $response = Invoke-RestMethod -Uri $url -Method PATCH -Headers $headers -Body $patchBody -ContentType "application/json"
        Write-Host "✅ $AppName - Environment variables set successfully!" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $AppName - Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 1. Auth Service
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "1. auth-service" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$envVars = @(
    @{ name = "PORT"; value = "80" },
    @{ name = "NODE_ENV"; value = "production" },
    @{ name = "MONGODB_URL"; value = "@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/MongoDBConnectionStringFlow/)" },
    @{ name = "JWT_SECRET_KEY"; value = "@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/JwtSecretKey/)" },
    @{ name = "JWT_ISSUER"; value = "monshy-auth-service" },
    @{ name = "JWT_AUDIENCE"; value = "monshy-services" }
)
Set-ContainerAppEnvVars -AppName "auth-service" -EnvVars $envVars -Image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
Write-Host ""

# 2. Secrets Service
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "2. secrets-service" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$envVars = @(
    @{ name = "PORT"; value = "80" },
    @{ name = "NODE_ENV"; value = "production" },
    @{ name = "MONGODB_URL"; value = "@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/MongoDBConnectionStringFlow/)" },
    @{ name = "SECRETS_ENCRYPTION_KEY"; value = "@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/EncryptionKey/)" },
    @{ name = "JWT_SECRET_KEY"; value = "@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/JwtSecretKey/)" },
    @{ name = "JWT_ISSUER"; value = "monshy-auth-service" },
    @{ name = "JWT_AUDIENCE"; value = "monshy-services" },
    @{ name = "AUTH_SERVICE_URL"; value = "http://auth-service:80" }
)
Set-ContainerAppEnvVars -AppName "secrets-service" -EnvVars $envVars -Image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
Write-Host ""

# 3. API Service
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "3. api-service" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$envVars = @(
    @{ name = "PORT"; value = "80" },
    @{ name = "NODE_ENV"; value = "production" },
    @{ name = "MONGODB_URL"; value = "@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/MongoDBConnectionStringFlow/)" },
    @{ name = "JWT_SECRET_KEY"; value = "@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/JwtSecretKey/)" },
    @{ name = "JWT_ISSUER"; value = "monshy-auth-service" },
    @{ name = "JWT_AUDIENCE"; value = "monshy-services" },
    @{ name = "AUTH_SERVICE_URL"; value = "http://auth-service:80" },
    @{ name = "SECRETS_SERVICE_URL"; value = "http://secrets-service:80" },
    @{ name = "EXECUTION_SERVICE_URL"; value = "http://execution-service:5004" },
    @{ name = "SCHEDULER_SERVICE_URL"; value = "http://scheduler-service:80" }
)
Set-ContainerAppEnvVars -AppName "api-service" -EnvVars $envVars -Image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
Write-Host ""

# 4. Execution Service
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "4. execution-service" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$envVars = @(
    @{ name = "PORT"; value = "5004" },
    @{ name = "NODE_ENV"; value = "production" },
    @{ name = "MONGODB_URL"; value = "@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/MongoDBConnectionStringFlow/)" },
    @{ name = "SECRETS_SERVICE_URL"; value = "http://secrets-service:80" }
)
Set-ContainerAppEnvVars -AppName "execution-service" -EnvVars $envVars -Image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
Write-Host ""

# 5. Scheduler Service
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "5. scheduler-service" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$envVars = @(
    @{ name = "PORT"; value = "80" },
    @{ name = "NODE_ENV"; value = "production" },
    @{ name = "MONGODB_URL"; value = "@Microsoft.KeyVault(SecretUri=$keyVaultUri/secrets/MongoDBConnectionStringFlow/)" },
    @{ name = "EXECUTION_SERVICE_URL"; value = "http://execution-service:5004" }
)
Set-ContainerAppEnvVars -AppName "scheduler-service" -EnvVars $envVars -Image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ All environment variables set!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify environment variables:" -ForegroundColor Yellow
Write-Host "   az containerapp show --name <service> --resource-group $ResourceGroupName --query 'properties.template.containers[0].env' -o table" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Grant Key Vault access to each Container App (if not done yet):" -ForegroundColor Yellow
Write-Host "   - Enable Managed Identity for each Container App" -ForegroundColor Gray
Write-Host "   - Grant 'Key Vault Secrets User' role" -ForegroundColor Gray

