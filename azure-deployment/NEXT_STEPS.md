# 🚀 Nächste Schritte - Azure Deployment

## ✅ Was bereits erledigt ist

- ✅ Production Config Files erstellt
- ✅ Code-Anpassungen für Environment Variables
- ✅ Azure Resource Creation Scripts erstellt
- ✅ Dokumentation erstellt

---

## 📋 Priorisierte To-Do Liste

### Phase 1: Azure Ressourcen erstellen (JETZT)

**Zeitaufwand:** ~30-60 Minuten

1. **Azure CLI installieren** (falls noch nicht vorhanden)
   ```powershell
   winget install -e --id Microsoft.AzureCLI
   ```

2. **Bei Azure anmelden**
   ```powershell
   az login
   ```

3. **Subscription auswählen** (optional)
   ```powershell
   az account list --output table
   az account set --subscription "Your Subscription Name"
   ```

4. **Azure Ressourcen erstellen**
   ```powershell
   cd azure-deployment/scripts
   .\00-create-all-resources.ps1
   ```
   
   **Oder einzeln:**
   ```powershell
   .\01-create-resource-group.ps1
   .\02-create-container-registry.ps1
   .\03-create-container-apps-environment.ps1
   .\04-create-cosmos-db.ps1
   .\05-create-redis-cache.ps1
   .\06-create-key-vault.ps1
   .\07-summary.ps1
   ```

5. **Connection Strings speichern**
   - Die Scripts geben alle Connection Strings aus
   - **WICHTIG:** Speichere diese sicher (z.B. in Notepad oder Passwort-Manager)
   - Du brauchst sie später für Container Apps Environment Variables

6. **Secrets zu Key Vault hinzufügen**
   ```powershell
   # JWT Secret Key generieren (min. 32 Zeichen)
   # Beispiel: openssl rand -base64 32
   az keyvault secret set --vault-name monshy-kv --name JwtSecretKey --value "dein-generierter-secret-key"

   # Encryption Key generieren
   az keyvault secret set --vault-name monshy-kv --name EncryptionKey --value "dein-generierter-encryption-key"

   # OpenAI API Key (falls vorhanden)
   az keyvault secret set --vault-name monshy-kv --name OpenAIApiKey --value "sk-..."
   ```

---

### Phase 2: Lokal testen (Optional, aber empfohlen)

**Zeitaufwand:** ~15-30 Minuten

1. **Production Configs lokal testen**
   - Stelle sicher, dass die Services mit `appsettings.Production.json` starten
   - Prüfe, ob Environment Variables korrekt geladen werden

2. **Docker Compose testen**
   ```bash
   docker-compose up -d
   ```
   - Prüfe, ob alle Services starten
   - Teste die API-Endpoints

---

### Phase 3: Docker Images bauen und pushen (SPÄTER)

**Zeitaufwand:** ~30-60 Minuten

1. **Docker Images bauen**
2. **Zu Azure Container Registry pushen**
3. **Images testen**

**Hinweis:** Diese Scripts werden später erstellt.

---

### Phase 4: Container Apps deployen (SPÄTER)

**Zeitaufwand:** ~30-60 Minuten

1. **Container Apps erstellen**
2. **Environment Variables setzen**
3. **Health Checks konfigurieren**
4. **Deployment testen**

**Hinweis:** Diese Scripts werden später erstellt.

---

## 🎯 Empfohlene Reihenfolge (JETZT)

### Option A: Sofort mit Azure starten

1. ✅ Azure CLI installieren
2. ✅ `az login`
3. ✅ Scripts ausführen: `.\00-create-all-resources.ps1`
4. ✅ Connection Strings speichern
5. ✅ Secrets zu Key Vault hinzufügen

**Dann:** Warten auf Deployment-Scripts (später)

---

### Option B: Erst lokal testen

1. ✅ Production Configs prüfen
2. ✅ Docker Compose testen
3. ✅ Dann Azure Ressourcen erstellen

---

## 📝 Checkliste

### Vorbereitung
- [ ] Azure CLI installiert
- [ ] Bei Azure angemeldet (`az login`)
- [ ] Subscription ausgewählt
- [ ] Scripts-Verzeichnis gefunden (`azure-deployment/scripts`)

### Azure Ressourcen
- [ ] Resource Group erstellt
- [ ] Container Registry erstellt
- [ ] Container Apps Environment erstellt
- [ ] Cosmos DB erstellt
- [ ] Redis Cache erstellt
- [ ] Key Vault erstellt

### Nach dem Erstellen
- [ ] Connection Strings gespeichert
- [ ] Secrets zu Key Vault hinzugefügt
- [ ] Zusammenfassung geprüft (`.\07-summary.ps1`)

---

## 🔧 Wichtige Werte speichern

Nach dem Ausführen der Scripts, speichere diese Werte:

```bash
# Resource Group
RESOURCE_GROUP_NAME=monshy-rg

# Container Registry
ACR_NAME=monshyregistry
ACR_LOGIN_SERVER=monshyregistry.azurecr.io

# Container Apps Environment
ENV_NAME=monshy-env

# Cosmos DB
COSMOS_ACCOUNT_NAME=monshy-cosmos
COSMOS_CONNECTION_STRING=mongodb://...

# Redis
REDIS_NAME=monshy-redis
REDIS_CONNECTION_STRING=...

# Key Vault
KEY_VAULT_NAME=monshy-kv
```

---

## 🚨 Wichtige Hinweise

1. **Kosten:** Die erstellten Ressourcen verursachen Kosten (~$75-95/Monat)
2. **Connection Strings:** Speichere sie sicher - du brauchst sie später
3. **Secrets:** Generiere sichere Secrets (min. 32 Zeichen)
4. **RabbitMQ:** Nicht enthalten (optional, Code hat Fallback)

---

## 📚 Weitere Ressourcen

- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)
- [Scripts Dokumentation](./scripts/README.md)
- [RabbitMQ Notizen](./RABBITMQ_NOTES.md)
- [Code Änderungen](./CODE_CHANGES.md)

---

## ❓ Hilfe

Bei Problemen:
1. Prüfe die Script-Ausgabe (zeigt Fehler an)
2. Prüfe Azure Portal (Ressourcen sichtbar?)
3. Prüfe Logs: `az containerapp logs show ...`

---

**Empfehlung: Starte mit Phase 1 - Azure Ressourcen erstellen! 🚀**

