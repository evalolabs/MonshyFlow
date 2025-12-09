# PowerShell Script to create Azure Cache for Redis for Monshy

param(
    [string]$ResourceGroupName = "monshy-rg",
    [string]$Location = "westeurope",
    [string]$RedisName = "monshy-redis",
    [string]$RedisSku = "Basic",
    [string]$RedisSize = "C0"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Creating Azure Cache for Redis" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroupName"
Write-Host "Redis Name: $RedisName"
Write-Host "SKU: $RedisSku"
Write-Host "Size: $RedisSize"
Write-Host ""

# Check if resource group exists
$rgExists = az group show --name $ResourceGroupName 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Resource Group '$ResourceGroupName' does not exist." -ForegroundColor Red
    Write-Host "   Please run .\01-create-resource-group.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Check if Redis name is available
Write-Host "Checking Redis name availability..."
$nameAvailable = az redis check-name --name $RedisName --query nameAvailable -o tsv
if ($nameAvailable -ne "true") {
    Write-Host "❌ Redis name '$RedisName' is not available." -ForegroundColor Red
    Write-Host "   Please choose a different name (must be globally unique, 1-63 chars, alphanumeric and hyphens)." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Redis name is available" -ForegroundColor Green
Write-Host ""

# Create Redis Cache
Write-Host "Creating Redis Cache (this may take 10-15 minutes)..." -ForegroundColor Yellow
az redis create `
    --resource-group $ResourceGroupName `
    --name $RedisName `
    --location $Location `
    --sku $RedisSku `
    --vm-size $RedisSize `
    --output table

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Redis Cache created successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create Redis Cache" -ForegroundColor Red
    exit 1
}

# Get Redis connection details
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Redis Connection Details" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$redisHost = az redis show `
    --resource-group $ResourceGroupName `
    --name $RedisName `
    --query hostName -o tsv

$redisPort = az redis show `
    --resource-group $ResourceGroupName `
    --name $RedisName `
    --query port -o tsv

$redisSslPort = az redis show `
    --resource-group $ResourceGroupName `
    --name $RedisName `
    --query sslPort -o tsv

# Get access keys
$primaryKey = az redis list-keys `
    --resource-group $ResourceGroupName `
    --name $RedisName `
    --query primaryKey -o tsv

$secondaryKey = az redis list-keys `
    --resource-group $ResourceGroupName `
    --name $RedisName `
    --query secondaryKey -o tsv

Write-Host "Host: $redisHost"
Write-Host "Port: $redisPort"
Write-Host "SSL Port: $redisSslPort"
Write-Host ""
Write-Host "Connection String (non-SSL):"
Write-Host "$redisHost`:$redisPort,password=$primaryKey"
Write-Host ""
Write-Host "Connection String (SSL):"
Write-Host "$redisHost`:$redisSslPort,password=$primaryKey,ssl=True"
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Redis Details" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
az redis show --name $RedisName --resource-group $ResourceGroupName --output table

Write-Host ""
Write-Host "✅ Redis Cache setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Save these values securely:" -ForegroundColor Yellow
Write-Host "  REDIS_NAME=$RedisName"
Write-Host "  REDIS_HOST=$redisHost"
Write-Host "  REDIS_PRIMARY_KEY=$primaryKey"
Write-Host "  REDIS_CONNECTION_STRING=$redisHost`:$redisSslPort,password=$primaryKey,ssl=True"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Run: .\06-create-key-vault.ps1"

