# 📜 Scripts Übersicht - Welche funktionieren?

Diese Dokumentation erklärt, welche Scripts funktionieren und welche du verwenden solltest.

---

## ✅ FUNKTIONIERENDE SCRIPTS (Verwenden!)

### 1. `set-all-env-vars.ps1` ⭐ **WICHTIG**
**Was macht es:** Setzt Environment Variables für alle Container Apps  
**Status:** ✅ Funktioniert perfekt  
**Verwendung:**
```powershell
.\set-all-env-vars.ps1 -ResourceGroupName "<your-resource-group>" -KeyVaultName "monshy-kv"
```
**Wann nutzen:** Nachdem Container Apps erstellt wurden, um Environment Variables zu setzen

---

### 2. `setup-keyvault-access-simple.ps1` ⭐ **WICHTIG**
**Was macht es:** Aktiviert Managed Identity und gewährt Key Vault Zugriff  
**Status:** ✅ Funktioniert perfekt  
**Verwendung:**
```powershell
.\setup-keyvault-access-simple.ps1 -ResourceGroupName "<your-resource-group>" -KeyVaultName "monshy-kv"
```
**Wann nutzen:** Nachdem Container Apps erstellt wurden, um Key Vault Zugriff zu gewähren

---

### 3. `build-push-dockerhub.ps1` ⭐ **WICHTIG**
**Was macht es:** Baut und pusht alle Docker Images zu Docker Hub  
**Status:** ✅ Funktioniert perfekt  
**Voraussetzung:** Docker Hub Login (`docker login -u <your-username>`)  
**Verwendung:**
```powershell
.\build-push-dockerhub.ps1 -DockerHubUsername <your-username>
```
**Wann nutzen:** Wenn du neue Images bauen und pushen willst

---

### 4. `update-container-apps-dockerhub.ps1` ⭐ **WICHTIG**
**Was macht es:** Aktualisiert Container Apps mit Docker Hub Images  
**Status:** ✅ Funktioniert perfekt  
**Verwendung:**
```powershell
.\update-container-apps-dockerhub.ps1 -DockerHubUsername <your-username> -ResourceGroupName "<your-resource-group>"
```
**Wann nutzen:** Nachdem Images zu Docker Hub gepusht wurden

---

### 5. `create-container-apps-fixed.ps1` ✅
**Was macht es:** Erstellt Container Apps (ohne Environment Variables)  
**Status:** ✅ Funktioniert, aber Environment Variables müssen separat gesetzt werden  
**Verwendung:**
```powershell
.\create-container-apps-fixed.ps1 -ResourceGroupName "<your-resource-group>" -EnvironmentName "monshy-env" -KeyVaultName "monshy-kv"
```
**Wann nutzen:** Um Container Apps zu erstellen (dann `set-all-env-vars.ps1` danach ausführen)

---

## ✅ Aufräumen abgeschlossen!

**Alle nicht-funktionierenden Scripts wurden gelöscht!** (2024-02-05)

Die folgenden Scripts wurden entfernt:
- ~~`create-container-apps.ps1`~~ - gelöscht (ersetzt durch `create-container-apps-fixed.ps1`)
- ~~`set-container-app-env-vars.ps1`~~ - gelöscht (ersetzt durch `set-all-env-vars.ps1`)
- ~~`set-container-app-env-vars-simple.ps1`~~ - gelöscht (ersetzt durch `set-all-env-vars.ps1`)
- ~~`set-env-vars-via-rest.ps1`~~ - gelöscht (ersetzt durch `set-all-env-vars.ps1`)
- ~~`set-env-vars-clean.ps1`~~ - gelöscht (ersetzt durch `set-all-env-vars.ps1`)
- ~~`set-env-vars-direct.ps1`~~ - gelöscht (ersetzt durch `set-all-env-vars.ps1`)
- ~~`set-env-vars-auth-service.ps1`~~ - gelöscht (ersetzt durch `set-all-env-vars.ps1`)
- ~~`setup-keyvault-access.ps1`~~ - gelöscht (ersetzt durch `setup-keyvault-access-simple.ps1`)

**Alle verbleibenden Scripts funktionieren!** 🎉

---

### ⚠️ Bash Scripts

**`create-container-apps.sh`** ⚠️  
**Status:** ⚠️ Funktioniert nur mit WSL/Git Bash, nicht mit PowerShell  
**Empfehlung:** Nur verwenden, wenn du WSL/Git Bash hast

---

## 📋 Empfohlener Workflow

### Schritt 1: Container Apps erstellen
```powershell
.\create-container-apps-fixed.ps1 -ResourceGroupName "<your-resource-group>" -EnvironmentName "monshy-env" -KeyVaultName "monshy-kv"
```

### Schritt 2: Environment Variables setzen
```powershell
.\set-all-env-vars.ps1 -ResourceGroupName "<your-resource-group>" -KeyVaultName "monshy-kv"
```

### Schritt 3: Key Vault Zugriff gewähren
```powershell
.\setup-keyvault-access-simple.ps1 -ResourceGroupName "<your-resource-group>" -KeyVaultName "monshy-kv"
```

### Schritt 4: Images bauen und pushen
```powershell
# Erst einloggen
docker login -u izadi2026

# Dann bauen und pushen
.\build-push-dockerhub.ps1 -DockerHubUsername <your-username>
```

### Schritt 5: Container Apps aktualisieren
```powershell
.\update-container-apps-dockerhub.ps1 -DockerHubUsername <your-username> -ResourceGroupName "<your-resource-group>"
```

---

## ✅ Aufräumen abgeschlossen

**Alle nicht-funktionierenden Scripts wurden bereits gelöscht!** (2024-02-05)

---

## 📝 Zusammenfassung

### ✅ Nutze diese Scripts:
1. `create-container-apps-fixed.ps1` - Container Apps erstellen
2. `set-all-env-vars.ps1` - Environment Variables setzen
3. `setup-keyvault-access-simple.ps1` - Key Vault Zugriff
4. `build-push-dockerhub.ps1` - Images bauen/pushen
5. `update-container-apps-dockerhub.ps1` - Container Apps aktualisieren

### ❌ Nutze diese NICHT:
- Alle anderen Scripts (haben Probleme oder sind veraltet)

---

**Letzte Aktualisierung:** 2024-02-05

