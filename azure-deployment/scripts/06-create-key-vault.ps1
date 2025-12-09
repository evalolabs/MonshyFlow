# PowerShell Script to create Azure Key Vault for Monshy

param(
    [string]$ResourceGroupName = "monshy-rg",
    [string]$Location = "westeurope",
    [string]$KeyVaultName = "monshy-kv"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Creating Azure Key Vault" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Resource Group: $ResourceGroupName"
Write-Host "Key Vault Name: $KeyVaultName"
Write-Host ""

# Check if resource group exists
$rgExists = az group show --name $ResourceGroupName 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Resource Group '$ResourceGroupName' does not exist." -ForegroundColor Red
    Write-Host "   Please run .\01-create-resource-group.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Check if Key Vault name is available
Write-Host "Checking Key Vault name availability..."
$nameAvailable = az keyvault check-name --name $KeyVaultName --query nameAvailable -o tsv
if ($nameAvailable -ne "true") {
    Write-Host "❌ Key Vault name '$KeyVaultName' is not available." -ForegroundColor Red
    Write-Host "   Please choose a different name (must be globally unique, 3-24 chars, alphanumeric and hyphens)." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Key Vault name is available" -ForegroundColor Green
Write-Host ""

# Create Key Vault
Write-Host "Creating Key Vault..."
az keyvault create `
    --resource-group $ResourceGroupName `
    --name $KeyVaultName `
    --location $Location `
    --enabled-for-deployment true `
    --enabled-for-template-deployment true `
    --enabled-for-disk-encryption false `
    --output table

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Key Vault created successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create Key Vault" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Key Vault Details" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
az keyvault show --name $KeyVaultName --resource-group $ResourceGroupName --output table

Write-Host ""
Write-Host "✅ Key Vault setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Add secrets to Key Vault:"
Write-Host "     az keyvault secret set --vault-name $KeyVaultName --name JwtSecretKey --value '<your-secret>'"
Write-Host "     az keyvault secret set --vault-name $KeyVaultName --name EncryptionKey --value '<your-key>'"
Write-Host "     az keyvault secret set --vault-name $KeyVaultName --name OpenAIApiKey --value '<your-key>'"
Write-Host ""
Write-Host "  2. Run: .\07-summary.ps1 to see all created resources"

