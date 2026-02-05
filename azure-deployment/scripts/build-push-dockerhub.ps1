# Build and Push Docker Images to Docker Hub
# For Open Source projects - uses Docker Hub (free) instead of ACR

param(
    [string]$DockerHubUsername = "",
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
}

if ([string]::IsNullOrEmpty($DockerHubUsername)) {
    Write-Host "❌ Docker Hub Username is required!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\build-push-dockerhub.ps1 -DockerHubUsername <your-username>" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or create config.local.ps1 with DOCKER_HUB_USERNAME variable" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Yellow
    Write-Host "  .\build-push-dockerhub.ps1 -DockerHubUsername monshy" -ForegroundColor Gray
    exit 1
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Building and Pushing Images to Docker Hub" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Docker Hub Username: $DockerHubUsername" -ForegroundColor Yellow
Write-Host "Image Tag: $ImageTag" -ForegroundColor Yellow
Write-Host ""

# Check if Docker is running
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if already logged in to Docker Hub
Write-Host "Checking Docker Hub login status..." -ForegroundColor Yellow
$dockerConfig = "$env:USERPROFILE\.docker\config.json"
$isLoggedIn = $false

if (Test-Path $dockerConfig) {
    $config = Get-Content $dockerConfig -Raw | ConvertFrom-Json
    if ($config.auths -and $config.auths.'https://index.docker.io/v1/') {
        $isLoggedIn = $true
        Write-Host "✅ Already logged in to Docker Hub" -ForegroundColor Green
    }
}

if (-not $isLoggedIn) {
    Write-Host "⚠️  Not logged in to Docker Hub" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please login manually first:" -ForegroundColor Cyan
    Write-Host "  1. Open PowerShell or Command Prompt" -ForegroundColor Gray
    Write-Host "  2. Run: docker login -u $DockerHubUsername" -ForegroundColor Gray
    Write-Host "  3. Enter your Docker Hub password" -ForegroundColor Gray
    Write-Host "  4. Then run this script again" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or continue anyway (will fail if not logged in)..." -ForegroundColor Yellow
    $continue = Read-Host "Continue? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 0
    }
}

Write-Host ""

# Get script directory (assumes script is in azure-deployment/scripts)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)

# Change to project root
Set-Location $projectRoot

Write-Host "Project root: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Services to build
$services = @(
    @{ Name = "api-service"; Dockerfile = "packages/api-service/Dockerfile" },
    @{ Name = "auth-service"; Dockerfile = "packages/auth-service/Dockerfile" },
    @{ Name = "secrets-service"; Dockerfile = "packages/secrets-service/Dockerfile" },
    @{ Name = "execution-service"; Dockerfile = "packages/execution-service/Dockerfile" },
    @{ Name = "scheduler-service"; Dockerfile = "packages/scheduler-service/Dockerfile" }
)

$successCount = 0
$failCount = 0

foreach ($service in $services) {
    $imageName = "$DockerHubUsername/monshy-$($service.Name):$ImageTag"
    
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "Building: $($service.Name)" -ForegroundColor Yellow
    Write-Host "Image: $imageName" -ForegroundColor Gray
    Write-Host "==========================================" -ForegroundColor Cyan
    
    # Build image
    Write-Host "Building Docker image..." -ForegroundColor Yellow
    docker build -t $imageName -f $service.Dockerfile .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Image built successfully" -ForegroundColor Green
        
        # Push image
        Write-Host "Pushing to Docker Hub..." -ForegroundColor Yellow
        docker push $imageName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Image pushed successfully" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "❌ Failed to push image" -ForegroundColor Red
            $failCount++
        }
    } else {
        Write-Host "❌ Failed to build image" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ Build Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Successfully built and pushed: $successCount images" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "  ❌ Failed: $failCount images" -ForegroundColor Red
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update Container Apps to use Docker Hub images:" -ForegroundColor Yellow
Write-Host "   az containerapp update --name <service> --resource-group <your-resource-group> --image $DockerHubUsername/monshy-<service>:latest" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Or use the update script:" -ForegroundColor Yellow
Write-Host "   .\update-container-apps-dockerhub.ps1 -DockerHubUsername $DockerHubUsername" -ForegroundColor Gray

