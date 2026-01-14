# OAuth2 Testing Guide

Diese Anleitung hilft dir dabei, die OAuth2-Implementierung mit verschiedenen APIs zu testen.

## 🎯 Empfohlene APIs zum Testen

### 1. **Google Sheets** ⭐ (Empfohlen für erste Tests)
**Warum:** Einfach zu testen, kostenlos, gute Dokumentation

**Setup:**
1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Aktiviere "Google Sheets API":
   - Gehe zu "APIs & Services" → "Library"
   - Suche nach "Google Sheets API"
   - Klicke auf "Enable"
4. **WICHTIG: Konfiguriere zuerst den Consent Screen:**
   - Gehe zu "APIs & Services" → "OAuth consent screen"
   - Wähle "External" (für Tests) oder "Internal" (nur für Google Workspace)
   - Fülle die erforderlichen Felder aus:
     * **App name:** z.B. "MonshyFlow Integration"
     * **User support email:** Deine E-Mail
     * **Developer contact information:** Deine E-Mail
   - Klicke auf "Save and Continue"
   - **Scopes:** Klicke "Add or Remove Scopes"
     * Füge hinzu: `https://www.googleapis.com/auth/spreadsheets.readonly` oder `https://www.googleapis.com/auth/spreadsheets`
   - Klicke "Save and Continue"
   - **Test users (optional):** Für "External" Apps kannst du Test-User hinzufügen
   - Klicke "Save and Continue"
   - **Summary:** Überprüfe und klicke "Back to Dashboard"
5. Jetzt kannst du die OAuth Client ID erstellen:
   - Gehe zu "APIs & Services" → "Credentials"
   - Klicke "Create Credentials" → "OAuth 2.0 Client ID"
   - Wähle "Web application"
   - **Name:** z.B. "MonshyFlow Web Client"
   - **Authorized redirect URIs:** Füge hinzu:
     * `http://localhost:5173/oauth2/callback` (für lokale Entwicklung)
     * `https://yourdomain.com/oauth2/callback` (für Production)
   - Klicke "Create"
6. Kopiere Client ID und Client Secret (wird nur einmal angezeigt!)

**Konfiguration in MonshyFlow:**
- **Client ID Secret:** `GOOGLE_SHEETS_CLIENT_ID`
- **Client Secret:** `GOOGLE_SHEETS_CLIENT_SECRET`
- **Access Token Secret:** `GOOGLE_SHEETS_ACCESS_TOKEN` (wird automatisch erstellt)

**Test-Endpoint:**
- "Get Spreadsheet" - Einfach zu testen, benötigt nur eine Spreadsheet ID

**OAuth2 Scopes:**
- `https://www.googleapis.com/auth/spreadsheets.readonly` (nur lesen)
- `https://www.googleapis.com/auth/spreadsheets` (lesen & schreiben)

---

### 2. **Microsoft Teams** ⭐ (Gut für Enterprise-Tests)
**Warum:** Häufig in Unternehmen verwendet, gute API

**Setup:**
1. Gehe zu [Azure Portal](https://portal.azure.com/)
2. Azure Active Directory → App registrations → New registration
3. Name: z.B. "MonshyFlow Teams Integration"
4. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
5. Redirect URI: `http://localhost:5173/oauth2/callback` (Web)
6. Gehe zu "Certificates & secrets" → "New client secret"
7. Kopiere Client ID und Client Secret
8. Gehe zu "API permissions" → "Add a permission" → "Microsoft Graph"
9. Füge benötigte Permissions hinzu (z.B. `Chat.ReadWrite`, `ChannelMessage.Send`)

**Konfiguration in MonshyFlow:**
- **Client ID Secret:** `MICROSOFT_TEAMS_CLIENT_ID`
- **Client Secret:** `MICROSOFT_TEAMS_CLIENT_SECRET`
- **Access Token Secret:** `MICROSOFT_TEAMS_ACCESS_TOKEN` (wird automatisch erstellt)
- **Tenant ID:** Optional, kann in `tokenUrl` als `{tenantId}` Platzhalter verwendet werden

**Test-Endpoint:**
- "Send Channel Message" - Einfach zu testen

**OAuth2 Scopes:**
- `https://graph.microsoft.com/Chat.ReadWrite`
- `https://graph.microsoft.com/ChannelMessage.Send`

---

### 3. **LinkedIn** (Einfach für Social Media Tests)
**Warum:** Einfaches Setup, kostenlos für Entwickler

**Setup:**
1. Gehe zu [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Erstelle eine neue App
3. Gehe zu "Auth" Tab
4. Füge Redirect URLs hinzu: `http://localhost:5173/oauth2/callback`
5. Kopiere Client ID und Client Secret

**Konfiguration in MonshyFlow:**
- **Client ID Secret:** `LINKEDIN_CLIENT_ID`
- **Client Secret:** `LINKEDIN_CLIENT_SECRET`
- **Access Token Secret:** `LINKEDIN_ACCESS_TOKEN` (wird automatisch erstellt)

**Test-Endpoint:**
- "Get Profile" - Einfach zu testen

**OAuth2 Scopes:**
- `r_liteprofile` (Basic Profile)
- `r_emailaddress` (Email Address)
- `w_member_social` (Post Content)

---

### 4. **Salesforce** (Für CRM-Tests)
**Warum:** Sehr verbreitet, gute API

**Setup:**
1. Gehe zu [Salesforce Setup](https://login.salesforce.com/)
2. Setup → App Manager → New Connected App
3. Enable OAuth Settings
4. Callback URL: `http://localhost:5173/oauth2/callback`
5. Selected OAuth Scopes: Basic (Access your basic information)
6. Kopiere Consumer Key (Client ID) und Consumer Secret (Client Secret)

**Konfiguration in MonshyFlow:**
- **Client ID Secret:** `SALESFORCE_CLIENT_ID`
- **Client Secret:** `SALESFORCE_CLIENT_SECRET`
- **Access Token Secret:** `SALESFORCE_ACCESS_TOKEN` (wird automatisch erstellt)

**Test-Endpoint:**
- "Get Account" - Einfach zu testen

---

## 📋 Test-Schritte

### Schritt 1: Secrets konfigurieren
1. Gehe zu Secrets Management (`/admin/secrets`)
2. Erstelle die benötigten Secrets:
   - Client ID Secret (z.B. `GOOGLE_SHEETS_CLIENT_ID`)
   - Client Secret (z.B. `GOOGLE_SHEETS_CLIENT_SECRET`)

### Schritt 2: API Node erstellen
1. Öffne einen Workflow
2. Füge einen HTTP Request Node hinzu
3. Wähle die API-Integration (z.B. "Google Sheets")
4. Wähle einen Endpoint (z.B. "Get Spreadsheet")

### Schritt 3: OAuth2 Authentifizierung
1. Im Node Config Panel siehst du die OAuth2-Sektion
2. Wähle die Client ID und Client Secret Secrets aus
3. Klicke auf "Connect with [API Name]"
4. Du wirst zum OAuth Provider weitergeleitet
5. Autorisiere die App
6. Du wirst zurückgeleitet und der Access Token wird gespeichert

### Schritt 4: Node konfigurieren
1. Fülle die benötigten Felder aus (z.B. Spreadsheet ID)
2. Teste den Node mit dem Play-Button
3. Prüfe die Antwort im Debug Panel

---

## 🔧 Aktuelle OAuth2-Konfiguration prüfen

Die OAuth2-Konfiguration für jede API findest du in:
- `shared/apiIntegrations/{api-id}.json`

Wichtige Felder:
- `authorizationUrl` - OAuth2 Authorization Endpoint (muss vorhanden sein)
- `tokenUrl` - OAuth2 Token Endpoint (muss vorhanden sein)
- `clientIdSecretKey` - Name des Secrets für Client ID
- `clientSecretSecretKey` - Name des Secrets für Client Secret
- `scope` - OAuth2 Scopes (optional)
- `redirectUri` - Redirect URI (optional, Standard: `/oauth2/callback`)

---

## ⚠️ Bekannte Einschränkungen

### APIs ohne vollständige OAuth2-Konfiguration
Einige APIs haben `type: "oauth2"` aber noch keine vollständige Konfiguration:

**Fehlt `authorizationUrl`:**
- Google Sheets
- Google Drive
- Google Analytics
- Salesforce
- Twitter
- PayPal
- QuickBooks Online
- Xero
- Box
- Bitwarden
- HelpScout
- Keap

**Diese müssen noch konfiguriert werden!**

### APIs mit vollständiger Konfiguration
- Microsoft Teams ✅
- Microsoft Outlook ✅
- Microsoft OneDrive ✅
- Microsoft SharePoint ✅
- LinkedIn ✅

---

## 🚀 Nächste Schritte

### 1. Google Sheets konfigurieren
Füge `authorizationUrl` und `tokenUrl` zu `google-sheets.json` hinzu:

```json
{
  "authentication": {
    "type": "oauth2",
    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth",
    "tokenUrl": "https://oauth2.googleapis.com/token",
    "headerName": "Authorization",
    "headerFormat": "Bearer {accessToken}",
    "secretKey": "GOOGLE_SHEETS_ACCESS_TOKEN",
    "clientIdSecretKey": "GOOGLE_SHEETS_CLIENT_ID",
    "clientSecretSecretKey": "GOOGLE_SHEETS_CLIENT_SECRET",
    "scope": "https://www.googleapis.com/auth/spreadsheets"
  }
}
```

### 2. Weitere APIs konfigurieren
Nach dem gleichen Muster für andere APIs.

---

## 📝 Test-Checkliste

- [ ] Client ID Secret erstellt
- [ ] Client Secret erstellt
- [ ] OAuth2 App beim Provider registriert
- [ ] Redirect URI konfiguriert
- [ ] API Node erstellt
- [ ] "Connect" Button geklickt
- [ ] OAuth2 Flow erfolgreich abgeschlossen
- [ ] Access Token in Secrets gespeichert
- [ ] API Request erfolgreich ausgeführt
- [ ] Token Refresh getestet (optional)

---

## 🐛 Troubleshooting

### Problem: "To create an OAuth client ID, you must first configure your consent screen" ⚠️
**Das siehst du gerade!** Dies ist ein häufiger Fehler beim Google OAuth2 Setup.

**Lösung - Schritt für Schritt:**
1. Klicke auf den gelben Banner "Configure Consent Screen" (oder gehe manuell zu "APIs & Services" → "OAuth consent screen")
2. **User Type auswählen:**
   - **External** - Für Tests und öffentliche Apps (empfohlen für Tests)
   - **Internal** - Nur für Google Workspace Organisationen
3. **App Information ausfüllen:**
   - **App name:** z.B. "MonshyFlow Integration" oder "My Test App"
   - **User support email:** Deine E-Mail-Adresse
   - **App logo:** Optional
   - **App domain:** Optional für Tests
   - **Developer contact information:** Deine E-Mail-Adresse
4. Klicke "Save and Continue"
5. **Scopes hinzufügen:**
   - Klicke "Add or Remove Scopes"
   - Suche nach "spreadsheets" oder füge manuell hinzu:
     * `https://www.googleapis.com/auth/spreadsheets.readonly` (nur lesen)
     * `https://www.googleapis.com/auth/spreadsheets` (lesen & schreiben)
   - Klicke "Update" → "Save and Continue"
6. **Test users (nur für External Apps):**
   - Füge deine E-Mail-Adresse als Test User hinzu
   - Klicke "Save and Continue"
7. **Summary:** Überprüfe alles und klicke "Back to Dashboard"
8. **Jetzt kannst du die OAuth Client ID erstellen!**
   - Gehe zu "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"

### Problem: "OAuth2 authorization URL not configured"
**Lösung:** Die API hat noch keine `authorizationUrl` in der Konfiguration. Siehe "Nächste Schritte" oben.

### Problem: "Client ID is required"
**Lösung:** Stelle sicher, dass du das Client ID Secret im Node Config Panel ausgewählt hast.

### Problem: "Invalid redirect_uri"
**Lösung:** Die Redirect URI muss exakt mit der im OAuth Provider registrierten übereinstimmen. Standard: `http://localhost:5173/oauth2/callback`

### Problem: "Token exchange failed"
**Lösung:** 
- Prüfe, ob Client Secret korrekt ist
- Prüfe, ob Code Verifier korrekt übergeben wird (PKCE)
- Prüfe Backend-Logs für Details

### Problem: "Access blocked: This app's request is invalid"
**Lösung:**
- Für "External" Apps: Füge deine E-Mail als Test User hinzu (OAuth consent screen → Test users)
- Oder veröffentliche die App (für Production)

---

**Letzte Aktualisierung:** 2025-12-26

