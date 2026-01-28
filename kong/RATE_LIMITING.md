# 🚦 Rate Limiting - Dokumentation

## 📋 Übersicht

Kong Gateway implementiert Rate Limiting, um die API vor Missbrauch und DDoS-Angriffen zu schützen.

## ⚙️ Aktuelle Konfiguration

**HINWEIS:** Die aktuellen Limits sind für E2E-Tests und Development erhöht. Für Production sollten sie reduziert werden.

### Öffentliche Auth Routes (Login, Register)
- **Limit:** 1000 Requests pro Minute (erhöht für E2E-Tests, Standard wäre 10)
- **Limit:** 10000 Requests pro Stunde (erhöht für E2E-Tests, Standard wäre 100)
- **Basis:** IP-Adresse

### API Routes (Workflows, etc.)
- **Limit:** 1000 Requests pro Minute (erhöht für E2E-Tests, Standard wäre 100)
- **Limit:** 10000 Requests pro Stunde (erhöht für E2E-Tests, Standard wäre 1000)
- **Basis:** IP-Adresse

### Secrets Service Routes
- **Limit:** 5000 Requests pro Minute (sehr hoch für E2E-Tests)
- **Limit:** 50000 Requests pro Stunde (sehr hoch für E2E-Tests)
- **Basis:** IP-Adresse

## 🔴 Fehler: 429 Too Many Requests

### Was bedeutet das?

Der Benutzer hat das Rate-Limit überschritten. Kong blockiert weitere Requests für eine bestimmte Zeit.

### Was soll der Benutzer tun?

#### Option 1: Warten (Empfohlen)
```
"Bitte warten Sie 60 Sekunden und versuchen Sie es erneut."
```

#### Option 2: Rate-Limit-Header prüfen
Die Response enthält Header mit Informationen (von Kong automatisch gesendet):
- `X-RateLimit-Limit-Minute`: Maximale Anzahl Requests pro Minute (z.B. 10)
- `X-RateLimit-Remaining-Minute`: Verbleibende Requests pro Minute (z.B. 0)
- `X-RateLimit-Limit-Hour`: Maximale Anzahl Requests pro Stunde (z.B. 100)
- `X-RateLimit-Remaining-Hour`: Verbleibende Requests pro Stunde (z.B. 96)
- `Retry-After`: Wartezeit in Sekunden bis zum nächsten Versuch (z.B. 141)

#### Option 3: Fehlermeldung anzeigen
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Maximum 10 requests per minute allowed.",
  "retryAfter": 60
}
```

## 🛠️ Frontend-Implementierung

### Beispiel: Fehlerbehandlung

```typescript
// API Client
async function login(email: string, password: string) {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.status === 429) {
      // Rate Limit erreicht
      const retryAfter = response.headers.get('Retry-After') || '60';
      const remainingMinute = response.headers.get('X-RateLimit-Remaining-Minute') || '0';
      const limitMinute = response.headers.get('X-RateLimit-Limit-Minute') || '10';
      
      throw new Error(
        `Zu viele Anfragen. Bitte warten Sie ${retryAfter} Sekunden. ` +
        `Verbleibend: ${remainingMinute} von ${limitMinute} Requests/Minute.`
      );
    }

    if (!response.ok) {
      throw new Error('Login fehlgeschlagen');
    }

    return await response.json();
  } catch (error) {
    // Fehlerbehandlung
    console.error('Login error:', error);
    throw error;
  }
}
```

### Beispiel: UI-Fehlermeldung

```typescript
// React/Vue/etc.
if (error.message.includes('429') || error.message.includes('Rate limit')) {
  showError(
    'Zu viele Anfragen',
    'Bitte warten Sie einen Moment und versuchen Sie es erneut. ' +
    'Maximal 1000 Login-Versuche pro Minute erlaubt (Development).'
  );
}
```

## 🔧 Rate-Limits anpassen

### Für Development erhöhen

In `kong/kong.yml`:

```yaml
- name: rate-limiting
  service: auth-service
  route: auth-login
  config:
    minute: 1000  # Erhöht für E2E-Tests (Standard: 10)
    hour: 10000   # Erhöht für E2E-Tests (Standard: 100)
```

Dann Kong neu starten:
```bash
docker-compose restart kong
```

### Für Production

Rate-Limits sollten in Production strenger sein:
- **Login/Register:** 5-10 Requests/Minute (Schutz vor Brute-Force)
- **API Routes:** 100 Requests/Minute (normaler Traffic)
- **Secrets Service:** 200 Requests/Minute (sensibler Service)

**Aktuell:** Die Limits sind für E2E-Tests erhöht. Vor Production sollten sie in `kong/kong.yml` reduziert werden.

## 📊 Monitoring

### Rate-Limit-Status prüfen

```bash
# Kong Admin API
curl http://localhost:8001/plugins | jq '.data[] | select(.name=="rate-limiting")'
```

### Logs prüfen

```bash
# Rate-Limit-Verletzungen in Logs
docker-compose logs kong | grep "429"
```

## 🎯 Best Practices

1. **Benutzerfreundliche Fehlermeldungen**
   - Zeige klare Meldung: "Zu viele Anfragen"
   - Zeige Wartezeit: "Bitte warten Sie 60 Sekunden"
   - Zeige Retry-Button (nach Wartezeit)

2. **Rate-Limit-Header nutzen**
   - Zeige verbleibende Requests im UI
   - Zeige Countdown bis Reset

3. **Retry-Logik**
   - Automatischer Retry nach `retryAfter` Sekunden
   - Exponential Backoff bei wiederholten 429-Fehlern

4. **Development vs. Production**
   - Development: Höhere Limits (20-50/Minute)
   - Production: Strikte Limits (5-10/Minute für Auth)

## 🔗 Weitere Ressourcen

- [Kong Rate Limiting Plugin](https://docs.konghq.com/hub/kong-inc/rate-limiting/)
- [HTTP 429 Status Code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)

