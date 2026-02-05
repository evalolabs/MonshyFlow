#!/bin/bash
# Bash Script to create Azure Container Apps for MonshyFlow
# This script creates all Container Apps and configures them with MongoDB Atlas and Key Vault secrets

set -e

RESOURCE_GROUP_NAME="${1:-monshy-rg}"
ENVIRONMENT_NAME="${2:-monshy-env}"
KEY_VAULT_NAME="${3:-monshy-kv}"

echo "=========================================="
echo "Creating Azure Container Apps"
echo "=========================================="
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo "Environment: $ENVIRONMENT_NAME"
echo "Key Vault: $KEY_VAULT_NAME"
echo ""

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP_NAME" &>/dev/null; then
    echo "❌ Resource Group '$RESOURCE_GROUP_NAME' does not exist."
    exit 1
fi

# Check if Container Apps Environment exists
if ! az containerapp env show --name "$ENVIRONMENT_NAME" --resource-group "$RESOURCE_GROUP_NAME" &>/dev/null; then
    echo "❌ Container Apps Environment '$ENVIRONMENT_NAME' does not exist."
    echo "   Please create it first using: ./03-create-container-apps-environment.sh"
    exit 1
fi

# Get Key Vault URI
KEY_VAULT_URI=$(az keyvault show --name "$KEY_VAULT_NAME" --resource-group "$RESOURCE_GROUP_NAME" --query properties.vaultUri -o tsv)
if [ -z "$KEY_VAULT_URI" ]; then
    echo "❌ Key Vault '$KEY_VAULT_NAME' does not exist."
    exit 1
fi

echo "Key Vault URI: $KEY_VAULT_URI"
echo ""

echo "=========================================="
echo "Creating Container Apps..."
echo "=========================================="
echo ""

# 1. Auth Service
echo "Creating auth-service..."
az containerapp create \
    --name auth-service \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --environment "$ENVIRONMENT_NAME" \
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
    --target-port 80 \
    --ingress internal \
    --min-replicas 0 \
    --max-replicas 1 \
    --output none

if [ $? -eq 0 ]; then
    echo "✅ auth-service created"
    echo "Setting environment variables..."
    az containerapp update \
        --name auth-service \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --set-env-vars \
            "PORT=80" \
            "NODE_ENV=production" \
            "MONGODB_URL=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/MongoDBConnectionStringFlow/)" \
            "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/JwtSecretKey/)" \
            "JWT_ISSUER=monshy-auth-service" \
            "JWT_AUDIENCE=monshy-services" \
        --output none
    echo "✅ Environment variables set"
else
    echo "❌ Failed to create auth-service"
fi

echo ""

# 2. Secrets Service
echo "Creating secrets-service..."
az containerapp create \
    --name secrets-service \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --environment "$ENVIRONMENT_NAME" \
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
    --target-port 80 \
    --ingress internal \
    --min-replicas 0 \
    --max-replicas 1 \
    --output none

if [ $? -eq 0 ]; then
    echo "✅ secrets-service created"
    echo "Setting environment variables..."
    az containerapp update \
        --name secrets-service \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --set-env-vars \
            "PORT=80" \
            "NODE_ENV=production" \
            "MONGODB_URL=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/MongoDBConnectionStringFlow/)" \
            "SECRETS_ENCRYPTION_KEY=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/EncryptionKey/)" \
            "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/JwtSecretKey/)" \
            "JWT_ISSUER=monshy-auth-service" \
            "JWT_AUDIENCE=monshy-services" \
            "AUTH_SERVICE_URL=http://auth-service:80" \
        --output none
    echo "✅ Environment variables set"
else
    echo "❌ Failed to create secrets-service"
fi

echo ""

# 3. API Service
echo "Creating api-service..."
az containerapp create \
    --name api-service \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --environment "$ENVIRONMENT_NAME" \
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
    --target-port 80 \
    --ingress external \
    --min-replicas 0 \
    --max-replicas 2 \
    --output none

if [ $? -eq 0 ]; then
    echo "✅ api-service created"
    echo "Setting environment variables..."
    az containerapp update \
        --name api-service \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --set-env-vars \
            "PORT=80" \
            "NODE_ENV=production" \
            "MONGODB_URL=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/MongoDBConnectionStringFlow/)" \
            "JWT_SECRET_KEY=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/JwtSecretKey/)" \
            "JWT_ISSUER=monshy-auth-service" \
            "JWT_AUDIENCE=monshy-services" \
            "AUTH_SERVICE_URL=http://auth-service:80" \
            "SECRETS_SERVICE_URL=http://secrets-service:80" \
            "EXECUTION_SERVICE_URL=http://execution-service:5004" \
            "SCHEDULER_SERVICE_URL=http://scheduler-service:80" \
        --output none
    echo "✅ Environment variables set"
else
    echo "❌ Failed to create api-service"
fi

echo ""

# 4. Execution Service
echo "Creating execution-service..."
az containerapp create \
    --name execution-service \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --environment "$ENVIRONMENT_NAME" \
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
    --target-port 5004 \
    --ingress internal \
    --min-replicas 0 \
    --max-replicas 2 \
    --output none

if [ $? -eq 0 ]; then
    echo "✅ execution-service created"
    echo "Setting environment variables..."
    az containerapp update \
        --name execution-service \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --set-env-vars \
            "PORT=5004" \
            "NODE_ENV=production" \
            "MONGODB_URL=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/MongoDBConnectionStringFlow/)" \
            "SECRETS_SERVICE_URL=http://secrets-service:80" \
        --output none
    echo "✅ Environment variables set"
else
    echo "❌ Failed to create execution-service"
fi

echo ""

# 5. Scheduler Service
echo "Creating scheduler-service..."
az containerapp create \
    --name scheduler-service \
    --resource-group "$RESOURCE_GROUP_NAME" \
    --environment "$ENVIRONMENT_NAME" \
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
    --target-port 80 \
    --ingress internal \
    --min-replicas 0 \
    --max-replicas 1 \
    --output none

if [ $? -eq 0 ]; then
    echo "✅ scheduler-service created"
    echo "Setting environment variables..."
    az containerapp update \
        --name scheduler-service \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --set-env-vars \
            "PORT=80" \
            "NODE_ENV=production" \
            "MONGODB_URL=@Microsoft.KeyVault(SecretUri=${KEY_VAULT_URI}/secrets/MongoDBConnectionStringFlow/)" \
            "EXECUTION_SERVICE_URL=http://execution-service:5004" \
        --output none
    echo "✅ Environment variables set"
else
    echo "❌ Failed to create scheduler-service"
fi

echo ""
echo "=========================================="
echo "✅ Container Apps created!"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: These Container Apps use placeholder images."
echo "   Next steps:"
echo "   1. Build your Docker images"
echo "   2. Push images to Azure Container Registry"
echo "   3. Update Container Apps with your images:"
echo "      az containerapp update --name <service> --resource-group $RESOURCE_GROUP_NAME --image <your-image>"
echo ""
echo "Get API Service URL:"
API_URL=$(az containerapp show --name api-service --resource-group "$RESOURCE_GROUP_NAME" --query properties.configuration.ingress.fqdn -o tsv 2>/dev/null)
if [ -n "$API_URL" ]; then
    echo "  https://$API_URL"
else
    echo "  (Service not yet available)"
fi

