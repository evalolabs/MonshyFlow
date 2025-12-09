# PowerShell Script to show summary of all created Azure resources for Monshy

param(
    [string]$ResourceGroupName = "monshy-rg"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Azure Resources Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroupName"
Write-Host ""

# Check if resource group exists
$rgExists = az group show --name $ResourceGroupName 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Resource Group '$ResourceGroupName' does not exist." -ForegroundColor Red
    exit 1
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resource Group" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
az group show --name $ResourceGroupName --output table

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "All Resources in Resource Group" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
az resource list --resource-group $ResourceGroupName --output table

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Container Registry" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$acrName = az acr list --resource-group $ResourceGroupName --query "[0].name" -o tsv 2>$null
if ($acrName) {
    az acr show --name $acrName --resource-group $ResourceGroupName --output table
    Write-Host ""
    $loginServer = az acr show --name $acrName --query loginServer -o tsv
    Write-Host "Login Server: $loginServer"
} else {
    Write-Host "No Container Registry found"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Container Apps Environment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$envName = az containerapp env list --resource-group $ResourceGroupName --query "[0].name" -o tsv 2>$null
if ($envName) {
    az containerapp env show --name $envName --resource-group $ResourceGroupName --output table
} else {
    Write-Host "No Container Apps Environment found"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Cosmos DB" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$cosmosName = az cosmosdb list --resource-group $ResourceGroupName --query "[0].name" -o tsv 2>$null
if ($cosmosName) {
    az cosmosdb show --name $cosmosName --resource-group $ResourceGroupName --output table
    Write-Host ""
    Write-Host "Connection String:"
    $connString = az cosmosdb keys list --resource-group $ResourceGroupName --name $cosmosName --type connection-strings --query connectionStrings[0].connectionString -o tsv
    Write-Host $connString
} else {
    Write-Host "No Cosmos DB account found"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Redis Cache" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$redisName = az redis list --resource-group $ResourceGroupName --query "[0].name" -o tsv 2>$null
if ($redisName) {
    az redis show --name $redisName --resource-group $ResourceGroupName --output table
    Write-Host ""
    $redisHost = az redis show --resource-group $ResourceGroupName --name $redisName --query hostName -o tsv
    $redisSslPort = az redis show --resource-group $ResourceGroupName --name $redisName --query sslPort -o tsv
    $redisKey = az redis list-keys --resource-group $ResourceGroupName --name $redisName --query primaryKey -o tsv
    Write-Host "Connection String: $redisHost`:$redisSslPort,password=$redisKey,ssl=True"
} else {
    Write-Host "No Redis Cache found"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Key Vault" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$kvName = az keyvault list --resource-group $ResourceGroupName --query "[0].name" -o tsv 2>$null
if ($kvName) {
    az keyvault show --name $kvName --resource-group $ResourceGroupName --output table
    Write-Host ""
    $vaultUri = az keyvault show --name $kvName --query properties.vaultUri -o tsv
    Write-Host "Vault URI: $vaultUri"
} else {
    Write-Host "No Key Vault found"
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Summary complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Review all connection strings and save them securely"
Write-Host "  2. Add secrets to Key Vault"
Write-Host "  3. Build and push Docker images to ACR"
Write-Host "  4. Deploy Container Apps"

