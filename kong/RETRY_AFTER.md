# ⏱️ Retry-After Header - Wartezeit bei 429

## 📋 Übersicht

Der `Retry-After` Header gibt die **genaue Wartezeit in Sekunden** an, die der Benutzer warten muss, bis das Rate-Limit zurückgesetzt wird.

**Wichtig:** `Retry-After` wird **automatisch von Kong gesendet** - keine zusätzliche Konfiguration nötig!

## ⚙️ Konfiguration in kong.yml

Die Rate-Limit-Header (inkl. `Retry-After`) werden automatisch von Kong gesendet, wenn:

```yaml
- name: rate-limiting
  config:
    minute: 10
    hour: 100
    hide_client_headers: false  # ← Wichtig: muss false sein!
```

**Was wird automatisch gesendet:**
- ✅ `Retry-After` - Wartezeit in Sekunden (automatisch)
- ✅ `X-RateLimit-Limit-Minute` - Limit pro Minute
- ✅ `X-RateLimit-Remaining-Minute` - Verbleibend pro Minute
- ✅ `X-RateLimit-Limit-Hour` - Limit pro Stunde
- ✅ `X-RateLimit-Remaining-Hour` - Verbleibend pro Stunde

**Keine zusätzliche Konfiguration nötig!** Kong berechnet diese Werte automatisch.

## 🔍 Wie lange muss der User warten?

**Antwort: Die Zeit aus dem `Retry-After` Header (in Sekunden)**

### Beispiele aus echten Logs:

| Retry-After | Wartezeit | Erklärung |
|-------------|-----------|-----------|
| `141` | **2 Minuten 21 Sekunden** | Minute-Limit erreicht, ~60s bis Minute vorbei |
| `259` | **4 Minuten 19 Sekunden** | Minute-Limit erreicht |
| `345` | **5 Minuten 45 Sekunden** | Minute-Limit erreicht |
| `379` | **6 Minuten 19 Sekunden** | Minute-Limit erreicht |

### Wartezeit hängt vom Limit ab:

- **Minute-Limit erreicht:** 
  - ~60 Sekunden (bis die aktuelle Minute vorbei ist)
  - Kann variieren je nachdem, wann in der Minute das Limit erreicht wurde

- **Hour-Limit erreicht:**
  - Bis zu 3600 Sekunden (1 Stunde)
  - Bis die aktuelle Stunde vorbei ist

## 💻 Frontend-Implementierung

### Beispiel: Wartezeit anzeigen

```typescript
// API Error Handler
if (response.status === 429) {
  const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
  
  // In Sekunden
  const waitSeconds = retryAfter;
  
  // In lesbarem Format
  const minutes = Math.floor(retryAfter / 60);
  const seconds = retryAfter % 60;
  const waitTime = minutes > 0 
    ? `${minutes} Minute${minutes > 1 ? 'n' : ''} ${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`
    : `${seconds} Sekunde${seconds !== 1 ? 'n' : ''}`;
  
  // Beispiel: "2 Minuten 21 Sekunden" oder "45 Sekunden"
  showError(`Zu viele Anfragen. Bitte warten Sie ${waitTime}.`);
}
```

### Beispiel: Countdown-Timer

```tsx
// React Component mit Countdown
function RateLimitError({ retryAfter }) {
  const [countdown, setCountdown] = useState(retryAfter);
  
  useEffect(() => {
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
    <div>
      <p>Zu viele Anfragen. Bitte warten Sie:</p>
      <h2>{displayTime}</h2>
      <progress value={retryAfter - countdown} max={retryAfter} />
      {countdown === 0 && (
        <button onClick={() => window.location.reload()}>
          Erneut versuchen
        </button>
      )}
    </div>
  );
}
```

### Beispiel: Automatischer Retry

```typescript
// Automatischer Retry nach Wartezeit
async function loginWithRetry(email: string, password: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        console.log(`Rate limit erreicht. Warte ${retryAfter} Sekunden...`);
        
        // Warte die angegebene Zeit
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        
        // Erneut versuchen
        continue;
      }
      
      if (!response.ok) {
        throw new Error('Login fehlgeschlagen');
      }
      
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

## 📊 Header-Übersicht

| Header | Beispiel | Bedeutung |
|--------|----------|-----------|
| `Retry-After` | `141` | **Wartezeit in Sekunden** (wichtigste Info!) |
| `X-RateLimit-Limit-Minute` | `10` | Max. Requests pro Minute |
| `X-RateLimit-Remaining-Minute` | `0` | Verbleibende Requests/Minute |
| `X-RateLimit-Limit-Hour` | `100` | Max. Requests pro Stunde |
| `X-RateLimit-Remaining-Hour` | `96` | Verbleibende Requests/Stunde |

## ✅ Best Practices

1. **Immer `Retry-After` verwenden** - Das ist die genaue Wartezeit
2. **Countdown anzeigen** - Zeige dem User, wie lange er noch warten muss
3. **Automatischer Retry** - Nach Wartezeit automatisch erneut versuchen
4. **Lesbares Format** - Zeige "2 Minuten 21 Sekunden" statt "141 Sekunden"

## 🔗 Siehe auch

- `kong/429_ERROR_HANDLING.md` - Vollständige Error-Handling-Dokumentation
- `kong/RATE_LIMITING.md` - Rate-Limiting-Konfiguration

