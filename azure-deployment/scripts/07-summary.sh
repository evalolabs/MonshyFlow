#!/bin/bash
# Script to show summary of all created Azure resources for Monshy

set -e

# Configuration
RESOURCE_GROUP_NAME="${RESOURCE_GROUP_NAME:-monshy-rg}"

echo "=========================================="
echo "Azure Resources Summary"
echo "=========================================="
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo ""

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
    echo "❌ Resource Group '$RESOURCE_GROUP_NAME' does not exist."
    exit 1
fi

echo "=========================================="
echo "Resource Group"
echo "=========================================="
az group show --name "$RESOURCE_GROUP_NAME" --output table

echo ""
echo "=========================================="
echo "All Resources in Resource Group"
echo "=========================================="
az resource list --resource-group "$RESOURCE_GROUP_NAME" --output table

echo ""
echo "=========================================="
echo "Container Registry"
echo "=========================================="
ACR_NAME=$(az acr list --resource-group "$RESOURCE_GROUP_NAME" --query "[0].name" -o tsv 2>/dev/null || echo "")
if [ -n "$ACR_NAME" ]; then
    az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP_NAME" --output table
    echo ""
    echo "Login Server: $(az acr show --name "$ACR_NAME" --query loginServer -o tsv)"
else
    echo "No Container Registry found"
fi

echo ""
echo "=========================================="
echo "Container Apps Environment"
echo "=========================================="
ENV_NAME=$(az containerapp env list --resource-group "$RESOURCE_GROUP_NAME" --query "[0].name" -o tsv 2>/dev/null || echo "")
if [ -n "$ENV_NAME" ]; then
    az containerapp env show --name "$ENV_NAME" --resource-group "$RESOURCE_GROUP_NAME" --output table
else
    echo "No Container Apps Environment found"
fi

echo ""
echo "=========================================="
echo "Cosmos DB"
echo "=========================================="
COSMOS_NAME=$(az cosmosdb list --resource-group "$RESOURCE_GROUP_NAME" --query "[0].name" -o tsv 2>/dev/null || echo "")
if [ -n "$COSMOS_NAME" ]; then
    az cosmosdb show --name "$COSMOS_NAME" --resource-group "$RESOURCE_GROUP_NAME" --output table
    echo ""
    echo "Connection String:"
    echo "$(az cosmosdb keys list --resource-group "$RESOURCE_GROUP_NAME" --name "$COSMOS_NAME" --type connection-strings --query connectionStrings[0].connectionString -o tsv)"
else
    echo "No Cosmos DB account found"
fi

echo ""
echo "=========================================="
echo "Redis Cache"
echo "=========================================="
REDIS_NAME=$(az redis list --resource-group "$RESOURCE_GROUP_NAME" --query "[0].name" -o tsv 2>/dev/null || echo "")
if [ -n "$REDIS_NAME" ]; then
    az redis show --name "$REDIS_NAME" --resource-group "$RESOURCE_GROUP_NAME" --output table
    echo ""
    REDIS_HOST=$(az redis show --resource-group "$RESOURCE_GROUP_NAME" --name "$REDIS_NAME" --query hostName -o tsv)
    REDIS_SSL_PORT=$(az redis show --resource-group "$RESOURCE_GROUP_NAME" --name "$REDIS_NAME" --query sslPort -o tsv)
    REDIS_KEY=$(az redis list-keys --resource-group "$RESOURCE_GROUP_NAME" --name "$REDIS_NAME" --query primaryKey -o tsv)
    echo "Connection String: $REDIS_HOST:$REDIS_SSL_PORT,password=$REDIS_KEY,ssl=True"
else
    echo "No Redis Cache found"
fi

echo ""
echo "=========================================="
echo "Key Vault"
echo "=========================================="
KV_NAME=$(az keyvault list --resource-group "$RESOURCE_GROUP_NAME" --query "[0].name" -o tsv 2>/dev/null || echo "")
if [ -n "$KV_NAME" ]; then
    az keyvault show --name "$KV_NAME" --resource-group "$RESOURCE_GROUP_NAME" --output table
    echo ""
    echo "Vault URI: $(az keyvault show --name "$KV_NAME" --query properties.vaultUri -o tsv)"
else
    echo "No Key Vault found"
fi

echo ""
echo "=========================================="
echo "✅ Summary complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Review all connection strings and save them securely"
echo "  2. Add secrets to Key Vault"
echo "  3. Build and push Docker images to ACR"
echo "  4. Deploy Container Apps"

