# Frontend Architektur - Nodes & Tools

## 📋 Übersicht

Das Frontend wurde so entwickelt, dass Entwickler **einfach neue Nodes und Tools hinzufügen können**. Es gibt zwei Hauptsysteme:

1. **Node Registry System** - für Workflow-Nodes (Start, LLM, API, etc.)
2. **Tool Catalog System** - für Tools die an Agent-Nodes angehängt werden (MCPs, Functions, Web Search)

---

## 🎯 1. Node Registry System

### Architektur

Das Node Registry System macht es **super einfach**, neue Workflow-Nodes hinzuzufügen. Entwickler müssen nur **3 Schritte** befolgen:

#### Schritt 1: Node-Komponente erstellen
```tsx
// frontend/src/components/WorkflowBuilder/NodeTypes/MyNewNode.tsx
import { BaseNode } from './BaseNode';

export function MyNewNode({ data }: any) {
  return (
    <BaseNode
      label={data.label || 'My New Node'}
      icon="🎯"
      category="utility"
    />
  );
}
```

#### Schritt 2: In OptimizedNodes.tsx hinzufügen
```tsx
// frontend/src/components/WorkflowBuilder/NodeTypes/OptimizedNodes.tsx
import { MyNewNode as MyNewNodeBase } from './MyNewNode';
export const MyNewNode = React.memo(MyNewNodeBase, areNodePropsEqual);
```

#### Schritt 3: Metadaten registrieren
```tsx
// frontend/src/components/WorkflowBuilder/nodeRegistry/nodeMetadata.ts
'my-new-node': {
  id: 'my-new-node',
  name: 'My New Node',
  icon: '🎯',
  description: 'Does something awesome',
  category: 'utility', // 'core' | 'ai' | 'logic' | 'data' | 'integration' | 'utility' | 'tools'
  component: () => null, // Wird in nodeRegistry.ts gesetzt
  hasConfigForm: true,
  expressionFields: ['field1'], // Optional: Felder mit Expression Editor
},
```

#### Schritt 4: Component registrieren
```tsx
// frontend/src/components/WorkflowBuilder/nodeRegistry/nodeRegistry.ts
import { MyNewNode } from '../NodeTypes/OptimizedNodes';

const NODE_COMPONENTS: Record<string, ComponentType<any>> = {
  // ... andere Nodes
  'my-new-node': MyNewNode,
};
```

### ✅ Automatische Features

Nach der Registrierung erscheint der Node automatisch:
- ✅ Im Node-Selector (Toolbar)
- ✅ Im WorkflowCanvas (kann verwendet werden)
- ✅ In den Node-Kategorien
- ✅ Mit Execution-Status (während Workflow-Ausführung)
- ✅ In der Node-Konfiguration (falls `hasConfigForm: true`)

### 📁 Wichtige Dateien

- **`nodeRegistry/nodeMetadata.ts`** - Zentrale Metadaten-Konfiguration
- **`nodeRegistry/nodeRegistry.ts`** - Component-Mapping
- **`NodeTypes/OptimizedNodes.tsx`** - Alle Node-Komponenten (memoized)
- **`NodeTypes/BaseNode.tsx`** - Basis-Komponente für konsistentes Design

### 📚 Dokumentation

- **`NODE_REGISTRY_GUIDE.md`** - Detaillierte Anleitung mit Beispielen
- **`NODE_ADDITION_SUMMARY.md`** - Vergleich Vorher/Nachher

---

## 🛠️ 2. Tool Catalog System

### Architektur

Tools sind **separate Nodes**, die an Agent-Nodes angehängt werden können. Sie werden in zwei Teilen implementiert:

1. **Backend** - Handler im `execution-service`
2. **Frontend** - Tool-Definitionen im `toolCatalog.ts`

### Tools-Typen

Es gibt drei Hauptkategorien von Tools:

#### A. Functions (Custom Functions)

**Backend:**
```ts
// execution-service/src/functions/tools/myFunction.ts
export const myFunctionHandler: FunctionHandler = {
  name: 'my_function',
  description: 'Beschreibt, was die Funktion macht',
  parameters: { /* JSON Schema */ },
  async execute(args, context) {
    return { /* Ergebnis */ };
  },
};
```

**Registrierung:**
```ts
// execution-service/src/functions/registerBuiltIns.ts
import { myFunctionHandler } from './tools/myFunction';
registerFunction(myFunctionHandler);
```

**Frontend:**
- Tools erscheinen automatisch im `ToolCatalog` unter "Function"
- Werden über `useNodeCatalogs` Hook geladen
- Nutzer können sie im Agent-Node auswählen

#### B. MCP Servers (Model Context Protocol)

**Backend:**
```ts
// execution-service/src/mcp/handlers/slackMcpHandler.ts
export const slackMcpHandler: McpHandler = {
  id: 'slack',
  name: 'Slack Workspace',
  description: 'Nachrichten senden, Channels durchsuchen',
  metadata: {
    requiredSecrets: ['slack_bot_token'],
  },
  async connect(config, context) {
    return new SlackConnection(token);
  },
};
```

**Registrierung:**
```ts
// execution-service/src/mcp/registerBuiltIns.ts
import { slackMcpHandler } from './handlers/slackMcpHandler';
registerMcpHandler(slackMcpHandler);
```

**Frontend:**
- Tools erscheinen automatisch im `ToolCatalog` unter "MCP server"
- Werden über `useNodeCatalogs` Hook geladen
- Nutzer können sie im Agent-Node auswählen

#### C. Web Search Providers

**Backend:**
```ts
// execution-service/src/webSearch/handlers/tavilyWebSearchHandler.ts
export const tavilyWebSearchHandler: WebSearchHandler = {
  id: 'tavily',
  name: 'Tavily Search',
  description: 'AI-optimierter Web-Suchdienst',
  metadata: { requiredSecrets: ['tavily_api_key'] },
  async connect(config, context) {
    return new TavilyConnection(apiKey);
  },
};
```

**Registrierung:**
```ts
// execution-service/src/webSearch/registerBuiltIns.ts
import { tavilyWebSearchHandler } from './handlers/tavilyWebSearchHandler';
registerWebSearchHandler(tavilyWebSearchHandler);
```

**Frontend:**
- Tools erscheinen automatisch im `ToolCatalog` unter "Web search"
- Werden über `useNodeCatalogs` Hook geladen
- Nutzer können sie im Agent-Node auswählen

### Frontend Tool Catalog

**Statische Tools** (in `toolCatalog.ts`):
```ts
export const toolCatalog: ToolDefinition[] = [
  {
    id: 'tool-mcp-server',
    name: 'MCP server',
    icon: '🛰️',
    color: 'indigo',
    description: 'Connect to a remote MCP server',
    category: 'hosted',
  },
  {
    id: 'tool-function',
    name: 'Function',
    icon: '🛠️',
    color: 'teal',
    description: 'Expose your own function',
    category: 'local',
  },
  // ... weitere Tools
];
```

**Dynamische Tools** (vom Backend geladen):
- Functions werden über `functionService.getAvailableFunctions()` geladen
- MCPs werden über `mcpService.getAvailableHandlers()` geladen
- Web Search wird über `webSearchService.getAvailableHandlers()` geladen

### Tool Node Rendering

Alle Tool-Nodes verwenden die **`ToolNodeComponent`**:
```tsx
// frontend/src/components/WorkflowBuilder/ToolNodes/ToolNodeComponent.tsx
// Rendert alle Tool-Typen (tool-mcp-server, tool-function, tool-web-search, etc.)
```

### 📁 Wichtige Dateien

**Frontend:**
- **`types/toolCatalog.ts`** - Statische Tool-Definitionen
- **`components/WorkflowBuilder/ToolCatalog.tsx`** - UI-Komponente für Tool-Auswahl
- **`components/WorkflowBuilder/ToolNodes/ToolNodeComponent.tsx`** - Rendering-Komponente
- **`hooks/useNodeCatalogs.ts`** - Hook zum Laden von Functions/MCPs/WebSearch

**Backend:**
- **`execution-service/src/functions/`** - Function-Handler
- **`execution-service/src/mcp/`** - MCP-Handler
- **`execution-service/src/webSearch/`** - Web-Search-Handler

### 📚 Dokumentation

- **`DeveloperRoom/MCP_FUNCTION_GUIDE.md`** - Detaillierte Anleitung für Backend-Handler

---

## 🔄 Vergleich: Nodes vs. Tools

### Nodes (Workflow-Nodes)
- **Zweck:** Workflow-Logik (Start, LLM, API, If/Else, etc.)
- **Hinzufügen:** 3-4 Schritte (Komponente + Metadaten + Registrierung)
- **Rendering:** Individuelle Node-Komponenten oder `BaseNode`
- **Kategorien:** core, ai, logic, data, integration, utility, tools

### Tools (Agent-Tools)
- **Zweck:** Erweiterte Fähigkeiten für Agent-Nodes (MCPs, Functions, Web Search)
- **Hinzufügen:** 1 Schritt (Backend-Handler registrieren)
- **Rendering:** Einheitliche `ToolNodeComponent` für alle Tools
- **Kategorien:** chatkit, hosted, local

---

## 🎨 Best Practices

### Für Nodes:
1. **Nutze BaseNode** für konsistentes Design
2. **Wähle passende Kategorie** (core, ai, logic, data, integration, utility, tools)
3. **Dokumentiere Expression-Felder** (welche Felder unterstützen `{{variables}}`)
4. **Teste Config-Form** (falls `hasConfigForm: true`)

### Für Tools:
1. **Backend-Handler zuerst** - Handler im `execution-service` erstellen
2. **Secrets dokumentieren** - `requiredSecrets` in Metadata angeben
3. **Dokumentation verlinken** - `docsUrl` in Metadata setzen
4. **Fehlerbehandlung** - Klare Fehlermeldungen zurückgeben

---

## 🚀 Nächste Schritte / Verbesserungen

### Mögliche Erweiterungen:

1. **Automatische Tool-Discovery**
   - Tools könnten automatisch im Frontend erscheinen, ohne `toolCatalog.ts` zu bearbeiten
   - Backend könnte Tool-Metadaten (Icon, Color, etc.) liefern

2. **Node Config Forms vereinfachen**
   - Automatische Config-Form-Generierung aus Metadaten
   - Registry-basierte Config-Form-Discovery

3. **Plugin-System**
   - Externe Plugins für Nodes/Tools
   - Dynamisches Laden von Node/Tool-Komponenten

4. **Bessere Tool-Kategorisierung**
   - Dynamische Kategorien vom Backend
   - Tool-Tags für bessere Suche

---

## 📊 Aktueller Status

### ✅ Gut implementiert:
- ✅ Node Registry System (3 Schritte zum Hinzufügen)
- ✅ Tool Catalog System (1 Schritt im Backend)
- ✅ Automatische Discovery für Nodes
- ✅ Dynamisches Laden von Functions/MCPs/WebSearch
- ✅ Zentrale Metadaten-Konfiguration

### 🔄 Könnte verbessert werden:
- ⏳ Tool-Metadaten (Icon, Color) könnten vom Backend kommen
- ⏳ Config-Forms könnten automatisch generiert werden
- ⏳ Plugin-System für externe Erweiterungen

---

## 📚 Weitere Dokumentation

- **`NODE_REGISTRY_GUIDE.md`** - Detaillierte Node-Anleitung
- **`NODE_ADDITION_SUMMARY.md`** - Vergleich Vorher/Nachher
- **`DeveloperRoom/MCP_FUNCTION_GUIDE.md`** - Backend-Handler-Anleitung
- **`NodeTypes/DESIGN_GUIDE.md`** - Node-Design-Richtlinien

