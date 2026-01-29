# 🌱 MonshyFlow Database Seeder

Fast test data generation for developers. Creates tenants, users and API keys in MongoDB.

## 📋 Overview

This tool automatically creates test data for local development:

- **4 tenants** (Monshy, Acme Corporation, TechStart Inc, Demo Company)
- **5 users** with different roles (including a superadmin)
- **3 API keys** for different tenants

## 🚀 Quick Start

### First-time setup (once)

If you use this project for the first time, run:

```bash
# 1. Install dependencies
pnpm install

# 2. Build required backend packages (without frontend)
pnpm build:packages
# Or only the seed dependencies:
pnpm --filter @monshy/core --filter @monshy/database --filter @monshy/auth build
```

> ⚠️ **Important**: Packages must be built before the seed script can run successfully.

### Requirements

1. MongoDB is running (local or via Docker)
2. Dependencies installed: `pnpm install`
3. Packages built: `pnpm build:packages`

### Usage

```bash
# Seed all data
pnpm --filter @monshy/seed seed

# Clean database and re-seed
pnpm --filter @monshy/seed seed:clean

# Seed only tenants
pnpm --filter @monshy/seed seed:tenants

# Seed only users (also creates tenants if needed)
pnpm --filter @monshy/seed seed:users
```

### With Docker Compose

If MongoDB runs via Docker Compose:

```bash
# Ensure MongoDB is running
docker-compose up -d monshyflow-mongodb

# Run seed
pnpm --filter @monshy/seed seed
```

## 📊 Generated Test Data

### Tenants

| Name | Domain |
|------|--------|
| Monshy | Monshy.com |
| Acme Corporation | acme.com |
| TechStart Inc | techstart.io |
| Demo Company | demo.monshy.com |

### Users

| Email | Password | Roles | Tenant |
|-------|----------|-------|--------|
| superadmin@monshy.com | superadmin123 | superadmin, admin, user | Monshy |
| admin@acme.com | admin123 | admin, user | Acme Corporation |
| user@acme.com | user123 | user | Acme Corporation |
| developer@techstart.io | dev123 | user, developer | TechStart Inc |
| demo@demo.monshy.com | demo123 | user | Demo Company |

### API Keys

- **Development API Key** (Acme Corporation) – never expires
- **Production API Key** (TechStart Inc) – expires in 1 year
- **Demo API Key** (Demo Company) – never expires

> ⚠️ **Important**: API keys are only shown once in the logs. Store them safely.


## 🔧 Configuration

### MongoDB connection

The script uses the same MongoDB connection as the backend services:

- **Local (without Docker)**: `mongodb://admin:admin123@localhost:27019/MonshyFlow?authSource=admin`
  - Port 27019 is the external port (see `docker-compose.yml`: `27019:27017`)
  - ⚠️ The code default uses port 27018, but Docker maps to 27019.
  - **Solution**: Set `MONGODB_URL` explicitly:  
    `export MONGODB_URL="mongodb://admin:admin123@localhost:27019/MonshyFlow?authSource=admin"`
- **Docker (internal)**: `mongodb://admin:admin123@MonshyFlow-mongodb:27017/MonshyFlow?authSource=admin`
  - Port 27017 is the internal port in the Docker network
  - Service name: `MonshyFlow-mongodb`
- **Environment variable**: `MONGODB_URL`
  - Automatically used when set
  - **Recommended**: Always set `MONGODB_URL` explicitly to avoid port mismatches.

## 📝 Scripts

| Script        | Description                             |
|--------------|-----------------------------------------|
| `seed`       | Seed all data                           |
| `seed:clean` | Clean database and re-seed              |
| `seed:tenants` | Seed only tenants                     |
| `seed:users` | Seed only users (also creates tenants)  |

## 🛠️ Development

### Build

**Important**: Before running the seed script, all required packages must be built:

```bash
# Build all required packages
pnpm build:packages

# Or only the seed package itself
pnpm --filter @monshy/seed build
```

### Watch mode

```bash
pnpm --filter @monshy/seed dev
```

### Run TypeScript directly

```bash
pnpm --filter @monshy/seed seed
```

## 🔍 Troubleshooting

### "Cannot find module '@monshy/database'"

**Problem**: The seed script cannot find the workspace packages.

**Solution**:
```bash
# Build packages
pnpm build:packages
# Or only the required ones:
pnpm --filter @monshy/core --filter @monshy/database --filter @monshy/auth build
```

### "Cannot find module 'bcrypt' native binding"

**Problem**: bcrypt native modules are missing.

**Solution**:
```bash
# Reinstall dependencies
pnpm install

# Or rebuild bcrypt
pnpm rebuild bcrypt
```

### MongoDB connection error

**Problem**: `MongoServerError: connection refused`

**Solution**:
1. Check if MongoDB is running: `docker-compose ps`
2. Check the MongoDB URL:
   - **Local (without Docker)**: port 27019 (external port, see `docker-compose.yml`)
   - **Docker (internal)**: port 27017 (service name: `MonshyFlow-mongodb`)
3. Set the `MONGODB_URL` environment variable if needed:
   ```bash
   # Local (without Docker)
   export MONGODB_URL="mongodb://admin:admin123@localhost:27019/MonshyFlow?authSource=admin"
   
   # Docker (internal)
   export MONGODB_URL="mongodb://admin:admin123@MonshyFlow-mongodb:27017/MonshyFlow?authSource=admin"
   ```
4. Start MongoDB: `docker-compose up -d monshyflow-mongodb`

### Duplicate key error

**Problem**: `E11000 duplicate key error`

**Solution**:
- Use `seed:clean` to wipe the database
- Or manually delete the affected documents


## 📚 Further information

- [MonshyFlow main documentation](../README.md)
- [Database models](../packages/database/src/models/)
- [Auth package](../packages/auth/)

## 🤝 Contributing

If you want to add new test data, edit `src/index.ts` and add the corresponding data.

---

**Happy Coding! 🚀**

