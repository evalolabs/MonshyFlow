# 📚 Developer Room - Dokumentation

Willkommen im Developer Room! Hier findest du alle wichtigen Guides und Dokumentationen für die Entwicklung am Monshy-Projekt.

---

## 🚀 Schnellstart

### Neuen Node/Tool hinzufügen?
→ **[REGISTRY_QUICK_START.md](./REGISTRY_QUICK_START.md)** ⭐ (5 Minuten)

### Config-Panel erstellen?
→ **[CONFIG_PANEL_STANDARD.md](./CONFIG_PANEL_STANDARD.md)**

### Bestehende Nodes migrieren?
→ **[REGISTRY_MIGRATION_GUIDE.md](./REGISTRY_MIGRATION_GUIDE.md)**

---

## 📖 Dokumentation nach Kategorie

### 🎯 Registry System (Single Source of Truth)

**Für neue Nodes/Tools:**
- **[REGISTRY_QUICK_START.md](./REGISTRY_QUICK_START.md)** ⭐ - 5-Minuten-Anleitung
- **[REGISTRY_ARCHITECTURE.md](./REGISTRY_ARCHITECTURE.md)** - Vollständige Architektur-Übersicht
- **[REGISTRY_MIGRATION_GUIDE.md](./REGISTRY_MIGRATION_GUIDE.md)** - Migration bestehender Nodes

**Ziel:** Neue Nodes/Tools in Minuten hinzufügen, ohne an vielen Stellen Code anzupassen.

### 🎨 Frontend Development

- **[CONFIG_PANEL_STANDARD.md](./CONFIG_PANEL_STANDARD.md)** - Standard für Config-Panels
- **[HOW_TO_ADD_NODES_AND_TOOLS.md](./HOW_TO_ADD_NODES_AND_TOOLS.md)** - Detaillierte Anleitung (Frontend + Backend)

**Ziel:** Konsistente UI-Komponenten und Config-Forms erstellen.

### 🔧 Backend Development

- **[EXECUTION_ARCHITECTURE.md](./EXECUTION_ARCHITECTURE.md)** - Execution-Architektur (Debug, Webhook, Schedule)
- **[STARTNODE_DATA_FLOW.md](./STARTNODE_DATA_FLOW.md)** - StartNode Datenfluss

**Ziel:** Backend-Architektur verstehen und erweitern.

### 🔌 Integration & Tools

- **[MCP_FUNCTION_GUIDE.md](./MCP_FUNCTION_GUIDE.md)** - MCP (Model Context Protocol) Integration
- **[PROVIDER_SETUP_GUIDE.md](./PROVIDER_SETUP_GUIDE.md)** - Provider Setup (OpenAI, etc.)

**Ziel:** Externe Services und Tools integrieren.

### 📊 Historische Dokumentation

- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Zusammenfassung der Registry-Implementierung

**Ziel:** Verstehen, was implementiert wurde und warum.

---

## 🎯 Häufige Aufgaben

### Neuen Node hinzufügen

1. **TypeScript Processor erstellen** (`nodes/myNewNodeProcessor.ts`) - wird automatisch gefunden
2. **Frontend Component** (optional, nur wenn Custom UI nötig)
3. **Frontend Auto-Discovery** lädt Metadaten automatisch vom Backend (`/api/schemas/nodes`)

**Zeitaufwand:** ~5-10 Minuten

### Neues Tool hinzufügen

1. **[REGISTRY_QUICK_START.md](./REGISTRY_QUICK_START.md)** lesen
2. `shared/registry.json` erweitern
3. Tool Creator erstellen (TypeScript)
4. Validieren

**Zeitaufwand:** ~5 Minuten

### Config-Panel erstellen

**Option 1: Automatisch (Empfohlen)**
1. **[CONFIG_PANEL_STANDARD.md](./CONFIG_PANEL_STANDARD.md)** lesen
2. `useAutoConfigForm: true` in Registry setzen
3. `fields` definieren

**Option 2: Custom Form**
1. Custom Component erstellen
2. In `configFormRegistry.tsx` registrieren

**Zeitaufwand:** ~2-10 Minuten (je nach Komplexität)

---

## ✅ Best Practices

1. **Immer Registry zuerst** - Neue Nodes/Tools immer zuerst in `shared/registry.json` definieren
2. **Validierung nutzen** - Vor jedem Commit: `cd shared && npm run validate:registry`
3. **Auto-Config Forms nutzen** - Für 80% der Nodes reicht `useAutoConfigForm: true`
4. **Konventionen befolgen** - Auto-Discovery funktioniert nur mit richtigen Namenskonventionen
5. **Dokumentation lesen** - Guides helfen, Fehler zu vermeiden

---

## 🐛 Troubleshooting

### Node erscheint nicht im Frontend?
- ✅ Prüfe TypeScript Processor existiert (`nodes/*NodeProcessor.ts`)
- ✅ Prüfe Frontend Auto-Discovery läuft (siehe Browser Console)
- ✅ Prüfe Backend Endpoint: `/api/schemas/nodes` gibt Node zurück
- ✅ Prüfe `nodeMetadata.ts` (wird automatisch von Auto-Discovery geladen)

### Processor nicht registriert?
- ✅ Prüfe Namenskonvention:
  - TypeScript: Datei muss `*NodeProcessor.ts` heißen
  - Processor muss `registerNodeProcessor()` aufrufen
- ✅ Prüfe Auto-Discovery Logs beim Start
- ✅ Prüfe Frontend Auto-Discovery: `/api/schemas/nodes` Endpoint

### Config-Form funktioniert nicht?
- ✅ Prüfe `hasConfigForm: true` in Registry
- ✅ Prüfe `useAutoConfigForm: true` oder Custom Form registriert
- ✅ Prüfe `fields` Definition in Registry

### Validierung schlägt fehl?
- ✅ Prüfe `shared/registry.json` ist valide JSON
- ✅ Prüfe alle Pflichtfelder vorhanden (`type`, `name`, `icon`, `description`, `category`)
- ✅ Führe `npm run check:consistency` aus

---

## 📚 Weitere Ressourcen

- **shared/README.md** - Shared Registry System Dokumentation
- **shared/registry.json** - Single Source of Truth für alle Nodes/Tools
- **shared/scripts/** - Code-Generierung und Validierung

---

**🎉 Viel Erfolg bei der Entwicklung!**
