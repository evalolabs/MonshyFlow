# Layout System - Erweiterbares Auto-Layout

## Übersicht

Das Layout-System ist eine erweiterbare Architektur für automatische Node-Positionierung in Workflows. Es unterstützt mehrere Layout-Strategien, die einfach hinzugefügt und ausgewählt werden können.

## Aktuelle Layouts

### Layout V1: Horizontal Flow (Standard)
- **ID**: `v1`
- **Name**: Horizontal Flow
- **Beschreibung**: Sequenzielles Workflow-Layout von links nach rechts mit intelligenter Branch-Verteilung
- **Features**:
  - Horizontale Haupt-Flow (LR-Richtung)
  - Intelligente Branch-Verteilung
  - Spezielle Behandlung für While-Loops (Loop-Body-Nodes links positioniert)
  - Agent Node Bottom-Inputs aus Haupt-Flow ausgeschlossen
  - Optimiertes Spacing für parallele Branches

## Neue Layouts hinzufügen

### Schritt 1: Layout-Datei erstellen

Erstelle eine neue Datei `LayoutV2.ts` (oder `LayoutV3.ts`, etc.) in `frontend/src/utils/layouts/`:

```typescript
import type { Node, Edge } from '@xyflow/react';
import type { LayoutStrategy, LayoutStrategyOptions, LayoutResult } from './types';

export const LayoutV2: LayoutStrategy = {
  id: 'v2',
  name: 'Vertical Flow',
  description: 'Top-to-bottom layout for vertical workflows',
  
  apply(nodes: Node[], edges: Edge[], options: LayoutStrategyOptions = {}): LayoutResult {
    // Deine Layout-Logik hier
    // ...
    
    return {
      nodes: layoutedNodes,
      edges,
    };
  },
};
```

### Schritt 2: Layout registrieren

Öffne `LayoutRegistry.ts` und füge dein Layout hinzu:

```typescript
import { LayoutV2 } from './LayoutV2';

// In der Datei:
layoutRegistry.set('v2', LayoutV2);
```

### Schritt 3: Layout verwenden

#### In `useAutoLayout` Hook:

```typescript
const { applyLayout } = useAutoLayout({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  layoutVersion: 'v2', // Dein neues Layout
});
```

#### Direkt verwenden:

```typescript
import { applyLayout } from './utils/layouts';

const result = applyLayout(nodes, edges, 'v2');
```

## Layout-Interface

Jedes Layout muss das `LayoutStrategy` Interface implementieren:

```typescript
interface LayoutStrategy {
  id: string;                    // Eindeutige ID (z.B. 'v2')
  name: string;                  // Anzeigename (z.B. 'Vertical Flow')
  description: string;           // Beschreibung
  apply(
    nodes: Node[],
    edges: Edge[],
    options?: LayoutStrategyOptions
  ): LayoutResult;
}
```

## Layout-Optionen

Layouts können optionale Konfigurationen erhalten:

```typescript
interface LayoutStrategyOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  spacing?: {
    horizontal?: number;
    vertical?: number;
  };
  [key: string]: any; // Zusätzliche Optionen für spezielle Layouts
}
```

## Verfügbare Layouts abrufen

```typescript
import { getAvailableLayouts } from './utils/layouts';

const layouts = getAvailableLayouts();
// [
//   { id: 'v1', name: 'Horizontal Flow', description: '...' },
//   { id: 'v2', name: 'Vertical Flow', description: '...' },
// ]
```

## Best Practices

1. **Konsistente IDs**: Verwende `v1`, `v2`, `v3` etc. für sequenzielle Versionen
2. **Dokumentation**: Beschreibe dein Layout klar in `name` und `description`
3. **Edge-Filterung**: Berücksichtige spezielle Edges (Loop-Back, Agent-Bottom-Inputs, etc.)
4. **Node-Größen**: Verwende die Standard-Größen (220x100) oder lasse sie konfigurierbar
5. **Fehlerbehandlung**: Behandle Edge-Cases (leere Nodes, zirkuläre Abhängigkeiten, etc.)

## Beispiel: Fan-Out Layout (für zukünftige Implementierung)

Ein Layout, das einen zentralen Node mit mehreren Outputs nach unten verteilt:

```typescript
export const LayoutV2: LayoutStrategy = {
  id: 'v2',
  name: 'Fan-Out Layout',
  description: 'Central node with multiple outputs distributed below',
  
  apply(nodes: Node[], edges: Edge[], options: LayoutStrategyOptions = {}): LayoutResult {
    const nodeWidth = options.nodeWidth ?? 220;
    const nodeHeight = options.nodeHeight ?? 100;
    const spacing = options.spacing?.vertical ?? 120;
    
    // Finde zentrale Nodes (z.B. Agent Nodes mit vielen Tools)
    // Positioniere sie oben
    // Verteile Output-Nodes darunter
    
    // ... Implementierung ...
    
    return { nodes: layoutedNodes, edges };
  },
};
```

## Migration von altem Code

Das alte `applyHorizontalLayout` ist noch verfügbar, aber als `@deprecated` markiert. Es verwendet intern `LayoutV1`. Für neue Code sollte `applyLayout` aus `./layouts` verwendet werden.

