# 🌱 MonshyFlow Database Seeder

Schnelle Testdaten-Generierung für Entwickler. Erstellt Tenants, Users und API Keys in MongoDB.

## 📋 Übersicht

Dieses Tool erstellt automatisch Testdaten für die Entwicklung:

- **4 Tenants** (Monshy, Acme Corporation, TechStart Inc, Demo Company)
- **5 Users** mit verschiedenen Rollen (inkl. Superadmin)
- **3 API Keys** für verschiedene Tenants

## 🚀 Schnellstart

### Erste Schritte (Einmalig)

Wenn du das Projekt zum ersten Mal verwendest, führe diese Schritte aus:

```bash
# 1. Dependencies installieren
pnpm install

# 2. Benötigte Packages bauen (ohne Frontend)
pnpm build:packages
# Oder gezielt nur die Seed-Dependencies:
pnpm --filter @monshy/core --filter @monshy/database --filter @monshy/auth build
```

> ⚠️ **Wichtig**: Die Packages müssen gebaut werden, bevor das Seed-Script funktioniert!

### Voraussetzungen

1. MongoDB muss laufen (lokal oder Docker)
2. Dependencies installiert: `pnpm install`
3. Packages gebaut: `pnpm build:packages`

### Verwendung

```bash
# Alle Daten seeden
pnpm --filter @monshy/seed seed

# Datenbank leeren und neu seeden
pnpm --filter @monshy/seed seed:clean

# Nur Tenants seeden
pnpm --filter @monshy/seed seed:tenants

# Nur Users seeden (erstellt auch Tenants, da Users Tenants benötigen)
pnpm --filter @monshy/seed seed:users
```

### Mit Docker Compose

Wenn MongoDB über Docker Compose läuft:

```bash
# MongoDB muss laufen
docker-compose up -d monshyflow-mongodb

# Seed ausführen
pnpm --filter @monshy/seed seed
```

## 📊 Generierte Testdaten

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

- **Development API Key** (Acme Corporation) - Läuft nie ab
- **Production API Key** (TechStart Inc) - Läuft in 1 Jahr ab
- **Demo API Key** (Demo Company) - Läuft nie ab

> ⚠️ **Wichtig**: Die API Keys werden nur einmal angezeigt. Speichere sie sicher!


## 🔧 Konfiguration

### MongoDB Verbindung

Das Script verwendet die gleiche MongoDB-Verbindung wie die Services:

- **Lokal (ohne Docker)**: `mongodb://admin:admin123@localhost:27019/MonshyFlow?authSource=admin`
  - Port 27019 ist der externe Port (siehe `docker-compose.yml`: `27019:27017`)
  - **⚠️ WICHTIG**: Der Code verwendet standardmäßig Port 27018, aber Docker mappt auf 27019!
  - **Lösung**: Setze `MONGODB_URL` explizit: `export MONGODB_URL="mongodb://admin:admin123@localhost:27019/MonshyFlow?authSource=admin"`
- **Docker (intern)**: `mongodb://admin:admin123@MonshyFlow-mongodb:27017/MonshyFlow?authSource=admin`
  - Port 27017 ist der interne Port im Docker-Netzwerk
  - Service-Name: `MonshyFlow-mongodb`
- **Environment Variable**: `MONGODB_URL`
  - Wird automatisch verwendet, falls gesetzt
  - **Empfohlen**: Setze `MONGODB_URL` explizit, um Port-Konflikte zu vermeiden

## 📝 Scripts

| Script | Beschreibung |
|--------|--------------|
| `seed` | Alle Daten seeden |
| `seed:clean` | Datenbank leeren und neu seeden |
| `seed:tenants` | Nur Tenants seeden |
| `seed:users` | Nur Users seeden (erstellt auch Tenants) |

## 🛠️ Entwicklung

### Build

**Wichtig**: Bevor du das Seed-Script ausführst, müssen die Dependencies gebaut sein:

```bash
# Alle benötigten Packages bauen
pnpm build:packages

# Oder nur das Seed-Package selbst
pnpm --filter @monshy/seed build
```

### Watch Mode

```bash
pnpm --filter @monshy/seed dev
```

### TypeScript direkt ausführen

```bash
pnpm --filter @monshy/seed seed
```

## 🔍 Troubleshooting

### "Cannot find module '@monshy/database'"

**Problem**: Das Seed-Script findet die Workspace-Packages nicht.

**Lösung**: 
```bash
# Packages bauen
pnpm build:packages
# Oder gezielt:
pnpm --filter @monshy/core --filter @monshy/database --filter @monshy/auth build
```

### "Cannot find module 'bcrypt' native binding"

**Problem**: bcrypt native Module fehlen.

**Lösung**: 
```bash
# Dependencies neu installieren
pnpm install

# Oder bcrypt neu bauen
pnpm rebuild bcrypt
```

### MongoDB Connection Error

**Problem**: `MongoServerError: connection refused`

**Lösung**: 
1. Prüfe ob MongoDB läuft: `docker-compose ps`
2. Prüfe die MongoDB URL:
   - **Lokal (ohne Docker)**: Port 27019 (externer Port, siehe `docker-compose.yml`)
   - **Docker (intern)**: Port 27017 (interner Port, Service-Name: `MonshyFlow-mongodb`)
3. Setze `MONGODB_URL` Environment Variable falls nötig:
   ```bash
   # Lokal (ohne Docker)
   export MONGODB_URL="mongodb://admin:admin123@localhost:27019/MonshyFlow?authSource=admin"
   
   # Docker (intern)
   export MONGODB_URL="mongodb://admin:admin123@MonshyFlow-mongodb:27017/MonshyFlow?authSource=admin"
   ```
4. Starte MongoDB: `docker-compose up -d monshyflow-mongodb`

### Duplicate Key Error

**Problem**: `E11000 duplicate key error`

**Lösung**: 
- Verwende `seed:clean` um die Datenbank zu leeren
- Oder entferne manuell die betroffenen Dokumente


## 📚 Weitere Informationen

- [MonshyFlow Dokumentation](../README.md)
- [Database Models](../packages/database/src/models/)
- [Auth Package](../packages/auth/)

## 🤝 Beitragen

Wenn du neue Testdaten hinzufügen möchtest, bearbeite `src/index.ts` und füge die entsprechenden Daten hinzu.

---

**Happy Coding! 🚀**

