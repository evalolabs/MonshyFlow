#!/bin/bash
# Script to create Azure Container Apps Environment for Monshy

set -e

# Configuration
RESOURCE_GROUP_NAME="${RESOURCE_GROUP_NAME:-monshy-rg}"
LOCATION="${LOCATION:-westeurope}"
ENV_NAME="${ENV_NAME:-monshy-env}"
LOG_ANALYTICS_WORKSPACE="${LOG_ANALYTICS_WORKSPACE:-monshy-logs}"

echo "=========================================="
echo "Creating Container Apps Environment"
echo "=========================================="
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Environment Name: $ENV_NAME"
echo "Location: $LOCATION"
echo ""

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
    echo "❌ Resource Group '$RESOURCE_GROUP_NAME' does not exist."
    echo "   Please run ./01-create-resource-group.sh first"
    exit 1
fi

# Check if Log Analytics Workspace exists, create if not
echo "Checking Log Analytics Workspace..."
if ! az monitor log-analytics workspace show --resource-group "$RESOURCE_GROUP_NAME" --workspace-name "$LOG_ANALYTICS_WORKSPACE" &> /dev/null; then
    echo "Creating Log Analytics Workspace..."
    az monitor log-analytics workspace create \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --workspace-name "$LOG_ANALYTICS_WORKSPACE" \
        --location "$LOCATION" \
        --output table
    
    if [ $? -eq 0 ]; then
        echo "✅ Log Analytics Workspace created"
    else
        echo "❌ Failed to create Log Analytics Workspace"
        exit 1
    fi
else
    echo "✅ Log Analytics Workspace already exists"
fi

# Get Log Analytics Workspace ID
LOG_ANALYTICS_ID=$(az monitor log-analytics workspace show \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --workspace-name "$LOG_ANALYTICS_WORKSPACE" \
    --query customerId -o tsv)

LOG_ANALYTICS_KEY=$(az monitor log-analytics workspace get-shared-keys \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --workspace-name "$LOG_ANALYTICS_WORKSPACE" \
    --query primarySharedKey -o tsv)

echo ""
echo "Creating Container Apps Environment..."
az containerapp env create \
    --name "$ENV_NAME" \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --location "$LOCATION" \
    --logs-workspace-id "$LOG_ANALYTICS_ID" \
    --logs-workspace-key "$LOG_ANALYTICS_KEY" \
    --output table

if [ $? -eq 0 ]; then
    echo "✅ Container Apps Environment '$ENV_NAME' created successfully!"
else
    echo "❌ Failed to create Container Apps Environment"
    exit 1
fi

echo ""
echo "=========================================="
echo "Environment Details"
echo "=========================================="
az containerapp env show --name "$ENV_NAME" --resource-group "$RESOURCE_GROUP_NAME" --output table

echo ""
echo "✅ Container Apps Environment setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run: ./04-create-cosmos-db.sh"
echo "  2. Run: ./05-create-redis-cache.sh"
echo "  3. Run: ./06-create-key-vault.sh"

