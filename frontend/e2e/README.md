# E2E Tests für Secrets Management

## 🏗️ Architektur

### Page Object Model Pattern
- **SecretsPage**: Encapsuliert alle Interaktionen mit der Secrets-Seite
- **WorkflowEditorPage**: Encapsuliert Workflow-Editor-Interaktionen
- **Test Utils**: Wiederverwendbare Helper-Funktionen

### Best Practices
1. **Test Isolation**: Jeder Test läuft in einem separaten Browser-Context
2. **Cleanup**: Automatisches Cleanup von Test-Daten nach jedem Test
3. **Page Objects**: Alle Page-Interaktionen sind in Klassen gekapselt
4. **Retry Logic**: Automatische Retries bei flaky Tests
5. **Screenshots/Videos**: Automatische Aufnahme bei Fehlern

## 🚀 Setup

### Installation
```bash
cd frontend
pnpm add -D @playwright/test
pnpm exec playwright install
```

### Konfiguration
- `playwright.config.ts`: Hauptkonfiguration
- `tests/helpers/`: Test Utilities und Page Objects
- `tests/secrets/`: Secrets-spezifische Tests

## 📝 Tests ausführen

### ⚠️ Vor dem Testlauf

**Wichtig:** Stelle sicher, dass folgende Services laufen:

1. **Backend Services** (via Docker Compose oder lokal):
   - Kong Gateway (Port 5000)
   - Auth Service (Port 5244)
   - Secrets Service (Port 5004)
   - MongoDB (Port 27017)
   - Redis (Port 6379)
   - RabbitMQ (Port 5672)

2. **Frontend Dev Server** (optional):
   - Playwright startet den Server automatisch, wenn er nicht läuft
   - Falls bereits gestartet, wird er wiederverwendet (`reuseExistingServer: true`)

3. **Auth State** (optional):
   - Falls du einen frischen Login testen willst, lösche: `frontend/e2e/playwright/.auth/user.json`
   - Ansonsten wird der vorhandene Auth-State wiederverwendet

**Quick Check:**
```bash
# Prüfe ob Backend läuft
curl http://localhost:5000/health  # Kong Gateway
curl http://localhost:5244/health  # Auth Service (falls direkt erreichbar)

# Prüfe ob Frontend läuft
curl http://localhost:5173
```

### Alle Tests
```bash
cd frontend/e2e
pnpm exec playwright test
```

### Spezifische Test-Suite
```bash
pnpm exec playwright test secrets-management
```

### Im UI-Modus (interaktiv)
```bash
pnpm exec playwright test --ui
```

### Debug-Modus
```bash
pnpm exec playwright test --debug
```

## 🧪 Test-Suites

### 1. Secrets Management (`secrets-management.spec.ts`)
- Create secret
- View secrets (tenant isolation)
- Edit secret
- Delete secret
- Search secrets

### 2. Workflow + Secrets Integration (`workflow-secrets-integration.spec.ts`)
- New tenant → add secret → configure node → run workflow
- Missing secret → user guided to create → returns to node → validation clears
- Default secret auto-detection
- Override secret functionality
- Deep-linking to create secret

### 3. Multi-Tenant Isolation (`multi-tenant-isolation.spec.ts`)
- Secrets are filtered by tenant
- Tenant badge is visible
- Cannot access secrets from other tenants

## 🔧 Test Utilities

### `test-utils.ts`
- `loginAsTestUser()`: Login-Helper
- `createTestSecret()`: Secret erstellen
- `deleteTestSecret()`: Secret löschen
- `cleanupTestSecrets()`: Bulk-Cleanup
- `waitForElement()`: Element-Waiting mit Retry
- `expectVisible()` / `expectText()`: Assertion-Helper

### Page Objects
- **SecretsPage**: Alle Secrets-Seite-Interaktionen
- **WorkflowEditorPage**: Workflow-Editor-Interaktionen

## 🎯 CI/CD Integration

Tests können in CI/CD integriert werden:

```yaml
# .github/workflows/e2e.yml
- name: Run E2E Tests
  run: |
    cd frontend
    pnpm exec playwright test
```

## 📊 Test-Report

Nach dem Ausführen:
```bash
pnpm exec playwright show-report
```

## 🐛 Debugging

### Screenshots bei Fehlern
Automatisch in `test-results/` gespeichert

### Videos bei Fehlern
Automatisch in `test-results/` gespeichert

### Trace Viewer
```bash
pnpm exec playwright show-trace test-results/trace.zip
```

## 🧹 Cleanup Test Secrets

Falls Test-Secrets nach den Tests übrig bleiben, kannst du sie manuell aufräumen:

```bash
cd frontend/e2e
pnpm cleanup
```

Das Script löscht automatisch alle Secrets mit folgenden Präfixen:
- `test-`
- `OPENAI_API_KEY_`
- `DEEP_LINK_SECRET_`
- `PIPEDRIVE_API_KEY`

**Hinweis:** Die Tests sollten automatisch aufräumen (`afterEach`), aber falls Tests fehlschlagen oder unterbrochen werden, können Secrets übrig bleiben.

## 📋 Checkliste

- [x] Playwright Setup
- [x] Page Object Model Pattern
- [x] Test Utilities
- [x] Secrets Management Tests
- [x] Workflow Integration Tests
- [x] Multi-Tenant Isolation Tests
- [ ] CI/CD Integration
- [ ] Performance Tests
- [ ] Visual Regression Tests




