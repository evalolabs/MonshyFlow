# Update Container Apps to use Docker Hub images

param(
    [string]$DockerHubUsername = "",
    [string]$ResourceGroupName = "",
    [string]$ImageTag = "latest"
)

# Load local configuration if it exists
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$configDir = Split-Path -Parent $scriptDir
$localConfigPath = Join-Path $configDir "config.local.ps1"

if (Test-Path $localConfigPath) {
    Write-Host "Loading local configuration from config.local.ps1..." -ForegroundColor Cyan
    . $localConfigPath
    
    # Use local config values if parameters not provided
    if ([string]::IsNullOrEmpty($DockerHubUsername)) {
        $DockerHubUsername = $DOCKER_HUB_USERNAME
    }
    if ([string]::IsNullOrEmpty($ResourceGroupName)) {
        $ResourceGroupName = $RESOURCE_GROUP_NAME
    }
} else {
    # Require parameters if no local config
    if ([string]::IsNullOrEmpty($DockerHubUsername)) {
        Write-Host "❌ Docker Hub Username is required!" -ForegroundColor Red
        Write-Host "   Either provide -DockerHubUsername parameter or create config.local.ps1" -ForegroundColor Yellow
        exit 1
    }
    if ([string]::IsNullOrEmpty($ResourceGroupName)) {
        Write-Host "❌ ResourceGroupName is required!" -ForegroundColor Red
        Write-Host "   Either provide -ResourceGroupName parameter or create config.local.ps1" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Updating Container Apps to Docker Hub" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Docker Hub Username: $DockerHubUsername" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow
Write-Host ""

# Services to update
$services = @(
    "api-service",
    "auth-service",
    "secrets-service",
    "execution-service",
    "scheduler-service"
)

$successCount = 0
$failCount = 0

foreach ($service in $services) {
    $imageName = "$DockerHubUsername/monshy-$service`:$ImageTag"
    
    Write-Host "Updating $service..." -ForegroundColor Yellow
    Write-Host "  Image: $imageName" -ForegroundColor Gray
    
    az containerapp update `
        --name $service `
        --resource-group $ResourceGroupName `
        --image $imageName `
        --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Updated successfully" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ❌ Failed to update" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Update Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Successfully updated: $successCount services" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "  ❌ Failed: $failCount services" -ForegroundColor Red
}
Write-Host ""
Write-Host "Check Container App status:" -ForegroundColor Cyan
Write-Host "  az containerapp show --name api-service --resource-group $ResourceGroupName --query 'properties.runningStatus' -o tsv" -ForegroundColor Gray

