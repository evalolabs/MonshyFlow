# ⚡ Quick Reference - Welche Scripts nutzen?

## ✅ NUTZE DIESE (Funktionieren!)

| Script | Was macht es | Wann nutzen |
|--------|--------------|-------------|
| `create-container-apps-fixed.ps1` | Erstellt Container Apps | Beim ersten Setup |
| `set-all-env-vars.ps1` | Setzt Environment Variables | Nach Container Apps Erstellung |
| `setup-keyvault-access-simple.ps1` | Key Vault Zugriff | Nach Container Apps Erstellung |
| `build-push-dockerhub.ps1` | Baut & pusht Images | Wenn du neue Images hast |
| `update-container-apps-dockerhub.ps1` | Aktualisiert Container Apps | Nach Image Push |

---

## ✅ Alle nicht-funktionierenden Scripts wurden gelöscht!

Die folgenden Scripts wurden bereits entfernt:
- ~~`create-container-apps.ps1`~~ - gelöscht
- ~~`set-container-app-env-vars.ps1`~~ - gelöscht
- ~~`set-container-app-env-vars-simple.ps1`~~ - gelöscht
- ~~`set-env-vars-via-rest.ps1`~~ - gelöscht
- ~~`set-env-vars-clean.ps1`~~ - gelöscht
- ~~`set-env-vars-direct.ps1`~~ - gelöscht
- ~~`set-env-vars-auth-service.ps1`~~ - gelöscht
- ~~`setup-keyvault-access.ps1`~~ - gelöscht

**Alle verbleibenden Scripts funktionieren!** 🎉

---

## 🚀 Standard Workflow

```powershell
# 1. Container Apps erstellen
.\create-container-apps-fixed.ps1 -ResourceGroupName "<your-resource-group>" -EnvironmentName "monshy-env" -KeyVaultName "monshy-kv"

# 2. Environment Variables setzen
.\set-all-env-vars.ps1 -ResourceGroupName "<your-resource-group>" -KeyVaultName "monshy-kv"

# 3. Key Vault Zugriff gewähren
.\setup-keyvault-access-simple.ps1 -ResourceGroupName "<your-resource-group>" -KeyVaultName "monshy-kv"

# 4. Images bauen und pushen (nach Code-Änderungen)
docker login -u <your-dockerhub-username>
.\build-push-dockerhub.ps1 -DockerHubUsername <your-dockerhub-username>

# 5. Container Apps aktualisieren
.\update-container-apps-dockerhub.ps1 -DockerHubUsername <your-dockerhub-username> -ResourceGroupName "<your-resource-group>"
```

---

**Siehe auch:** `README_SCRIPTS.md` für detaillierte Informationen

