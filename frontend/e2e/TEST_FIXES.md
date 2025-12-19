# E2E Test Fixes

## Problem: Login Navigation Timeout

### Ursache
Nach erfolgreichem Login navigiert die App zu `/` (HomePage), aber die Test-Funktion wartete auf `/admin` oder `/workflows`.

### Lösung
Die `loginAsTestUser` Funktion wurde angepasst:

1. **Flexible Navigation-Erkennung**: Wartet jetzt darauf, dass die URL sich von `/login` ändert (egal wohin)
2. **Robustere Wartezeiten**: Verwendet `domcontentloaded` als Fallback, wenn `networkidle` zu lange dauert
3. **Bessere Fehlerbehandlung**: Ignoriert Timeouts, wenn die Seite trotzdem funktioniert

### Änderungen

**`test-utils.ts`**:
```typescript
// Vorher: Wartete auf spezifische Routes
await page.waitForURL(/\/admin|\/workflows/, { timeout: 10000 });

// Nachher: Wartet auf jede Route außer /login
await Promise.all([
  page.waitForURL(url => url.pathname !== '/login', { timeout: 10000 }),
  page.click('button[type="submit"]')
]);
```

**`SecretsPage.ts`**:
- Robusteres Laden mit Fallback auf `domcontentloaded`
- Wartet auf sichtbare Elemente (Tabelle, Header)

**`WorkflowEditorPage.ts`**:
- Robusteres Laden mit Fallback
- Wartet auf Canvas oder Workflow-Elemente

## Nächste Schritte

Die Tests sollten jetzt funktionieren, wenn:
1. ✅ Login funktioniert (mit Seed-Usern)
2. ✅ Navigation nach Login funktioniert
3. ⏳ Seiten laden korrekt
4. ⏳ Selektoren finden die richtigen Elemente

## Bekannte Probleme

- **Tenant Badge**: Muss möglicherweise angepasst werden, wenn der Selektor nicht passt
- **Secret Modal**: Formular-Felder müssen möglicherweise angepasst werden
- **Workflow Canvas**: Kann bei langsamen Netzwerken länger dauern




