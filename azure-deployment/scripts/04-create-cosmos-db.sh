#!/bin/bash
# Script to create Azure Cosmos DB (MongoDB API) for Monshy

set -e

# Configuration
RESOURCE_GROUP_NAME="${RESOURCE_GROUP_NAME:-monshy-rg}"
LOCATION="${LOCATION:-westeurope}"
COSMOS_ACCOUNT_NAME="${COSMOS_ACCOUNT_NAME:-monshy-cosmos}"
DATABASE_NAME="${DATABASE_NAME:-agentbuilder}"
COSMOS_SKU="${COSMOS_SKU:-Serverless}"

echo "=========================================="
echo "Creating Azure Cosmos DB (MongoDB API)"
echo "=========================================="
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Account Name: $COSMOS_ACCOUNT_NAME"
echo "Database: $DATABASE_NAME"
echo "SKU: $COSMOS_SKU"
echo ""

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
    echo "❌ Resource Group '$RESOURCE_GROUP_NAME' does not exist."
    echo "   Please run ./01-create-resource-group.sh first"
    exit 1
fi

# Check if Cosmos DB account name is available
echo "Checking Cosmos DB account name availability..."
if ! az cosmosdb check-name-exists --name "$COSMOS_ACCOUNT_NAME" --query nameAvailable -o tsv | grep -q "true"; then
    echo "❌ Cosmos DB account name '$COSMOS_ACCOUNT_NAME' is not available."
    echo "   Please choose a different name (must be globally unique, lowercase, 3-44 chars)."
    exit 1
fi

echo "✅ Cosmos DB account name is available"
echo ""

# Create Cosmos DB account
echo "Creating Cosmos DB account (this may take a few minutes)..."
if [ "$COSMOS_SKU" = "Serverless" ]; then
    az cosmosdb create \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$COSMOS_ACCOUNT_NAME" \
        --locations regionName="$LOCATION" \
        --default-consistency-level Session \
        --capabilities EnableServerless \
        --output table
else
    az cosmosdb create \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --name "$COSMOS_ACCOUNT_NAME" \
        --locations regionName="$LOCATION" \
        --default-consistency-level Session \
        --output table
fi

if [ $? -eq 0 ]; then
    echo "✅ Cosmos DB account created successfully!"
else
    echo "❌ Failed to create Cosmos DB account"
    exit 1
fi

# Create MongoDB database
echo ""
echo "Creating MongoDB database..."
az cosmosdb mongodb database create \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --account-name "$COSMOS_ACCOUNT_NAME" \
    --name "$DATABASE_NAME" \
    --output table

if [ $? -eq 0 ]; then
    echo "✅ Database '$DATABASE_NAME' created successfully!"
else
    echo "⚠️  Database creation failed (might already exist)"
fi

# Get connection string
echo ""
echo "=========================================="
echo "Connection String"
echo "=========================================="
CONNECTION_STRING=$(az cosmosdb keys list \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$COSMOS_ACCOUNT_NAME" \
    --type connection-strings \
    --query connectionStrings[0].connectionString -o tsv)

# Format for MongoDB connection
# Cosmos DB MongoDB API connection string format:
# mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb

echo "Connection String:"
echo "$CONNECTION_STRING"
echo ""
echo "MongoDB Connection String Format:"
echo "mongodb://<account>:<key>@${COSMOS_ACCOUNT_NAME}.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb"
echo ""

# Get account key for connection string construction
PRIMARY_KEY=$(az cosmosdb keys list \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --name "$COSMOS_ACCOUNT_NAME" \
    --query primaryMasterKey -o tsv)

echo "=========================================="
echo "Account Details"
echo "=========================================="
az cosmosdb show --name "$COSMOS_ACCOUNT_NAME" --resource-group "$RESOURCE_GROUP_NAME" --output table

echo ""
echo "✅ Cosmos DB setup complete!"
echo ""
echo "⚠️  IMPORTANT: Save these values securely:"
echo "  COSMOS_ACCOUNT_NAME=$COSMOS_ACCOUNT_NAME"
echo "  COSMOS_PRIMARY_KEY=$PRIMARY_KEY"
echo "  COSMOS_CONNECTION_STRING=$CONNECTION_STRING"
echo ""
echo "MongoDB Connection String (for appsettings):"
echo "mongodb://${COSMOS_ACCOUNT_NAME}:${PRIMARY_KEY}@${COSMOS_ACCOUNT_NAME}.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb"
echo ""
echo "Next steps:"
echo "  1. Run: ./05-create-redis-cache.sh"

