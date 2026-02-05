# 📚 Scripts Index - Übersicht

**Letzte Aktualisierung:** 2024-02-05  
**Status:** ✅ Alle nicht-funktionierenden Scripts wurden entfernt

---

## 🚀 Schnellstart

👉 **Starte hier:** [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) - Welche Scripts nutzen?

---

## 📖 Dokumentation

| Datei | Beschreibung |
|-------|--------------|
| [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) | ⚡ Schnelle Übersicht - welche Scripts nutzen |
| [`README_SCRIPTS.md`](./README_SCRIPTS.md) | 📜 Detaillierte Erklärung aller Scripts |
| [`README.md`](./README.md) | 📋 Hauptdokumentation - Resource Creation |

---

## ✅ Funktionierende Scripts

### Resource Creation (00-07)
- `00-create-all-resources.ps1` - Erstellt alle Resources auf einmal
- `01-create-resource-group.ps1` - Resource Group
- `02-create-container-registry.ps1` - Container Registry
- `03-create-container-apps-environment.ps1` - Container Apps Environment
- `04-create-cosmos-db.ps1` - Cosmos DB
- `05-create-redis-cache.ps1` - Redis Cache
- `06-create-key-vault.ps1` - Key Vault
- `07-summary.ps1` - Zusammenfassung

### Container Apps
- `create-container-apps-fixed.ps1` - Erstellt Container Apps
- `set-all-env-vars.ps1` - Setzt Environment Variables
- `setup-keyvault-access-simple.ps1` - Key Vault Zugriff
- `build-push-dockerhub.ps1` - Images bauen/pushen
- `update-container-apps-dockerhub.ps1` - Container Apps aktualisieren

### Bash Scripts (für WSL/Git Bash)
- Alle `*.sh` Scripts - Funktional identisch zu PowerShell Versionen

---

## ✅ Aufräumen abgeschlossen

**8 nicht-funktionierende Scripts wurden gelöscht:**
- ✅ `create-container-apps.ps1` - gelöscht
- ✅ `set-container-app-env-vars.ps1` - gelöscht
- ✅ `set-container-app-env-vars-simple.ps1` - gelöscht
- ✅ `set-env-vars-via-rest.ps1` - gelöscht
- ✅ `set-env-vars-clean.ps1` - gelöscht
- ✅ `set-env-vars-direct.ps1` - gelöscht
- ✅ `set-env-vars-auth-service.ps1` - gelöscht
- ✅ `setup-keyvault-access.ps1` - gelöscht
- ✅ `DELETE_THESE.ps1` - gelöscht (Cleanup-Script selbst)

**Alle verbleibenden Scripts funktionieren!** 🎉

---

## 📝 Standard Workflow

```powershell
# 1. Resources erstellen
.\00-create-all-resources.ps1

# 2. Container Apps erstellen
.\create-container-apps-fixed.ps1 -ResourceGroupName "<your-resource-group>" -EnvironmentName "monshy-env" -KeyVaultName "monshy-kv"

# 3. Environment Variables setzen
.\set-all-env-vars.ps1 -ResourceGroupName "<your-resource-group>" -KeyVaultName "monshy-kv"

# 4. Key Vault Zugriff gewähren
.\setup-keyvault-access-simple.ps1 -ResourceGroupName "<your-resource-group>" -KeyVaultName "monshy-kv"

# 5. Images bauen und pushen
docker login -u <your-dockerhub-username>
.\build-push-dockerhub.ps1 -DockerHubUsername <your-dockerhub-username>

# 6. Container Apps aktualisieren
.\update-container-apps-dockerhub.ps1 -DockerHubUsername <your-dockerhub-username> -ResourceGroupName "<your-resource-group>"
```

---

**Siehe:** [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md) für Details

