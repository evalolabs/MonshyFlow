# Test-Dependencies Installation

## Problem

Das Projekt verwendet **pnpm** (nicht npm). Die Installation muss mit pnpm erfolgen.

## Lösung

### Mit pnpm (empfohlen):

```bash
cd frontend
pnpm install
```

pnpm sollte automatisch mit `--legacy-peer-deps` umgehen können.

### Falls pnpm nicht installiert ist:

```bash
# pnpm installieren
npm install -g pnpm

# Dann im frontend Ordner:
cd frontend
pnpm install
```

## Alternative: Ohne React Testing Library

Falls die Installation weiterhin Probleme macht, können wir Tests auch ohne `@testing-library/react` schreiben (nur für Utility-Funktionen):

```bash
# Nur Vitest und jsdom installieren
pnpm add -D vitest jsdom
```

Die Tests in `nodeGroupingUtils.test.ts` funktionieren bereits ohne React Testing Library, da sie nur Utility-Funktionen testen.

## Test ausführen

Nach der Installation:

```bash
pnpm test          # Einmalig
pnpm test:watch    # Watch-Mode
pnpm test:ui       # Mit UI
```

## Hinweis

Das Projekt verwendet **pnpm workspaces**. Alle Befehle sollten im Root-Verzeichnis ausgeführt werden:

```bash
# Im Root-Verzeichnis
pnpm install
pnpm --filter frontend test
```
