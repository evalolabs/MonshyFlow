# 🗄️ Database: MongoDB vs Azure Cosmos DB

This document explains the database setup for MonshyFlow in different environments.

---

## 📊 Overview

MonshyFlow uses **MongoDB** for data storage. Depending on the environment, we use:

| Environment | Database | Type | Why |
|-------------|----------|------|-----|
| **Local Development** | MongoDB 7.0 | Docker Container | Fast, free, easy setup |
| **Azure Production** | Azure Cosmos DB | MongoDB API | Managed, scalable, automatic backups |

**Important:** Both are MongoDB-compatible, so **no code changes are needed**. Only the connection string changes.

---

## 🏠 Local Development (MongoDB)

### Setup

MongoDB runs in Docker Compose:

```yaml
monshyflow-mongodb:
  image: mongo:7.0
  container_name: MonshyFlow-mongodb
  ports:
    - "27019:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: admin123
    MONGO_INITDB_DATABASE: MonshyFlow
```

### Connection String

```bash
MONGODB_URL=mongodb://admin:admin123@MonshyFlow-mongodb:27017/MonshyFlow?authSource=admin
```

Or from host machine (external port):
```bash
MONGODB_URL=mongodb://admin:admin123@localhost:27019/MonshyFlow?authSource=admin
```

### Start MongoDB

```bash
docker-compose up -d monshyflow-mongodb
```

### Access MongoDB

- **Mongo Express UI:** http://localhost:8082
- **MongoDB Shell:** `docker exec -it MonshyFlow-mongodb mongosh -u admin -p admin123`

---

## ☁️ Azure Production Options

You have two options for Azure production:

### Option A: Azure Cosmos DB (MongoDB API)
See section below.

### Option B: MongoDB Atlas (Recommended for Free Tier)
See [MONGODB_ATLAS.md](./MONGODB_ATLAS.md) for detailed setup.

**Quick comparison:**
- **Cosmos DB:** Everything in Azure, $25-50/month
- **MongoDB Atlas:** Free tier available, 100% native MongoDB, separate service

---

## ☁️ Azure Production (Cosmos DB)

### What is Cosmos DB?

Azure Cosmos DB is a **managed NoSQL database** that provides:
- ✅ MongoDB API compatibility (works with existing MongoDB code)
- ✅ Automatic scaling
- ✅ Global distribution
- ✅ Automatic backups
- ✅ High availability (99.999% SLA)

### Why Cosmos DB instead of MongoDB?

| Feature | MongoDB on VM | Cosmos DB |
|---------|---------------|-----------|
| Setup | Manual | Automatic |
| Scaling | Manual | Automatic |
| Backups | Manual | Automatic |
| Maintenance | You | Microsoft |
| High Availability | Complex | Built-in |
| Global Distribution | Complex | Built-in |

### Connection String

```bash
MONGODB_URL=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/MonshyFlow?ssl=true&replicaSet=globaldb&authSource=admin
```

**Example:**
```bash
MONGODB_URL=mongodb://monshy-cosmos:abc123...@monshy-cosmos.mongo.cosmos.azure.com:10255/MonshyFlow?ssl=true&replicaSet=globaldb&authSource=admin
```

### Create Cosmos DB

Use the provided script:

```bash
cd azure-deployment/scripts
.\04-create-cosmos-db.ps1
```

Or manually:
```bash
az cosmosdb create \
  --resource-group monshy-rg \
  --name monshy-cosmos \
  --locations regionName=westeurope \
  --default-consistency-level Session \
  --capabilities EnableServerless
```

---

## 🔄 Code Compatibility

The code automatically works with both databases. See [packages/database/src/connection.ts](../../packages/database/src/connection.ts):

```typescript
// Azure Cosmos DB benötigt spezielle Optionen
const options: mongoose.ConnectOptions = {
  retryWrites: false, // Cosmos DB unterstützt kein retryWrites
};

await mongoose.connect(mongoUrl, options);

// Log connection type
if (mongoUrl.includes('cosmos.azure.com')) {
  logger.info('📦 Connected to Azure Cosmos DB (MongoDB API)');
} else {
  logger.info('📦 Connected to local MongoDB');
}
```

**No code changes needed!** The code detects which database you're using.

---

## 📝 Environment Variables

### Local Development

```bash
# In docker-compose.yml or .env
MONGODB_URL=mongodb://admin:admin123@MonshyFlow-mongodb:27017/MonshyFlow?authSource=admin
```

### Azure Production

```bash
# In Container Apps Environment Variables
MONGODB_URL=mongodb://<account>:<key>@<account>.mongo.cosmos.azure.com:10255/MonshyFlow?ssl=true&replicaSet=globaldb&authSource=admin
```

---

## 🔍 Differences

### What's the Same

- ✅ Same MongoDB API
- ✅ Same Mongoose models
- ✅ Same queries
- ✅ Same data structure
- ✅ Same code

### What's Different

| Feature | MongoDB | Cosmos DB |
|---------|---------|-----------|
| Connection String | `mongodb://...` | `mongodb://...cosmos.azure.com:10255` |
| SSL | Optional | Required (`ssl=true`) |
| Replica Set | Optional | Required (`replicaSet=globaldb`) |
| Retry Writes | Supported | Not supported (`retryWrites=false`) |
| Port | 27017 | 10255 |

---

## 💰 Costs

### Local MongoDB
- **Free** (runs in Docker)

### Azure Cosmos DB
- **Serverless:** ~$25-50/month (pay-per-request)
- **Provisioned:** ~$50-200+/month (fixed throughput)

See [README.md](./README.md#costs) for cost details.

---

## 🚀 Migration

### From Local to Azure

1. **Create Cosmos DB** (see scripts)
2. **Get connection string** from Azure Portal
3. **Update environment variable** in Container Apps
4. **Deploy** - code works automatically!

### Data Migration

If you have existing data in local MongoDB:

```bash
# Export from local MongoDB
mongodump --uri="mongodb://admin:admin123@localhost:27019/MonshyFlow?authSource=admin" --out=./backup

# Import to Cosmos DB
mongorestore --uri="mongodb://account:key@account.mongo.cosmos.azure.com:10255/MonshyFlow?ssl=true&replicaSet=globaldb" ./backup/MonshyFlow
```

---

## ✅ Best Practices

1. **Always use environment variables** for connection strings
2. **Never commit** connection strings to git
3. **Use Key Vault** in Azure for secrets
4. **Test locally** with MongoDB before deploying
5. **Monitor costs** in Azure Portal

---

## 🔗 Further Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [Cosmos DB MongoDB API](https://docs.microsoft.com/azure/cosmos-db/mongodb/mongodb-introduction)
- [Mongoose Documentation](https://mongoosejs.com/)

---

## ❓ FAQ

### Q: Can I use MongoDB in Azure instead of Cosmos DB?

A: Yes, but you'd need to:
- Set up a VM
- Install MongoDB manually
- Handle backups, scaling, updates yourself
- **Not recommended** - Cosmos DB is easier and more reliable

### Q: Do I need to change my code?

A: **No!** The code works with both. Only the connection string changes.

### Q: Can I use Cosmos DB locally?

A: Yes, but it's not necessary. Local MongoDB is free and faster for development.

### Q: What about data migration?

A: Use `mongodump` and `mongorestore` - they work with both databases.

---

**Last Updated:** 2024

