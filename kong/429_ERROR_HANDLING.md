# 🚦 429 Too Many Requests - User-Handling

## 📋 Was bedeutet 429?

**Status Code 429** bedeutet, dass der Benutzer das Rate-Limit überschritten hat. Kong blockiert weitere Requests für eine bestimmte Zeit.

**Hinweis:** `Retry-After` und Rate-Limit-Header werden **automatisch von Kong gesendet** - keine zusätzliche Konfiguration in `kong.yml` nötig! Siehe `kong/RETRY_AFTER.md` für Details.

## ✅ Was soll der Benutzer tun?

### Wie lange muss der User warten?

**Antwort: Der `Retry-After` Header gibt die genaue Wartezeit in Sekunden an.**

Beispiele aus den Logs:
- `Retry-After: 141` = **2 Minuten 21 Sekunden**
- `Retry-After: 259` = **4 Minuten 19 Sekunden**
- `Retry-After: 345` = **5 Minuten 45 Sekunden**
- `Retry-After: 379` = **6 Minuten 19 Sekunden**

**Die Wartezeit hängt davon ab, welches Limit erreicht wurde:**
- **Minute-Limit erreicht:** ~60 Sekunden (bis die aktuelle Minute vorbei ist)
- **Hour-Limit erreicht:** bis zu 3600 Sekunden (1 Stunde, bis die aktuelle Stunde vorbei ist)

### Kurze Antwort für UI:

```
"Zu viele Anfragen. Bitte warten Sie {Retry-After} Sekunden und versuchen Sie es erneut."
```

### Detaillierte Antwort:

1. **Warten:** Die Zeit aus dem `Retry-After` Header (in Sekunden)
2. **Rate-Limit-Header prüfen:** (falls im Frontend implementiert)
   - `Retry-After`: **Wartezeit in Sekunden** (z.B. 141 = 2 Minuten 21 Sekunden)
   - `X-RateLimit-Limit-Minute`: Maximale Anzahl pro Minute (z.B. 10)
   - `X-RateLimit-Remaining-Minute`: Verbleibende Requests pro Minute (z.B. 0)
   - `X-RateLimit-Limit-Hour`: Maximale Anzahl pro Stunde (z.B. 100)
   - `X-RateLimit-Remaining-Hour`: Verbleibende Requests pro Stunde (z.B. 96)

## 🎨 Frontend-Implementierung

### Beispiel: React/Vue/etc.

```typescript
// API Client Error Handling
async function handleApiError(error: any) {
  if (error.response?.status === 429) {
    // Kong sendet diese Header automatisch
    const retryAfterSeconds = parseInt(error.response.headers['retry-after'] || '60');
    const remainingMinute = parseInt(error.response.headers['x-ratelimit-remaining-minute'] || '0');
    const limitMinute = parseInt(error.response.headers['x-ratelimit-limit-minute'] || '10');
    const remainingHour = parseInt(error.response.headers['x-ratelimit-remaining-hour'] || '0');
    const limitHour = parseInt(error.response.headers['x-ratelimit-limit-hour'] || '100');
    
    // Wartezeit in lesbarem Format
    const minutes = Math.floor(retryAfterSeconds / 60);
    const seconds = retryAfterSeconds % 60;
    const waitTime = minutes > 0 
      ? `${minutes} Minute${minutes > 1 ? 'n' : ''} ${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`
      : `${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`;
    
    return {
      message: `Zu viele Anfragen. Bitte warten Sie ${waitTime} (${retryAfterSeconds} Sekunden).`,
      retryAfter: retryAfterSeconds,
      waitTime,
      remainingMinute,
      limitMinute,
      remainingHour,
      limitHour
    };
  }
  
  return { message: 'Ein Fehler ist aufgetreten.' };
}
```

### Beispiel: UI-Komponente

```tsx
// React Component
function RateLimitError({ retryAfter, waitTime, remainingMinute, limitMinute }) {
  const [countdown, setCountdown] = React.useState(retryAfter);
  
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);
  
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const displayTime = minutes > 0 
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds}s`;
  
  return (
    <div className="error-message">
      <h3>Zu viele Anfragen</h3>
      <p>
        Sie haben das Limit von {limitMinute} Anfragen pro Minute erreicht.
      </p>
      <p>
        <strong>Bitte warten Sie {waitTime} ({retryAfter} Sekunden)</strong>
      </p>
      {countdown > 0 && (
        <div className="countdown">
          <p>Verbleibende Wartezeit: <strong>{displayTime}</strong></p>
          <progress value={retryAfter - countdown} max={retryAfter} />
        </div>
      )}
      {remainingMinute !== undefined && (
        <p>Verbleibend: {remainingMinute} von {limitMinute} Requests/Minute</p>
      )}
      {countdown === 0 && (
        <button onClick={() => window.location.reload()}>
          Erneut versuchen
        </button>
      )}
    </div>
  );
}
```

## 📊 Aktuelle Rate-Limits

| Route | Limit/Minute | Limit/Stunde |
|-------|--------------|--------------|
| `/api/auth/login` | 10 | 100 |
| `/api/auth/register` | 10 | 100 |
| `/api/workflows` | 100 | 1000 |
| `/api/secrets` | 100 | 1000 |

## 🔧 Rate-Limits anpassen

Falls die Limits zu streng sind, in `kong/kong.yml` anpassen:

```yaml
- name: rate-limiting
  service: auth-service
  route: auth-login
  config:
    minute: 20  # Erhöhen von 10 auf 20
    hour: 200   # Erhöhen von 100 auf 200
```

Dann Kong neu starten:
```bash
docker-compose restart kong
```

## 💡 Best Practices

1. **Klare Fehlermeldung:** "Zu viele Anfragen" statt nur "429"
2. **Wartezeit anzeigen:** Countdown bis Retry möglich
3. **Retry-Button:** Nach Wartezeit automatisch erneut versuchen
4. **Rate-Limit-Info:** Zeige verbleibende Requests (falls Header verfügbar)

## 🔗 Weitere Infos

Siehe: `kong/RATE_LIMITING.md` für vollständige Dokumentation

