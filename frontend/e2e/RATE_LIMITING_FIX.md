# Rate Limiting Fix für E2E-Tests

## Problem
Die E2E-Tests schlagen fehl mit **429 Too Many Requests**, weil zu viele Login-Versuche das Rate-Limit überschreiten.

## Lösungen

### 1. Rate-Limits in Kong erhöht ✅
Die `kong/kong.yml` wurde angepasst:
- **Login**: 1000 Requests/Minute (vorher: 10)
- **Register**: 1000 Requests/Minute (vorher: 10)
- **Hourly**: 10000 Requests/Stunde (vorher: 100)

**Wichtig**: Kong muss neu gestartet werden:
```bash
docker-compose restart kong
```

### 2. Session-Caching in Tests ✅
Die `loginAsTestUser` Funktion wurde verbessert:
- Prüft, ob bereits eine gültige Session existiert
- Überspringt Login, wenn bereits authentifiziert
- Cacht authentifizierte Sessions

### 3. Weitere Optimierungen

#### Option A: Global Setup (Empfohlen für CI/CD)
Erstelle eine globale `setup.ts` Datei, die sich einmal anmeldet und die Session für alle Tests teilt:

```typescript
// frontend/e2e/tests/global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Login once
  await page.goto('http://localhost:5173/login');
  await page.fill('input[type="email"]', 'admin@acme.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => url.pathname !== '/login');
  
  // Save auth state
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
  await browser.close();
}

export default globalSetup;
```

Dann in `playwright.config.ts`:
```typescript
export default defineConfig({
  globalSetup: require.resolve('./tests/global-setup.ts'),
  use: {
    storageState: 'playwright/.auth/user.json',
  },
  // ...
});
```

#### Option B: Delays zwischen Tests
Füge Delays zwischen Login-Versuchen hinzu, wenn Session-Caching nicht funktioniert:

```typescript
// Warte 1 Sekunde zwischen Login-Versuchen
await page.waitForTimeout(1000);
```

## Nächste Schritte

1. **Kong neu starten**:
   ```bash
   docker-compose restart kong
   ```

2. **Tests erneut ausführen**:
   ```bash
   cd frontend/e2e
   pnpm test
   ```

3. **Falls weiterhin 429-Fehler auftreten**:
   - Prüfe Kong-Logs: `docker-compose logs kong | grep 429`
   - Prüfe, ob Rate-Limiting wirklich erhöht wurde
   - Verwende Global Setup für bessere Performance

## Monitoring

Rate-Limit-Status prüfen:
```bash
# Kong Admin API
curl http://localhost:8001/plugins | jq '.data[] | select(.name=="rate-limiting")'
```




