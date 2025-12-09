# 🛠️ Anleitung: Neue Nodes und Tools hinzufügen

> ⚡ **WICHTIG:** Mit der neuen Registry-Architektur können neue Nodes/Tools in **5 Minuten** hinzugefügt werden!  
> → **[REGISTRY_QUICK_START.md](./REGISTRY_QUICK_START.md)** für die schnellste Methode ⭐

Diese Anleitung enthält **detaillierte Informationen** für Entwickler, die mehr Hintergrundwissen benötigen.

---

## 📋 Übersicht: Nodes vs. Tools

### **Nodes** 
- Workflow-Komponenten, die im Canvas sichtbar sind
- Beispiele: Start, End, LLM, Agent, HTTP Request, If/Else, While
- Werden im Frontend als visuelle Komponenten dargestellt
- Haben Input/Output-Handles für Verbindungen
- Werden im Backend durch **Node Processors** verarbeitet

### **Tools**
- Funktionen, die von Agent-Nodes verwendet werden können
- Beispiele: Web Search, File Search, MCP Server Tools, Custom Functions
- Werden im Frontend als "Tool Nodes" dargestellt
- Werden im Backend durch **Tool Creators** erstellt

---

## 🎯 Teil 1: Neue Nodes hinzufügen

> ⚡ **Empfohlen:** Verwende die neue Registry-Architektur! Siehe [REGISTRY_QUICK_START.md](./REGISTRY_QUICK_START.md)

### Schnellweg (Registry-Architektur)

1. **Registry erweitern** (`shared/registry.json`)
2. **Processor erstellen** (C# + TypeScript) - wird automatisch gefunden
3. **Frontend Component** (optional, nur wenn Custom UI nötig)
4. **Validieren**: `cd shared && npm run validate:registry`

**Zeitaufwand:** ~5-10 Minuten

### Detaillierter Weg (Legacy/Manuell)

Falls du die manuelle Methode verwenden musst:

#### Frontend (React/TypeScript)

1. **Node-Komponente erstellen** (`NodeTypes/MyNewNode.tsx`)
2. **In OptimizedNodes.tsx registrieren**
3. **Metadaten hinzufügen** (`nodeMetadata.ts`)
4. **Component registrieren** (`nodeRegistry.ts`)
5. **Config-Form erstellen** (siehe [CONFIG_PANEL_STANDARD.md](./CONFIG_PANEL_STANDARD.md))

**📖 Siehe [CONFIG_PANEL_STANDARD.md](./CONFIG_PANEL_STANDARD.md) für vollständige Anleitung zu Config-Panels.**

### Backend (TypeScript - Execution Service)

**Mit Registry-Architektur:**
- Processor erstellen (`nodes/myNewNodeProcessor.ts`)
- Wird automatisch gefunden (Auto-Discovery)
- In `shared/registry.json` eintragen (optional, wird automatisch erkannt)

**Ohne Registry:**
- Processor in `registerBuiltIns.ts` manuell registrieren

**Wichtig**: C# Node Processors wurden entfernt. Alle Execution läuft über TypeScript.

---

## 🔧 Teil 2: Neue Tools hinzufügen

> ⚡ **Empfohlen:** Verwende die Registry-Architektur! Siehe [REGISTRY_QUICK_START.md](./REGISTRY_QUICK_START.md)

### Schnellweg (Registry-Architektur)

1. **Registry erweitern** (`shared/registry.json`)
2. **Tool Creator erstellen** (TypeScript)
3. **Validieren**

**Zeitaufwand:** ~5 Minuten

### Frontend

Tools werden automatisch im Frontend angezeigt, wenn sie im Backend registriert sind. Falls nötig, füge Tool-Metadaten zu `nodeMetadata.ts` hinzu (oder nutze Code-Generierung aus Registry).

### Backend (TypeScript - Execution Service)

**Tool Creator erstellen** (`tools/registerBuiltIns.ts` oder separate Datei):
- Wird automatisch gefunden (Auto-Discovery)
- In `shared/registry.json` eintragen

---

## 🎨 Spezielle Tool-Typen

### MCP Server Tools

Siehe **[MCP_FUNCTION_GUIDE.md](./MCP_FUNCTION_GUIDE.md)** für Details.

**Wichtig für OpenAI Connectors:**
- Verwende `hostedMcpTool` aus `@openai/agents` für OpenAI-hosted Connectors (Gmail, Google Calendar, etc.)
- Der Tool Creator erkennt OpenAI Connectors automatisch und verwendet `hostedMcpTool` direkt
- `requireApproval` wird automatisch auf `'never'` gesetzt (unabhängig von Node-Konfiguration)

### Function Tools

Einfache Funktionen, die von Agents verwendet werden können. Siehe bestehende Implementierungen in `execution-service/src/functions/`.

### Web Search Tools

Nutzen verschiedene Such-Provider. Siehe bestehende Implementierungen in `execution-service/src/webSearch/`.

---

## ✅ Checkliste

### Für Nodes (Registry-Architektur):
- [ ] TypeScript Processor erstellt (`nodes/myNewNodeProcessor.ts`) - wird auto-gefunden
- [ ] Frontend Component (optional, nur wenn Custom UI nötig)
- [ ] Frontend Auto-Discovery lädt Metadaten automatisch vom Backend (`/api/schemas/nodes`)
- [ ] Validierung bestanden: `cd shared && npm run validate:registry` (optional)

### Für Tools (Registry-Architektur):
- [ ] Registry-Eintrag erstellt (`shared/registry.json`)
- [ ] Tool Creator erstellt (wird auto-gefunden)
- [ ] Validierung bestanden

---

## 📚 Weitere Ressourcen

- **[REGISTRY_QUICK_START.md](./REGISTRY_QUICK_START.md)** ⭐ - 5-Minuten-Anleitung
- **[REGISTRY_ARCHITECTURE.md](./REGISTRY_ARCHITECTURE.md)** - Architektur-Übersicht
- **[CONFIG_PANEL_STANDARD.md](./CONFIG_PANEL_STANDARD.md)** - Config-Panel Standard
- **[MCP_FUNCTION_GUIDE.md](./MCP_FUNCTION_GUIDE.md)** - MCP Integration
- **[PROVIDER_SETUP_GUIDE.md](./PROVIDER_SETUP_GUIDE.md)** - Provider Setup

---

## 🚀 Best Practices

1. **TypeScript Processor erstellen** - Alle Execution läuft über TypeScript
2. **Auto-Discovery nutzen** - Frontend lädt Node-Metadaten automatisch vom Backend
3. **Konventionen befolgen** - Auto-Discovery funktioniert nur mit richtigen Namenskonventionen:
   - TypeScript: Datei muss `*NodeProcessor.ts` heißen
   - Processor muss `registerNodeProcessor()` aufrufen
4. **Frontend Component** - Optional, nur wenn Custom UI nötig (sonst DefaultNodeComponent)
5. **Dokumentation lesen** - Guides helfen, Fehler zu vermeiden

---

## 🎯 Zusammenfassung

**Mit Auto-Discovery:**
- ✅ **2 Schritte**: TypeScript Processor erstellen + Frontend Component (optional)
- ✅ **5-10 Minuten** statt 30-60 Minuten
- ✅ **Automatische Frontend-Registrierung** via Auto-Discovery
- ✅ **Keine manuelle Registry-Pflege** nötig (wird automatisch erkannt)

**Frontend Auto-Discovery lädt Node-Metadaten automatisch vom Backend!** 🚀

