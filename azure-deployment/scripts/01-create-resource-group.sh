#!/bin/bash
# Script to create Azure Resource Group for Monshy

set -e

# Configuration
RESOURCE_GROUP_NAME="${RESOURCE_GROUP_NAME:-monshy-rg}"
LOCATION="${LOCATION:-westeurope}"
SUBSCRIPTION_ID="${SUBSCRIPTION_ID:-}"

echo "=========================================="
echo "Creating Azure Resource Group"
echo "=========================================="
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Location: $LOCATION"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "⚠️  Not logged in to Azure. Logging in..."
    az login
fi

# Set subscription if provided
if [ -n "$SUBSCRIPTION_ID" ]; then
    echo "Setting subscription to: $SUBSCRIPTION_ID"
    az account set --subscription "$SUBSCRIPTION_ID"
fi

# Show current subscription
CURRENT_SUB=$(az account show --query name -o tsv)
echo "Current subscription: $CURRENT_SUB"
echo ""

# Check if resource group already exists
if az group show --name "$RESOURCE_GROUP_NAME" &> /dev/null; then
    echo "⚠️  Resource Group '$RESOURCE_GROUP_NAME' already exists."
    read -p "Do you want to use the existing resource group? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. Please choose a different resource group name."
        exit 1
    fi
else
    # Create resource group
    echo "Creating resource group..."
    az group create \
        --name "$RESOURCE_GROUP_NAME" \
        --location "$LOCATION" \
        --output table
    
    if [ $? -eq 0 ]; then
        echo "✅ Resource Group '$RESOURCE_GROUP_NAME' created successfully!"
    else
        echo "❌ Failed to create resource group"
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "Resource Group Details"
echo "=========================================="
az group show --name "$RESOURCE_GROUP_NAME" --output table

echo ""
echo "✅ Resource Group setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run: ./02-create-container-registry.sh"
echo "  2. Or set environment variables and run all scripts:"
echo "     export RESOURCE_GROUP_NAME=$RESOURCE_GROUP_NAME"
echo "     export LOCATION=$LOCATION"

