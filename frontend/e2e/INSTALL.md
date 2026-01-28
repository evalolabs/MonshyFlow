# E2E Tests Installation

## 📦 Installation

### 1. Dependencies installieren
```bash
cd frontend
pnpm install
```

Dies installiert alle Dependencies inklusive `@playwright/test` (bereits in `package.json` enthalten).

### 2. Playwright Browser installieren
```bash
pnpm exec playwright install
```

Playwright installiert automatisch Chromium, Firefox und WebKit.

### 3. Konfiguration prüfen
Die Konfiguration ist bereits in `playwright.config.ts` vorhanden.

## 🚀 Erste Schritte

### Tests ausführen
```bash
# Alle Tests
pnpm test:e2e

# Im UI-Modus (empfohlen für Entwicklung)
pnpm test:e2e:ui

# Debug-Modus
pnpm test:e2e:debug
```

### Test-Report anzeigen
```bash
pnpm test:e2e:report
```

## ⚙️ Konfiguration

### Umgebungsvariablen
- `E2E_BASE_URL`: Base URL für Tests (Standard: `http://localhost:5173`)
- `CI`: Wird automatisch in CI/CD gesetzt

### Anpassungen
Bearbeite `playwright.config.ts` für:
- Andere Browser
- Timeouts
- Retry-Logik
- Reporter

## 📝 Nächste Schritte

1. Tests ausführen: `pnpm test:e2e`
2. Eigene Tests schreiben in `tests/secrets/`
3. Page Objects erweitern in `tests/helpers/page-objects/`




