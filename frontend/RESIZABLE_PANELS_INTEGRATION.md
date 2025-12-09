# Resizable Panels Integration

## Übersicht

Die Workflow-Builder-Anwendung wurde erfolgreich mit `react-resizable-panels` modernisiert, um eine bessere Benutzerfreundlichkeit und Flexibilität zu bieten.

## Neue Features

### 🎛️ Resizable Panels
- **Debug Console (Links)**: 15-40% Breite, einklappbar
- **Workflow Canvas (Mitte)**: 30-85% Breite, Hauptarbeitsbereich
- **Node Config Panel (Rechts)**: 15-40% Breite, einklappbar

### 💾 Persistente Einstellungen
- Panel-Größen werden in `localStorage` gespeichert
- Automatisches Wiederherstellen der letzten Einstellungen
- Speicherung unter dem Key: `workflow-panel-sizes`

### 🎨 Verbesserte UX
- **Smooth Resizing**: Flüssiges Anpassen der Panel-Größen
- **Collapse/Expand**: Panels können eingeklappt werden
- **Visual Feedback**: Hover-Effekte auf Resize-Handles
- **Responsive Design**: Funktioniert auf verschiedenen Bildschirmgrößen

## Technische Implementierung

### Neue Komponente: `ResizableWorkflowLayout.tsx`
```tsx
<PanelGroup direction="horizontal" onLayout={handlePanelSizesChange}>
  <Panel defaultSize={20} minSize={15} maxSize={40} collapsible>
    <DebugPanel />
  </Panel>
  <PanelResizeHandle />
  <Panel defaultSize={60} minSize={30} maxSize={85}>
    <WorkflowCanvas />
  </Panel>
  <PanelResizeHandle />
  <Panel defaultSize={20} minSize={15} maxSize={40} collapsible>
    <NodeConfigPanel />
  </Panel>
</PanelGroup>
```

### Angepasste WorkflowCanvas
- Entfernung der festen CSS-Positionierung
- Delegation des Layouts an `ResizableWorkflowLayout`
- Beibehaltung aller bestehenden Funktionalitäten

## Vorteile

### ✅ Für Entwickler
- **Modulare Architektur**: Layout-Logik getrennt von Canvas-Logik
- **Wiederverwendbar**: ResizableWorkflowLayout kann in anderen Komponenten verwendet werden
- **TypeScript Support**: Vollständige Typisierung aller Props

### ✅ Für Benutzer
- **Flexible Arbeitsumgebung**: Anpassung an individuelle Workflows
- **Mehr Platz für Canvas**: Debug-Panel kann verkleinert werden
- **Bessere Übersicht**: Panels können bei Bedarf eingeklappt werden
- **Persistente Einstellungen**: Layout bleibt zwischen Sessions erhalten

## Verwendung

Die Integration ist vollständig transparent - alle bestehenden Funktionen funktionieren weiterhin:

```tsx
<WorkflowCanvas
  initialNodes={nodes}
  initialEdges={edges}
  onSave={handleSave}
  workflowId={workflowId}
/>
```

## Keyboard Shortcuts (Optional)

Für zukünftige Erweiterungen können Keyboard Shortcuts hinzugefügt werden:
- `Ctrl+1`: Debug Panel fokussieren
- `Ctrl+2`: Canvas fokussieren  
- `Ctrl+3`: Config Panel fokussieren
- `Ctrl+Shift+1/2/3`: Panel ein-/ausklappen

## Migration

Die Migration war vollständig rückwärtskompatibel:
- ✅ Alle bestehenden Props funktionieren weiterhin
- ✅ Keine Breaking Changes
- ✅ Bestehende Workflows bleiben unverändert
- ✅ Alle Features (Auto-Save, Execution, etc.) funktionieren weiterhin

## Nächste Schritte

1. **Mobile Optimierung**: Touch-Gesten für Panel-Resizing
2. **Keyboard Shortcuts**: Schnellzugriff auf Panels
3. **Panel Themes**: Verschiedene Farbschemata
4. **Panel Presets**: Vordefinierte Layout-Konfigurationen
