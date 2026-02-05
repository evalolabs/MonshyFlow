# Azure Deployment - Local Configuration Example
# Copy this file to config.local.ps1 and fill in your values
# config.local.ps1 is in .gitignore and will not be committed

# Resource Group
$RESOURCE_GROUP_NAME = "monshy-rg"
$LOCATION = "westeurope"

# Container Registry
$ACR_NAME = "monshyregistry"
$ACR_SKU = "Basic"

# Container Apps Environment
$ENV_NAME = "monshy-env"
$LOG_ANALYTICS_WORKSPACE = "monshy-logs"

# Cosmos DB
$COSMOS_ACCOUNT_NAME = "monshy-cosmos"
$DATABASE_NAME = "agentbuilder"
$COSMOS_SKU = "Serverless"

# Redis Cache
$REDIS_NAME = "monshy-redis"
$REDIS_SKU = "Basic"
$REDIS_SIZE = "C0"

# Key Vault
$KEY_VAULT_NAME = "monshy-kv"

# Docker Hub
$DOCKER_HUB_USERNAME = ""

# Azure Subscription (optional - leave empty to use current subscription)
$SUBSCRIPTION_ID = ""

# Connection Strings (will be filled after resource creation)
$COSMOS_CONNECTION_STRING = ""
$REDIS_CONNECTION_STRING = ""
$ACR_LOGIN_SERVER = ""

