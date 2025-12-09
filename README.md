# 🚀 MonshyFlow - Production Ready

**Professionelle Workflow-Automation-Plattform für Azure**

---

## 📋 Übersicht

MonshyFlow ist eine moderne, produktionsreife Workflow-Automation-Plattform mit:

- ✅ **Node.js/TypeScript Stack** - Einheitlich, modern, type-safe
- ✅ **Azure-optimiert** - Container Apps, Cosmos DB, Redis
- ✅ **Kostenoptimiert** - Gateway integriert, keine redundanten Services
- ✅ **Produktionsreif** - Sicherheit, Logging, Monitoring
- ✅ **Entwicklerfreundlich** - TypeScript, Hot Reload, klare Struktur

---

## 🏗️ Architektur

### Services

1. **API Service** (Workflow + Gateway integriert) - Port 5001/80
2. **Auth Service** - Port 5002/80
3. **Secrets Service** - Port 5003/80
4. **Execution Service** - Port 5004/80 ✅ (bereits vorhanden)
5. **Scheduler Service** - Port 5005/80

### Shared Packages

- `@monshy/core` - Types, Errors, Logger, Validation, Security
- `@monshy/database` - MongoDB/Cosmos DB Models & Repositories
- `@monshy/auth` - JWT & API Key Utilities

**Siehe [ARCHITECTURE.md](./ARCHITECTURE.md) für Details.**

---

## 🚀 Quick Start

### Voraussetzungen

- Node.js 20+
- pnpm 8+
- Docker (für lokale Entwicklung)

### Installation

```bash
# Dependencies installieren
pnpm install

# Services starten
pnpm dev

# Build
pnpm build
```

### Einzelner Service

```bash
# API Service
pnpm --filter @monshy/api-service dev

# Auth Service
pnpm --filter @monshy/auth-service dev
```

---

## 🔒 Sicherheit

- ✅ **Input Validation** - Zod Schemas
- ✅ **Rate Limiting** - Express Rate Limit
- ✅ **Security Headers** - Helmet
- ✅ **CORS** - Konfiguriert
- ✅ **JWT & API Keys** - Tenant-spezifisch

---

## ☁️ Azure Deployment

### Kosten

- **5 Container Apps** - ~$50/Monat
- **Cosmos DB** - ~$25/Monat
- **Redis Cache** - ~$15/Monat
- **Key Vault** - ~$0.03/Monat

**Gesamt: ~$90/Monat**

**Siehe [azure-deployment/README.md](./azure-deployment/README.md) für Details.**

---

## 📚 Dokumentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Vollständige Architektur-Dokumentation
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Entwickler-Guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment-Guide
- **[SECURITY.md](./SECURITY.md)** - Security Best Practices

---

## 🛠️ Entwicklung

### Code Quality

```bash
# Linting
pnpm lint

# Formatting
pnpm format

# Testing
pnpm test
```

### Best Practices

1. **Immer Shared Packages verwenden** - Keine Duplikation
2. **Input Validation** - Zod Schemas für alle Inputs
3. **Strukturiertes Logging** - Pino für alle Logs
4. **Type Safety** - TypeScript überall
5. **Clean Architecture** - Controllers → Services → Repositories

---

## 📊 Features

- ✅ Workflow Management (CRUD)
- ✅ Visual Workflow Editor (Frontend)
- ✅ Workflow Execution
- ✅ Workflow Scheduling
- ✅ Multi-Tenant Support
- ✅ API Key Authentication
- ✅ Secrets Management
- ✅ Node/Tool Registry System

---

## 🎯 Vorteile

1. **Kostenoptimiert** - Gateway integriert, keine redundanten Services
2. **Azure-optimiert** - Perfekt für Container Apps
3. **Sicher** - Input Validation, Rate Limiting, Security Headers
4. **Wartbar** - Clean Architecture, Shared Packages, TypeScript
5. **Entwicklerfreundlich** - TypeScript, Hot Reload, klare Struktur
6. **Skalierbar** - Jeder Service kann unabhängig skaliert werden

---

## 📝 License

Proprietary

---

**Version:** 1.0.0 (Production Ready)  
**Letzte Aktualisierung:** 2024

