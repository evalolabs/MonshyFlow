# PowerShell Script to create Azure Cosmos DB (MongoDB API) for Monshy

param(
    [string]$ResourceGroupName = "monshy-rg",
    [string]$Location = "westeurope",
    [string]$CosmosAccountName = "monshy-cosmos",
    [string]$DatabaseName = "agentbuilder",
    [string]$CosmosSku = "Serverless"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Creating Azure Cosmos DB (MongoDB API)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroupName"
Write-Host "Account Name: $CosmosAccountName"
Write-Host "Database: $DatabaseName"
Write-Host "SKU: $CosmosSku"
Write-Host ""

# Check if resource group exists
$rgExists = az group show --name $ResourceGroupName 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Resource Group '$ResourceGroupName' does not exist." -ForegroundColor Red
    Write-Host "   Please run .\01-create-resource-group.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Check if Cosmos DB account name is available
Write-Host "Checking Cosmos DB account name availability..."
$nameAvailable = az cosmosdb check-name-exists --name $CosmosAccountName --query nameAvailable -o tsv
if ($nameAvailable -ne "true") {
    Write-Host "❌ Cosmos DB account name '$CosmosAccountName' is not available." -ForegroundColor Red
    Write-Host "   Please choose a different name (must be globally unique, lowercase, 3-44 chars)." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Cosmos DB account name is available" -ForegroundColor Green
Write-Host ""

# Create Cosmos DB account
Write-Host "Creating Cosmos DB account (this may take a few minutes)..." -ForegroundColor Yellow
if ($CosmosSku -eq "Serverless") {
    az cosmosdb create `
        --resource-group $ResourceGroupName `
        --name $CosmosAccountName `
        --locations regionName=$Location `
        --default-consistency-level Session `
        --capabilities EnableServerless `
        --output table
} else {
    az cosmosdb create `
        --resource-group $ResourceGroupName `
        --name $CosmosAccountName `
        --locations regionName=$Location `
        --default-consistency-level Session `
        --output table
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cosmos DB account created successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create Cosmos DB account" -ForegroundColor Red
    exit 1
}

# Create MongoDB database
Write-Host ""
Write-Host "Creating MongoDB database..."
az cosmosdb mongodb database create `
    --resource-group $ResourceGroupName `
    --account-name $CosmosAccountName `
    --name $DatabaseName `
    --output table

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database '$DatabaseName' created successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Database creation failed (might already exist)" -ForegroundColor Yellow
}

# Get connection string
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Connection String" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$connectionString = az cosmosdb keys list `
    --resource-group $ResourceGroupName `
    --name $CosmosAccountName `
    --type connection-strings `
    --query connectionStrings[0].connectionString -o tsv

Write-Host "Connection String:"
Write-Host $connectionString
Write-Host ""
Write-Host "MongoDB Connection String Format:"
Write-Host "mongodb://<account>:<key>@${CosmosAccountName}.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb"
Write-Host ""

# Get account key
$primaryKey = az cosmosdb keys list `
    --resource-group $ResourceGroupName `
    --name $CosmosAccountName `
    --query primaryMasterKey -o tsv

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Account Details" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
az cosmosdb show --name $CosmosAccountName --resource-group $ResourceGroupName --output table

Write-Host ""
Write-Host "✅ Cosmos DB setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Save these values securely:" -ForegroundColor Yellow
Write-Host "  COSMOS_ACCOUNT_NAME=$CosmosAccountName"
Write-Host "  COSMOS_PRIMARY_KEY=$primaryKey"
Write-Host "  COSMOS_CONNECTION_STRING=$connectionString"
Write-Host ""
Write-Host "MongoDB Connection String (for appsettings):"
Write-Host "mongodb://${CosmosAccountName}:${primaryKey}@${CosmosAccountName}.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Run: .\05-create-redis-cache.ps1"

