# 🌱 MonshyFlow Database Seeder

Schnelle Testdaten-Generierung für Entwickler. Erstellt Tenants, Users, API Keys und Secrets in MongoDB.

## 📋 Übersicht

Dieses Tool erstellt automatisch Testdaten für die Entwicklung:

- **3 Tenants** (Acme Corporation, TechStart Inc, Demo Company)
- **4 Users** mit verschiedenen Rollen
- **3 API Keys** für verschiedene Tenants
- **3 Secrets** (verschlüsselt) für verschiedene Use Cases

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

# 3. bcrypt native bindings bauen (falls nötig)
# Falls bcrypt-Fehler auftreten:
cd node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt
npm rebuild
cd ../../../../..
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
| Acme Corporation | acme.com |
| TechStart Inc | techstart.io |
| Demo Company | demo.monshy.com |

### Users

| Email | Password | Roles | Tenant |
|-------|----------|-------|--------|
| admin@acme.com | admin123 | admin, user | Acme Corporation |
| user@acme.com | user123 | user | Acme Corporation |
| developer@techstart.io | dev123 | user, developer | TechStart Inc |
| demo@demo.monshy.com | demo123 | user | Demo Company |

### API Keys

- **Development API Key** (Acme Corporation) - Läuft nie ab
- **Production API Key** (TechStart Inc) - Läuft in 1 Jahr ab
- **Demo API Key** (Demo Company) - Läuft nie ab

> ⚠️ **Wichtig**: Die API Keys werden nur einmal angezeigt. Speichere sie sicher!

### Secrets

- **OPENAI_API_KEY** (Acme Corporation) - Demo OpenAI Key
- **AZURE_API_KEY** (TechStart Inc) - Demo Azure Key
- **DATABASE_PASSWORD** (Demo Company) - Demo Database Password

> ⚠️ **Hinweis**: Die Secrets sind verschlüsselt gespeichert. Die Werte sind Demo-Werte und sollten in Produktion ersetzt werden.

## 🔧 Konfiguration

### MongoDB Verbindung

Das Script verwendet die gleiche MongoDB-Verbindung wie die Services:

- **Lokal**: `mongodb://admin:admin123@localhost:27018/MonshyFlow?authSource=admin`
- **Docker**: `mongodb://admin:admin123@MonshyFlow-mongodb:27017/MonshyFlow?authSource=admin`
- **Environment Variable**: `MONGODB_URL` oder `MongoDbSettings__ConnectionString`

### Verschlüsselung

Secrets werden mit AES-256-GCM verschlüsselt. Der Encryption Key kann über Environment Variables gesetzt werden:

- `SECRETS_ENCRYPTION_KEY` (bevorzugt)
- `ENCRYPTION_KEY` (Fallback)

> ⚠️ **Sicherheit**: In Produktion sollte der Encryption Key aus Azure Key Vault oder ähnlichem kommen.

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
# bcrypt neu bauen
cd node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt
npm rebuild
cd ../../../../..

# Oder mit pnpm (wenn Build-Scripts genehmigt):
pnpm rebuild bcrypt
```

### MongoDB Connection Error

**Problem**: `MongoServerError: connection refused`

**Lösung**: 
1. Prüfe ob MongoDB läuft: `docker-compose ps`
2. Prüfe die MongoDB URL in `.env` oder `docker-compose.yml`
3. Starte MongoDB: `docker-compose up -d monshyflow-mongodb`

### Duplicate Key Error

**Problem**: `E11000 duplicate key error`

**Lösung**: 
- Verwende `seed:clean` um die Datenbank zu leeren
- Oder entferne manuell die betroffenen Dokumente

### Encryption Key Warning

**Problem**: `Encryption key is too short`

**Lösung**: 
- Setze `SECRETS_ENCRYPTION_KEY` in `.env` (mindestens 32 Zeichen)
- Oder ignoriere die Warnung für Development (nicht für Production!)

## 📚 Weitere Informationen

- [MonshyFlow Dokumentation](../README.md)
- [Database Models](../packages/database/src/models/)
- [Auth Package](../packages/auth/)

## 🤝 Beitragen

Wenn du neue Testdaten hinzufügen möchtest, bearbeite `src/index.ts` und füge die entsprechenden Daten hinzu.

---

**Happy Coding! 🚀**

