# Tenant Badge Debugging

## Problem
Der Test `should display tenant badge in secrets page` schlägt fehl, weil der Tenant-Badge nicht gefunden wird.

## Mögliche Ursachen

1. **User hat kein `tenantName`**: Der User-Objekt vom Backend enthält möglicherweise kein `tenantName`
2. **Timing-Problem**: Der Badge wird erst nach dem Laden des Users gerendert
3. **Selektor-Problem**: Der Selektor findet den Badge nicht, obwohl er vorhanden ist

## Lösung

### 1. Prüfe Backend-Response
Der Login-Endpoint sollte `tenantName` im User-Objekt zurückgeben:

```typescript
{
  token: "...",
  user: {
    id: "...",
    email: "admin@acme.com",
    roles: ["admin", "user"],
    tenantId: "...",
    tenantName: "Acme Corporation"  // ← Muss vorhanden sein!
  }
}
```

### 2. Prüfe Frontend-Rendering
Der Badge wird nur gerendert, wenn `user?.tenantName` vorhanden ist:

```tsx
{user?.tenantName && (
  <div className="mb-4 flex items-center gap-2">
    <span className="px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
      🏢 Tenant: {user.tenantName}
    </span>
    ...
  </div>
)}
```

### 3. Test-Anpassung
Der Test wartet jetzt auf:
- `domcontentloaded` State
- 1 Sekunde für React-Rendering
- Badge mit verbessertem Selektor

## Debugging-Schritte

1. **Prüfe Backend-Login-Response**:
   ```bash
   # Teste Login-API direkt
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@acme.com","password":"admin123"}'
   ```

2. **Prüfe Frontend-LocalStorage**:
   ```javascript
   // Im Browser-Console
   JSON.parse(localStorage.getItem('auth_user'))
   ```

3. **Prüfe React-DevTools**:
   - Öffne React DevTools
   - Prüfe `AuthContext` → `user` → `tenantName`

## Nächste Schritte

Wenn der Badge immer noch nicht gefunden wird:
1. Prüfe, ob das Backend `tenantName` zurückgibt
2. Prüfe, ob der User korrekt im `AuthContext` gespeichert wird
3. Füge einen expliziten Wait für den User-State hinzu




