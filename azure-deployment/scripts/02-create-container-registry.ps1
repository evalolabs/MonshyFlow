# PowerShell Script to create Azure Container Registry (ACR) for Monshy

param(
    [string]$ResourceGroupName = "monshy-rg",
    [string]$Location = "westeurope",
    [string]$AcrName = "monshyregistry",
    [string]$AcrSku = "Basic"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Creating Azure Container Registry" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroupName"
Write-Host "ACR Name: $AcrName"
Write-Host "SKU: $AcrSku"
Write-Host ""

# Check if resource group exists
$rgExists = az group show --name $ResourceGroupName 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Resource Group '$ResourceGroupName' does not exist." -ForegroundColor Red
    Write-Host "   Please run .\01-create-resource-group.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Check if ACR name is available
Write-Host "Checking ACR name availability..."
$nameAvailable = az acr check-name --name $AcrName --query nameAvailable -o tsv
if ($nameAvailable -eq "false") {
    Write-Host "❌ ACR name '$AcrName' is not available. Please choose a different name." -ForegroundColor Red
    Write-Host "   ACR names must be globally unique and 5-50 alphanumeric characters." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ ACR name '$AcrName' is available" -ForegroundColor Green
Write-Host ""

# Create ACR
Write-Host "Creating Azure Container Registry..."
az acr create `
    --resource-group $ResourceGroupName `
    --name $AcrName `
    --sku $AcrSku `
    --admin-enabled true `
    --output table

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container Registry '$AcrName' created successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create Container Registry" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ACR Details" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
az acr show --name $AcrName --resource-group $ResourceGroupName --output table

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ACR Login Server" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
$loginServer = az acr show --name $AcrName --resource-group $ResourceGroupName --query loginServer -o tsv
Write-Host "Login Server: $loginServer"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ACR Credentials" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
az acr credential show --name $AcrName --output table

Write-Host ""
Write-Host "✅ Container Registry setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Login to ACR: az acr login --name $AcrName"
Write-Host "  2. Run: .\03-create-container-apps-environment.ps1"
Write-Host ""
Write-Host "Save these values for later:"
Write-Host "  ACR_NAME=$AcrName"
Write-Host "  ACR_LOGIN_SERVER=$loginServer"

