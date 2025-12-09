# Azure Container Apps Deployment Guide

Dieser Ordner enthält alle notwendigen Dateien und Dokumentationen für das Deployment von Monshy in Azure Container Apps.

---

## 📁 Struktur

```
azure-deployment/
├── README.md                          # Diese Datei
├── ENVIRONMENT_VARIABLES.md           # Environment Variables Dokumentation
├── CODE_CHANGES.md                    # Code-Änderungen Dokumentation
├── scripts/
│   ├── README.md                      # Scripts Dokumentation
│   ├── 00-create-all-resources.sh     # Master Script (alle Ressourcen)
│   ├── 01-create-resource-group.sh    # Resource Group erstellen
│   ├── 02-create-container-registry.sh # Container Registry erstellen
│   ├── 03-create-container-apps-environment.sh # Container Apps Environment
│   ├── 04-create-cosmos-db.sh        # Cosmos DB erstellen
│   ├── 05-create-redis-cache.sh       # Redis Cache erstellen
│   ├── 06-create-key-vault.sh        # Key Vault erstellen
│   ├── 07-summary.sh                  # Zusammenfassung aller Ressourcen
│   └── (PowerShell Versionen: *.ps1)
└── templates/
    └── (später: ARM/Bicep Templates)
```

---

## 🚀 Quick Start

### Voraussetzungen

1. **Azure CLI installiert**
   ```bash
   az --version
   ```

2. **Docker installiert**
   ```bash
   docker --version
   ```

3. **Angemeldet bei Azure**
   ```bash
   az login
   ```

4. **Azure Subscription auswählen**
   ```bash
   az account set --subscription "Your Subscription Name"
   ```

---

## 📋 Deployment-Schritte

### Schritt 1: Azure Ressourcen erstellen

**Option A: Alle Ressourcen auf einmal (empfohlen)**
```bash
cd azure-deployment/scripts
# Windows
.\00-create-all-resources.ps1

# Linux/Mac
chmod +x *.sh
./00-create-all-resources.sh
```

**Option B: Einzeln erstellen**
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

Erstellt:
- Resource Group
- Azure Container Registry (ACR)
- Container Apps Environment
- Azure Cosmos DB (MongoDB API)
- Azure Cache for Redis
- Azure Key Vault

**Hinweis:** RabbitMQ ist **nicht** enthalten (optional, Code hat Fallback). Siehe [RABBITMQ_NOTES.md](./RABBITMQ_NOTES.md) für Details.

**Siehe [scripts/README.md](./scripts/README.md) für Details.**

### Schritt 2: Secrets zu Key Vault hinzufügen

Nach dem Erstellen der Ressourcen müssen Secrets hinzugefügt werden:

```bash
# JWT Secret Key (min. 32 Zeichen)
az keyvault secret set \
  --vault-name monshy-kv \
  --name JwtSecretKey \
  --value "your-secret-key-min-32-chars"

# Encryption Key (min. 32 Zeichen)
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

### Schritt 3: Connection Strings speichern

Die Scripts geben alle Connection Strings aus. Speichere diese sicher:
- Cosmos DB Connection String
- Redis Connection String
- ACR Login Server

**Diese werden später für Container Apps Environment Variables benötigt.**

### Schritt 4: Docker Images bauen und pushen (später)

```bash
# Wird später erstellt
./build-push-images.sh
```

### Schritt 5: Container Apps deployen (später)

```bash
# Wird später erstellt
./deploy-services.sh
```

### Schritt 6: Frontend deployen (später)

```bash
# Wird später erstellt
./deploy-frontend.sh
```

---

## 🔧 Konfiguration

### Environment Variables

Siehe [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) für eine vollständige Liste aller benötigten Environment Variables.

### Connection Strings sammeln

Nach Schritt 1 (Ressourcen erstellen) werden die Connection Strings ausgegeben. Diese müssen in den Environment Variables gesetzt werden.

---

## 📊 Kosten

Geschätzte monatliche Kosten: **$75-95** (Development/Testing)

Siehe [Kostenvergleich](../README.md#kostenvergleich) für Details.

---

## 🔐 Secrets Management

### Option 1: Azure Key Vault (Empfohlen)

Secrets in Key Vault speichern und in Container Apps referenzieren.

### Option 2: Container Apps Secrets

Secrets direkt in Container Apps speichern.

Siehe [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md#secrets-management) für Details.

---

## 🐛 Troubleshooting

### Container App startet nicht

1. Logs prüfen:
   ```bash
   az containerapp logs show --name <service-name> --resource-group monshy-rg --follow
   ```

2. Environment Variables prüfen:
   ```bash
   az containerapp show --name <service-name> --resource-group monshy-rg --query "properties.template.containers[0].env"
   ```

### Connection Errors

- Prüfe Connection Strings
- Prüfe Firewall-Regeln (Cosmos DB, Redis)
- Prüfe Container App interne Namen

### Frontend kann Backend nicht erreichen

- Prüfe CORS-Konfiguration
- Prüfe `FRONTEND_URL` Environment Variable
- Prüfe Gateway Ingress-Konfiguration

---

## 📚 Weitere Ressourcen

- [Azure Container Apps Documentation](https://docs.microsoft.com/azure/container-apps/)
- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)
- [Monshy Projekt README](../README.md)

---

## ✅ Checkliste

- [ ] Azure CLI installiert und angemeldet
- [ ] Docker installiert
- [ ] Subscription ausgewählt
- [ ] Alle Scripts ausführbar gemacht (`chmod +x scripts/*.sh`)
- [ ] Connection Strings gesammelt
- [ ] Secrets generiert (JWT, Encryption Keys)
- [ ] API Keys bereit (OpenAI, Serper)

---

**Viel Erfolg beim Deployment! 🚀**

