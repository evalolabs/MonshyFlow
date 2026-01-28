# CI/CD Workflows

Dieses Verzeichnis enthält die GitHub Actions Workflows für MonshyFlow.

## Workflows

### `ci-packages.yml` ⭐
**Path-based Filtering CI/CD Pipeline** - Nur geänderte Packages werden getestet und gebaut.

**Dies ist die Haupt-CI-Pipeline** und läuft automatisch bei jedem Push/PR auf `main` oder `develop`.

## Wie funktioniert Path-based Filtering?

### 1. Change Detection
Bei jedem Push/PR wird analysiert, welche Dateien geändert wurden:

```
Geänderte Dateien → Package-Zuordnung → Dependency-Analyse
```

### 2. Dependency Graph
Die Pipeline respektiert die Abhängigkeiten zwischen Packages:

```
Level 0: @monshy/core (keine Dependencies)
    ↓
Level 1: @monshy/database, @monshy/auth (brauchen core)
    ↓
Level 2: Services (brauchen shared packages)
    - api-service
    - auth-service
    - scheduler-service
    - secrets-service
    - execution-service
```

### 3. Intelligente Build-Reihenfolge
- **Parallele Ausführung**: Unabhängige Packages werden parallel gebaut
- **Sequenzielle Dependencies**: Abhängige Packages warten auf ihre Dependencies
- **Skip-Logik**: Unveränderte Packages werden übersprungen

## Beispiel-Szenarien

### Szenario 1: Änderung nur im Frontend
```
✅ detect-changes: frontend = true
✅ build-frontend: Läuft
❌ Alle anderen Jobs: Übersprungen
```

### Szenario 2: Änderung in @monshy/core
```
✅ detect-changes: core = true
✅ build-core: Läuft
✅ build-database: Läuft (dependency)
✅ build-auth: Läuft (dependency)
✅ build-api-service: Läuft (dependency)
✅ build-auth-service: Läuft (dependency)
✅ build-scheduler-service: Läuft (dependency)
✅ build-secrets-service: Läuft (dependency)
✅ build-execution-service: Läuft (dependency)
❌ build-frontend: Übersprungen (keine Dependency)
```

### Szenario 3: Änderung in api-service
```
✅ detect-changes: api-service = true
✅ build-core: Läuft (dependency)
✅ build-database: Läuft (dependency)
✅ build-auth: Läuft (dependency)
✅ build-api-service: Läuft
❌ Alle anderen Services: Übersprungen
```

## Vorteile

1. **Schnellere CI-Laufzeiten**: Nur betroffene Packages werden getestet
2. **Ressourceneffizienz**: Weniger CI-Minuten verbraucht
3. **Parallele Ausführung**: Unabhängige Packages laufen gleichzeitig
4. **Klarere Fehlerbehandlung**: Fehler sind einem Package zuordenbar

## Docker Builds

Docker Images werden nur gebaut, wenn:
- Der Branch `main` ist
- Das entsprechende Package geändert wurde

## CI Summary

Am Ende jedes Runs wird eine Zusammenfassung erstellt, die zeigt:
- Welche Packages geändert wurden
- Welche Builds erfolgreich waren
- Welche Builds fehlgeschlagen sind

## Troubleshooting

### "Job wurde übersprungen"
Das ist normal! Jobs werden übersprungen, wenn:
- Das Package nicht geändert wurde
- Die Dependencies nicht geändert wurden
- Die Dependencies fehlgeschlagen sind

### "Dependency build failed"
Wenn ein Shared Package (core, database, auth) fehlschlägt, werden alle abhängigen Services ebenfalls fehlschlagen. Das ist gewollt, um inkonsistente Builds zu vermeiden.

### "Path detection funktioniert nicht"
Stelle sicher, dass:
- `fetch-depth: 0` gesetzt ist (für vollständige Git-Historie)
- Die Pfade in `detect-changes` korrekt sind
- Die Dateien tatsächlich committed wurden

