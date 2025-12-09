#!/bin/bash
# Script to create Azure Container Registry (ACR) for Monshy

set -e

# Configuration
RESOURCE_GROUP_NAME="${RESOURCE_GROUP_NAME:-monshy-rg}"
LOCATION="${LOCATION:-westeurope}"
ACR_NAME="${ACR_NAME:-monshyregistry}"
ACR_SKU="${ACR_SKU:-Basic}"

echo "=========================================="
echo "Creating Azure Container Registry"
echo "=========================================="
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "ACR Name: $ACR_NAME"
echo "SKU: $ACR_SKU"
echo ""

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
    echo "❌ Resource Group '$RESOURCE_GROUP_NAME' does not exist."
    echo "   Please run ./01-create-resource-group.sh first"
    exit 1
fi

# Check if ACR name is available (must be globally unique)
echo "Checking ACR name availability..."
if az acr check-name --name "$ACR_NAME" --query nameAvailable -o tsv | grep -q "false"; then
    echo "❌ ACR name '$ACR_NAME' is not available. Please choose a different name."
    echo "   ACR names must be globally unique and 5-50 alphanumeric characters."
    exit 1
fi

echo "✅ ACR name '$ACR_NAME' is available"
echo ""

# Create ACR
echo "Creating Azure Container Registry..."
az acr create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$ACR_NAME" \
    --sku "$ACR_SKU" \
    --admin-enabled true \
    --output table

if [ $? -eq 0 ]; then
    echo "✅ Container Registry '$ACR_NAME' created successfully!"
else
    echo "❌ Failed to create Container Registry"
    exit 1
fi

echo ""
echo "=========================================="
echo "ACR Details"
echo "=========================================="
az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP_NAME" --output table

echo ""
echo "=========================================="
echo "ACR Login Server"
echo "=========================================="
LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query loginServer -o tsv)
echo "Login Server: $LOGIN_SERVER"

echo ""
echo "=========================================="
echo "ACR Credentials"
echo "=========================================="
az acr credential show --name "$ACR_NAME" --output table

echo ""
echo "✅ Container Registry setup complete!"
echo ""
echo "Next steps:"
echo "  1. Login to ACR: az acr login --name $ACR_NAME"
echo "  2. Run: ./03-create-container-apps-environment.sh"
echo ""
echo "Save these values for later:"
echo "  ACR_NAME=$ACR_NAME"
echo "  ACR_LOGIN_SERVER=$LOGIN_SERVER"

