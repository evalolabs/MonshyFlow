# Azure Container Apps Deployment Guide

This folder contains all necessary files and documentation for deploying Monshy to Azure Container Apps.

---

## 📁 Structure

```
azure-deployment/
├── README.md                          # This file
├── ENVIRONMENT_VARIABLES.md           # Environment Variables documentation
├── CODE_CHANGES.md                   # Code changes documentation
├── scripts/
│   ├── README.md                      # Scripts documentation
│   ├── 00-create-all-resources.sh     # Master script (all resources)
│   ├── 01-create-resource-group.sh    # Create Resource Group
│   ├── 02-create-container-registry.sh # Create Container Registry
│   ├── 03-create-container-apps-environment.sh # Container Apps Environment
│   ├── 04-create-cosmos-db.sh        # Create Cosmos DB
│   ├── 05-create-redis-cache.sh       # Create Redis Cache
│   ├── 06-create-key-vault.sh        # Create Key Vault
│   ├── 07-summary.sh                  # Summary of all resources
│   └── (PowerShell versions: *.ps1)
└── templates/
    └── (later: ARM/Bicep Templates)
```

---

## 🚀 Quick Start

### Prerequisites

1. **Azure CLI installed**
   ```bash
   az --version
   ```

2. **Docker installed**
   ```bash
   docker --version
   ```

3. **Logged in to Azure**
   ```bash
   az login
   ```

4. **Select Azure Subscription**
   ```bash
   az account set --subscription "Your Subscription Name"
   ```

---

## 📋 Deployment Steps

### Step 1: Create Azure Resources

**Option A: All resources at once (recommended)**
```bash
cd azure-deployment/scripts
# Windows
.\00-create-all-resources.ps1

# Linux/Mac
chmod +x *.sh
./00-create-all-resources.sh
```

**Option B: Create individually**
```bash
cd azure-deployment/scripts
# Windows
.\01-create-resource-group.ps1
.\02-create-container-registry.ps1
.\03-create-container-apps-environment.ps1
.\04-create-cosmos-db.ps1
.\05-create-redis-cache.ps1
.\06-create-key-vault.ps1
.\07-summary.ps1

# Linux/Mac
chmod +x *.sh
./01-create-resource-group.sh
./02-create-container-registry.sh
./03-create-container-apps-environment.sh
./04-create-cosmos-db.sh
./05-create-redis-cache.sh
./06-create-key-vault.sh
./07-summary.sh
```

Creates:
- Resource Group
- Azure Container Registry (ACR)
- Container Apps Environment
- Azure Cosmos DB (MongoDB API)
- Azure Cache for Redis
- Azure Key Vault

**Note:** RabbitMQ is **not** included (optional, code has fallback). See [RABBITMQ_NOTES.md](./RABBITMQ_NOTES.md) for details.

**See [scripts/README.md](./scripts/README.md) for details.**

### Step 2: Add Secrets to Key Vault

After creating the resources, secrets must be added:

```bash
# JWT Secret Key (min. 32 characters)
az keyvault secret set \
  --vault-name monshy-kv \
  --name JwtSecretKey \
  --value "your-secret-key-min-32-chars"

# Encryption Key (min. 32 characters)
az keyvault secret set \
  --vault-name monshy-kv \
  --name EncryptionKey \
  --value "your-encryption-key-min-32-chars"

# OpenAI API Key
az keyvault secret set \
  --vault-name monshy-kv \
  --name OpenAIApiKey \
  --value "sk-..."
```

### Step 3: Save Connection Strings

The scripts output all connection strings. Save these securely:
- Cosmos DB Connection String
- Redis Connection String
- ACR Login Server

**These will be needed later for Container Apps Environment Variables.**

### Step 4: Build and Push Docker Images (later)

```bash
# Will be created later
./build-push-images.sh
```

### Step 5: Deploy Container Apps (later)

```bash
# Will be created later
./deploy-services.sh
```

### Step 6: Deploy Frontend (later)

```bash
# Will be created later
./deploy-frontend.sh
```

---

## 🔧 Configuration

### Environment Variables

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for a complete list of all required environment variables.

### Collect Connection Strings

After Step 1 (create resources), the connection strings will be output. These must be set in the environment variables.

---

## 📊 Costs

Estimated monthly costs: **$75-95** (Development/Testing)

See [Cost Comparison](../README.md#kostenvergleich) for details.

---

## 🔐 Secrets Management

### Option 1: Azure Key Vault (Recommended)

Store secrets in Key Vault and reference them in Container Apps.

### Option 2: Container Apps Secrets

Store secrets directly in Container Apps.

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md#secrets-management) for details.

---

## 🐛 Troubleshooting

### Container App won't start

1. Check logs:
   ```bash
   az containerapp logs show --name <service-name> --resource-group monshy-rg --follow
   ```

2. Check Environment Variables:
   ```bash
   az containerapp show --name <service-name> --resource-group monshy-rg --query "properties.template.containers[0].env"
   ```

### Connection Errors

- Check Connection Strings
- Check Firewall Rules (Cosmos DB, Redis)
- Check Container App internal names

### Frontend cannot reach Backend

- Check CORS configuration
- Check `FRONTEND_URL` Environment Variable
- Check Gateway Ingress configuration

---

## 📚 Further Resources

- [Azure Container Apps Documentation](https://docs.microsoft.com/azure/container-apps/)
- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)
- [Monshy Project README](../README.md)

---

## ✅ Checklist

- [ ] Azure CLI installed and logged in
- [ ] Docker installed
- [ ] Subscription selected
- [ ] All scripts made executable (`chmod +x scripts/*.sh`)
- [ ] Connection Strings collected
- [ ] Secrets generated (JWT, Encryption Keys)
- [ ] API Keys ready (OpenAI, Serper)

---

**Good luck with the deployment! 🚀**
