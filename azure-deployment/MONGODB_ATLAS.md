# 🗄️ MongoDB Atlas Setup Guide

This guide explains how to use **MongoDB Atlas** (managed MongoDB cloud service) instead of Azure Cosmos DB for your Azure deployment.

---

## 🎯 Why MongoDB Atlas?

| Feature | Cosmos DB | MongoDB Atlas |
|---------|-----------|---------------|
| **MongoDB Compatibility** | API-compatible | 100% native MongoDB |
| **Free Tier** | No | Yes (M0 - 512MB) |
| **Setup Complexity** | Medium | Easy |
| **Cost (Dev)** | $25-50/month | $0 (Free Tier) |
| **Cost (Production)** | $25-50/month | $57+/month (M10+) |
| **All in Azure** | ✅ Yes | ❌ No (separate service) |

**Recommendation:** Use MongoDB Atlas if you want:
- ✅ Free tier for development
- ✅ 100% native MongoDB (not just API-compatible)
- ✅ Easier migration from local MongoDB

---

## 🚀 Quick Start

### Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up (free account)
3. Create a new organization (or use existing)

### Step 2: Create a Cluster

1. Click **"Build a Database"**
2. Choose **"M0 FREE"** (Free Tier) for development
   - 512MB storage
   - Shared CPU/RAM
   - Perfect for development/testing
3. Select **Cloud Provider & Region:**
   - **Azure** (recommended if using Azure Container Apps)
   - Choose region close to your Azure resources (e.g., `West Europe`)
4. Click **"Create"** (takes 3-5 minutes)

### Step 3: Configure Database Access

1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter:
   - **Username:** `monshy-admin` (or your choice)
   - **Password:** Generate secure password (save it!)
   - **Database User Privileges:** `Atlas admin` (or `Read and write to any database`)
5. Click **"Add User"**

### Step 4: Configure Network Access

1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. For Azure Container Apps, you have two options:

   **Option A: Allow All IPs (Development)**
   - Click **"Allow Access from Anywhere"**
   - IP Address: `0.0.0.0/0`
   - ⚠️ **Warning:** Only for development! Not secure for production.

   **Option B: Azure IP Ranges (Production)**
   - Get Azure IP ranges from: https://www.microsoft.com/en-us/download/details.aspx?id=56519
   - Add specific Azure regions you use
   - Or use Private Endpoint (advanced)

4. Click **"Confirm"**

### Step 5: Get Connection String

1. Go to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"5.5 or later"**
5. Copy the connection string:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

6. Replace placeholders:
   - `<username>` → Your database user (e.g., `monshy-admin`)
   - `<password>` → Your database password
   - Add database name: `/?retryWrites=true&w=majority` → `/MonshyFlow?retryWrites=true&w=majority`

**Final connection string:**
```
mongodb+srv://monshy-admin:your-password@cluster0.xxxxx.mongodb.net/MonshyFlow?retryWrites=true&w=majority
```

---

## 🔧 Configure Azure Container Apps

### Option 1: Environment Variable

Set `MONGODB_URL` in your Container Apps:

```bash
az containerapp update \
  --name api-service \
  --resource-group monshy-rg \
  --set-env-vars "MONGODB_URL=mongodb+srv://monshy-admin:password@cluster0.xxxxx.mongodb.net/MonshyFlow?retryWrites=true&w=majority"
```

### Option 2: Azure Key Vault (Recommended)

Store connection string in Key Vault:

```bash
# Add connection string to Key Vault
az keyvault secret set \
  --vault-name monshy-kv \
  --name MongoDBConnectionString \
  --value "mongodb+srv://monshy-admin:password@cluster0.xxxxx.mongodb.net/MonshyFlow?retryWrites=true&w=majority"

# Reference in Container Apps
az containerapp update \
  --name api-service \
  --resource-group monshy-rg \
  --set-env-vars "MONGODB_URL=@Microsoft.KeyVault(SecretUri=https://monshy-kv.vault.azure.net/secrets/MongoDBConnectionString/)"
```

### Option 3: Azure Portal

1. Go to your Container App in Azure Portal
2. **Configuration** → **Environment Variables**
3. Add:
   - **Name:** `MONGODB_URL`
   - **Value:** Your Atlas connection string
4. **Save**

---

## 📝 Update All Services

Update all services with the MongoDB Atlas connection string:

- `api-service`
- `auth-service`
- `secrets-service`
- `execution-service`
- `scheduler-service`

**Example script:**

```bash
ATLAS_CONNECTION_STRING="mongodb+srv://monshy-admin:password@cluster0.xxxxx.mongodb.net/MonshyFlow?retryWrites=true&w=majority"

for service in api-service auth-service secrets-service execution-service scheduler-service; do
  az containerapp update \
    --name $service \
    --resource-group monshy-rg \
    --set-env-vars "MONGODB_URL=$ATLAS_CONNECTION_STRING"
done
```

---

## 🔄 Migration from Local MongoDB

If you have data in local MongoDB:

### Step 1: Export from Local MongoDB

```bash
# From your local machine
mongodump --uri="mongodb://admin:admin123@localhost:27019/MonshyFlow?authSource=admin" --out=./backup
```

### Step 2: Import to MongoDB Atlas

```bash
# Use mongorestore with Atlas connection string
mongorestore --uri="mongodb+srv://monshy-admin:password@cluster0.xxxxx.mongodb.net/MonshyFlow?retryWrites=true&w=majority" ./backup/MonshyFlow
```

Or use MongoDB Compass (GUI):
1. Connect to local MongoDB
2. Export collections
3. Connect to Atlas
4. Import collections

---

## 💰 Costs

### Free Tier (M0)
- **Cost:** $0/month
- **Storage:** 512MB
- **RAM:** Shared
- **CPU:** Shared
- **Perfect for:** Development, testing, demos

### Production Tiers

| Tier | Cost/Month | Storage | RAM | Best For |
|------|------------|---------|-----|----------|
| **M0** | $0 | 512MB | Shared | Development |
| **M2** | $9 | 2GB | 2GB | Small apps |
| **M5** | $25 | 10GB | 4GB | Medium apps |
| **M10** | $57 | 20GB | 8GB | Production |
| **M30** | $200+ | 40GB+ | 16GB+ | Large scale |

**Recommendation:**
- **Development:** M0 (Free)
- **Production:** M10+ ($57+/month)

---

## 🔐 Security Best Practices

### 1. Use Strong Passwords
- Minimum 16 characters
- Mix of letters, numbers, symbols
- Store in Azure Key Vault

### 2. Network Access
- **Development:** Allow from anywhere (0.0.0.0/0) - ⚠️ Not secure!
- **Production:** 
  - Use specific IP ranges
  - Or Private Endpoint (VPC peering)
  - Or VPN/ExpressRoute

### 3. Database Users
- Create separate users per service (optional)
- Use least privilege principle
- Rotate passwords regularly

### 4. Encryption
- Atlas encrypts data at rest (automatic)
- Use TLS/SSL (automatic in connection string)

---

## 🆚 Atlas vs Cosmos DB

### When to Use Atlas

✅ You want free tier for development  
✅ You need 100% native MongoDB features  
✅ You want easier migration from local MongoDB  
✅ You don't mind managing two services (Azure + Atlas)

### When to Use Cosmos DB

✅ You want everything in Azure  
✅ You need automatic scaling  
✅ You want single billing  
✅ You prefer Microsoft ecosystem

---

## 🐛 Troubleshooting

### Connection Timeout

**Problem:** Can't connect from Azure Container Apps

**Solution:**
1. Check Network Access in Atlas (allow Azure IPs)
2. Verify connection string format
3. Check firewall rules

### Authentication Failed

**Problem:** Username/password incorrect

**Solution:**
1. Verify database user exists
2. Check password (URL-encode special characters)
3. Verify user has correct privileges

### SSL/TLS Error

**Problem:** SSL connection failed

**Solution:**
- Use `mongodb+srv://` (includes SSL automatically)
- Don't use `mongodb://` for Atlas

---

## 📚 Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Atlas Free Tier](https://www.mongodb.com/cloud/atlas/free)
- [Connection String Guide](https://docs.atlas.mongodb.com/connect-to-cluster/)
- [Network Access](https://docs.atlas.mongodb.com/security/ip-access-list/)

---

## ✅ Checklist

- [ ] MongoDB Atlas account created
- [ ] Cluster created (M0 Free for dev)
- [ ] Database user created
- [ ] Network access configured
- [ ] Connection string obtained
- [ ] Connection string stored in Key Vault (recommended)
- [ ] All Container Apps updated with connection string
- [ ] Test connection from Container Apps
- [ ] Data migrated (if needed)

---

**Last Updated:** 2024

