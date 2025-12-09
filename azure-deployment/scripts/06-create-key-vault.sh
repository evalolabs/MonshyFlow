#!/bin/bash
# Script to create Azure Key Vault for Monshy

set -e

# Configuration
RESOURCE_GROUP_NAME="${RESOURCE_GROUP_NAME:-monshy-rg}"
LOCATION="${LOCATION:-westeurope}"
KEY_VAULT_NAME="${KEY_VAULT_NAME:-monshy-kv}"

echo "=========================================="
echo "Creating Azure Key Vault"
echo "=========================================="
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Key Vault Name: $KEY_VAULT_NAME"
echo ""

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
    echo "❌ Resource Group '$RESOURCE_GROUP_NAME' does not exist."
    echo "   Please run ./01-create-resource-group.sh first"
    exit 1
fi

# Check if Key Vault name is available
echo "Checking Key Vault name availability..."
if ! az keyvault check-name --name "$KEY_VAULT_NAME" --query nameAvailable -o tsv | grep -q "true"; then
    echo "❌ Key Vault name '$KEY_VAULT_NAME' is not available."
    echo "   Please choose a different name (must be globally unique, 3-24 chars, alphanumeric and hyphens)."
    exit 1
fi

echo "✅ Key Vault name is available"
echo ""

# Create Key Vault
echo "Creating Key Vault..."
az keyvault create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$KEY_VAULT_NAME" \
    --location "$LOCATION" \
    --enabled-for-deployment true \
    --enabled-for-template-deployment true \
    --enabled-for-disk-encryption false \
    --output table

if [ $? -eq 0 ]; then
    echo "✅ Key Vault created successfully!"
else
    echo "❌ Failed to create Key Vault"
    exit 1
fi

echo ""
echo "=========================================="
echo "Key Vault Details"
echo "=========================================="
az keyvault show --name "$KEY_VAULT_NAME" --resource-group "$RESOURCE_GROUP_NAME" --output table

echo ""
echo "✅ Key Vault setup complete!"
echo ""
echo "Next steps:"
echo "  1. Add secrets to Key Vault:"
echo "     az keyvault secret set --vault-name $KEY_VAULT_NAME --name JwtSecretKey --value '<your-secret>'"
echo "     az keyvault secret set --vault-name $KEY_VAULT_NAME --name EncryptionKey --value '<your-key>'"
echo "     az keyvault secret set --vault-name $KEY_VAULT_NAME --name OpenAIApiKey --value '<your-key>'"
echo ""
echo "  2. Run: ./07-summary.sh to see all created resources"

