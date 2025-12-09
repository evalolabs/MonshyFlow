#!/bin/bash
# Master script to create all Azure resources for Monshy
# This script runs all resource creation scripts in sequence

set -e

echo "=========================================="
echo "Monshy Azure Resources Setup"
echo "=========================================="
echo ""
echo "This script will create all necessary Azure resources:"
echo "  1. Resource Group"
echo "  2. Container Registry (ACR)"
echo "  3. Container Apps Environment"
echo "4. Cosmos DB (MongoDB API)"
echo "  5. Redis Cache"
echo "  6. Key Vault"
echo ""
read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Starting resource creation..."
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run all scripts in sequence
echo "=========================================="
echo "Step 1/6: Resource Group"
echo "=========================================="
bash "$SCRIPT_DIR/01-create-resource-group.sh"
echo ""

echo "=========================================="
echo "Step 2/6: Container Registry"
echo "=========================================="
bash "$SCRIPT_DIR/02-create-container-registry.sh"
echo ""

echo "=========================================="
echo "Step 3/6: Container Apps Environment"
echo "=========================================="
bash "$SCRIPT_DIR/03-create-container-apps-environment.sh"
echo ""

echo "=========================================="
echo "Step 4/6: Cosmos DB"
echo "=========================================="
bash "$SCRIPT_DIR/04-create-cosmos-db.sh"
echo ""

echo "=========================================="
echo "Step 5/6: Redis Cache"
echo "=========================================="
bash "$SCRIPT_DIR/05-create-redis-cache.sh"
echo ""

echo "=========================================="
echo "Step 6/6: Key Vault"
echo "=========================================="
bash "$SCRIPT_DIR/06-create-key-vault.sh"
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
bash "$SCRIPT_DIR/07-summary.sh"

echo ""
echo "=========================================="
echo "✅ All resources created successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Add secrets to Key Vault (see script output above)"
echo "  2. Save all connection strings securely"
echo "  3. Build and push Docker images to ACR"
echo "  4. Deploy Container Apps"

