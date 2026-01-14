# API Integrations - ToDos

Diese Datei listet alle offenen ToDos für API-Integrationen auf, basierend auf der aktuellen Kategorisierung.

**Letzte Aktualisierung:** 2025-12-26

---

## ✅ Abgeschlossen

### 1. URL Placeholder Authentication
- **Status:** ✅ Vollständig implementiert
- **Beispiel:** Telegram (`/bot{token}/`)
- **Code:** `nodeUtils.ts`, `ApiAuthConfig.tsx`
- **Dokumentation:** `API_INTEGRATIONS_AUTH_CATEGORIES.md`

### 2. Query Parameter Authentication
- **Status:** ✅ Vollständig implementiert
- **Beispiele:** Pipedrive, Hunter.io, Pushover
- **Anzahl:** 13 APIs

### 3. Multi-Secret Authentication
- **Status:** ✅ Vollständig implementiert
- **Beispiele:** Pushover, Copper, Paddle, RocketChat, Salesmate, Spontit
- **Anzahl:** 6 APIs

### 4. Header Authentication (Standard/Bearer/Basic)
- **Status:** ✅ Vollständig implementiert
- **Anzahl:** 173 APIs

### 5. AWS Signature Authentication
- **Status:** ✅ Vollständig implementiert
- **Beispiel:** AWS S3
- **Anzahl:** 1 API

---

## ⚠️ Offene ToDos

### 1. OAuth2 Authentication - Vollständige Implementierung
**Priorität:** Hoch  
**Status:** Vorbereitet, aber noch nicht vollständig implementiert  
**Anzahl betroffener APIs:** 17

**Betroffene APIs:**
- Bitwarden
- Box
- Google Analytics
- Google Drive
- Google Sheets
- HelpScout
- Keap (Infusionsoft)
- LinkedIn
- Microsoft OneDrive
- Microsoft Outlook
- Microsoft SharePoint
- Microsoft Teams
- PayPal
- QuickBooks Online
- Salesforce
- Twitter (X)
- Xero

**Was fehlt:**
- OAuth2 Flow-Implementierung (Authorization Code Flow)
- Token Refresh-Mechanismus
- UI für OAuth2-Authentifizierung
- Token-Speicherung und -Verwaltung

**Nächste Schritte:**
1. OAuth2 Flow in `ApiAuthConfig.tsx` implementieren
2. Token Refresh-Logik hinzufügen
3. UI für OAuth2-Authentifizierung erstellen
4. Token-Speicherung in Secrets Service integrieren

---

### 2. Unknown/No Authentication - Prüfung
**Priorität:** Mittel  
**Status:** 1 API ohne Authentication-Konfiguration  
**Anzahl betroffener APIs:** 1

**Problem:**
- Eine API hat `undefined` als ID und keine Authentication-Konfiguration

**Nächste Schritte:**
1. Prüfen, welche API betroffen ist
2. Authentication-Konfiguration hinzufügen oder API entfernen

---

### 3. Potenzielle URL Placeholder APIs
**Priorität:** Niedrig  
**Status:** Prüfung erforderlich  
**Anzahl potenzieller APIs:** Unbekannt

**Hintergrund:**
- Telegram verwendet URL Placeholder (`/bot{token}/`)
- Andere Bot APIs könnten ähnliche Patterns verwenden

**Zu prüfende APIs:**
- Discord Bot API (verwendet aktuell Header: `Bot {token}`)
- Andere Bot APIs, die Token im URL-Pfad benötigen

**Nächste Schritte:**
1. Bot APIs identifizieren
2. API-Dokumentation prüfen
3. Bei Bedarf auf URL Placeholder umstellen

---

### 4. Multi-Secret APIs - Vollständigkeit prüfen
**Priorität:** Niedrig  
**Status:** Implementiert, aber Vollständigkeit prüfen  
**Anzahl betroffener APIs:** 6

**Aktuelle Multi-Secret APIs:**
- Pushover (✅ Query Parameter mit token + user)
- Copper (Header mit X-PW-AccessToken)
- Paddle (Header mit Authorization)
- RocketChat (Header mit X-Auth-Token)
- Salesmate (Header mit sessionToken)
- Spontit (Header mit X-Authorization)

**Zu prüfen:**
- Sind alle Multi-Secret APIs korrekt konfiguriert?
- Gibt es weitere APIs, die Multi-Secret benötigen, aber noch nicht so konfiguriert sind?

**Nächste Schritte:**
1. Jede Multi-Secret API testen
2. Dokumentation prüfen, ob weitere Secrets benötigt werden
3. Konfigurationen aktualisieren, falls nötig

---

## 📋 Implementierungsreihenfolge (Empfehlung)

1. **OAuth2 Authentication** (Hoch)
   - Größter Impact (17 APIs)
   - Wichtig für Google, Microsoft, Salesforce Integrationen
   - Komplex, aber kritisch

2. **Unknown API prüfen** (Mittel)
   - Schnell zu beheben
   - Verbessert Datenqualität

3. **Multi-Secret APIs prüfen** (Niedrig)
   - Bereits implementiert
   - Nur Validierung nötig

4. **Potenzielle URL Placeholder APIs** (Niedrig)
   - Nur wenn neue Bot APIs hinzugefügt werden
   - Telegram ist bereits fertig

---

## 🔧 Technische Details

### OAuth2 Implementierung - Anforderungen

**Backend:**
- OAuth2 Authorization Code Flow
- Token Exchange
- Token Refresh
- Token Storage (in Secrets Service)

**Frontend:**
- OAuth2 Redirect-Handler
- Token-Management UI
- Token Refresh-Logik
- Integration in `ApiAuthConfig.tsx`

**Konfiguration:**
```json
{
  "authentication": {
    "type": "oauth2",
    "authorizationUrl": "https://api.example.com/oauth/authorize",
    "tokenUrl": "https://api.example.com/oauth/token",
    "clientId": "OAUTH2_CLIENT_ID",
    "clientSecret": "OAUTH2_CLIENT_SECRET",
    "scope": "read write",
    "redirectUri": "https://app.monshyflow.com/oauth/callback"
  }
}
```

---

## 📊 Statistiken

- **Gesamt APIs:** 212
- **Vollständig implementiert:** 195 (92%)
- **OAuth2 (offen):** 17 (8%)
- **Unknown:** 1 (<1%)

---

## 🔄 Wartung

Diese ToDo-Liste sollte aktualisiert werden, wenn:
- Neue APIs hinzugefügt werden
- Neue Authentication-Typen implementiert werden
- Bestehende APIs ihre Authentication-Methode ändern

**Automatische Aktualisierung:**
```bash
cd shared
npm run categorize:apis
```

Dieses Skript analysiert alle APIs und aktualisiert die Kategorisierung in `API_INTEGRATIONS_AUTH_CATEGORIES.md`.

