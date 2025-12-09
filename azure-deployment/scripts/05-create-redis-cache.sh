#!/bin/bash
# Script to create Azure Cache for Redis for Monshy

set -e

# Configuration
RESOURCE_GROUP_NAME="${RESOURCE_GROUP_NAME:-monshy-rg}"
LOCATION="${LOCATION:-westeurope}"
REDIS_NAME="${REDIS_NAME:-monshy-redis}"
REDIS_SKU="${REDIS_SKU:-Basic}"
REDIS_SIZE="${REDIS_SIZE:-C0}"

echo "=========================================="
echo "Creating Azure Cache for Redis"
echo "=========================================="
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Redis Name: $REDIS_NAME"
echo "SKU: $REDIS_SKU"
echo "Size: $REDIS_SIZE"
echo ""

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
    echo "❌ Resource Group '$RESOURCE_GROUP_NAME' does not exist."
    echo "   Please run ./01-create-resource-group.sh first"
    exit 1
fi

# Check if Redis name is available
echo "Checking Redis name availability..."
if ! az redis check-name --name "$REDIS_NAME" --query nameAvailable -o tsv | grep -q "true"; then
    echo "❌ Redis name '$REDIS_NAME' is not available."
    echo "   Please choose a different name (must be globally unique, 1-63 chars, alphanumeric and hyphens)."
    exit 1
fi

echo "✅ Redis name is available"
echo ""

# Create Redis Cache
echo "Creating Redis Cache (this may take 10-15 minutes)..."
az redis create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$REDIS_NAME" \
    --location "$LOCATION" \
    --sku "$REDIS_SKU" \
    --vm-size "$REDIS_SIZE" \
    --output table

if [ $? -eq 0 ]; then
    echo "✅ Redis Cache created successfully!"
else
    echo "❌ Failed to create Redis Cache"
    exit 1
fi

# Get Redis connection details
echo ""
echo "=========================================="
echo "Redis Connection Details"
echo "=========================================="
REDIS_HOST=$(az redis show \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$REDIS_NAME" \
    --query hostName -o tsv)

REDIS_PORT=$(az redis show \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$REDIS_NAME" \
    --query port -o tsv)

REDIS_SSL_PORT=$(az redis show \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$REDIS_NAME" \
    --query sslPort -o tsv)

# Get access keys
PRIMARY_KEY=$(az redis list-keys \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$REDIS_NAME" \
    --query primaryKey -o tsv)

SECONDARY_KEY=$(az redis list-keys \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$REDIS_NAME" \
    --query secondaryKey -o tsv)

echo "Host: $REDIS_HOST"
echo "Port: $REDIS_PORT"
echo "SSL Port: $REDIS_SSL_PORT"
echo ""
echo "Connection String (non-SSL):"
echo "$REDIS_HOST:$REDIS_PORT,password=$PRIMARY_KEY"
echo ""
echo "Connection String (SSL):"
echo "$REDIS_HOST:$REDIS_SSL_PORT,password=$PRIMARY_KEY,ssl=True"
echo ""

echo "=========================================="
echo "Redis Details"
echo "=========================================="
az redis show --name "$REDIS_NAME" --resource-group "$RESOURCE_GROUP_NAME" --output table

echo ""
echo "✅ Redis Cache setup complete!"
echo ""
echo "⚠️  IMPORTANT: Save these values securely:"
echo "  REDIS_NAME=$REDIS_NAME"
echo "  REDIS_HOST=$REDIS_HOST"
echo "  REDIS_PRIMARY_KEY=$PRIMARY_KEY"
echo "  REDIS_CONNECTION_STRING=$REDIS_HOST:$REDIS_SSL_PORT,password=$PRIMARY_KEY,ssl=True"
echo ""
echo "Next steps:"
echo "  1. Run: ./06-create-key-vault.sh"

