# Registry System - Development Rules

**Kritische Regeln für das Single Source of Truth System**

> 📚 **Für eine vollständige Anleitung siehe:** [Node Development Guide](../../docs/NODE_DEVELOPMENT_GUIDE.md)

---

## 🎯 Überblick

Das Registry-System ist die **Single Source of Truth** für alle Nodes und Tools. Eine Definition in `shared/registry.json` macht Nodes/Tools automatisch überall verfügbar (Frontend, Backend, Code-Generierung).

**Kernprinzipien:**
1. **Single Source of Truth** - `shared/registry.json` definiert alles
2. **Automatische Discovery** - Processors werden automatisch gefunden
3. **Code-Generierung** - Frontend/Backend Code wird automatisch generiert
4. **Metadata-Driven** - UI wird aus Metadaten generiert
5. **Validierung** - Registry wird vor jedem Build validiert

**Wichtig für neue Entwickler:**
- ⭐ **Lies zuerst:** [Node Development Guide](../../docs/NODE_DEVELOPMENT_GUIDE.md) für vollständige Schritt-für-Schritt-Anleitung
- Diese Datei (`.cursor/rules/registry-system.md`) enthält die **kritischen Regeln** und wird von Cursor AI verwendet
- Die vollständige Dokumentation mit Beispielen ist in `docs/NODE_DEVELOPMENT_GUIDE.md`

**Wann welche Dokumentation verwenden:**
- **Neuer Entwickler?** → Starte mit [Node Development Guide](../../docs/NODE_DEVELOPMENT_GUIDE.md)
- **Schnelle Referenz?** → Diese Datei (kritische Regeln)
- **Cursor AI Kontext?** → Diese Datei wird automatisch von Cursor verwendet

---

## ⚠️ KRITISCHE REGELN - NIE VERLETZEN

> **🔴 PRIORITÄT 1 - System-Breaking:** Diese Regeln müssen IMMER eingehalten werden. Verletzung führt zu Inkonsistenzen zwischen Frontend/Backend.

### 1. Registry ist Single Source of Truth

**❌ NIE:**
```typescript
// Node-Metadaten hardcoden
if (node.type === 'my-node') {
  // Hardcoded metadata - FALSCH!
  const name = 'My Node';
  const icon = '🎯';
}

// Node manuell in Frontend registrieren ohne Registry
const nodeTypes = {
  'my-node': MyNode, // FALSCH! (ohne Registry-Eintrag)
};
```

**✅ IMMER:**
```json
// 1. Zuerst in shared/registry.json definieren
{
  "type": "my-node",
  "name": "My Node",
  "icon": "🎯",
  "description": "Does something",
  "category": "utility"
}
```

```typescript
// 2. Dann Code generieren
// npm run generate:registry

// 3. Metadaten aus Registry verwenden
import { getNodeMetadata } from './nodeRegistry/nodeMetadata';
const metadata = getNodeMetadata('my-node');
// metadata.name, metadata.icon, etc. kommen aus Registry
```

**Warum:** Registry ist Single Source of Truth. Änderungen an einer Stelle wirken überall.

---

### 2. Registry vor Code-Generierung

**❌ NIE:**
```typescript
// Code generieren ohne Registry-Eintrag
// npm run generate:registry
// → Node fehlt in generierten Dateien!

// Registry-Eintrag erstellen, aber Code-Generierung vergessen
// → Frontend/Backend haben alte Metadaten

// Generierte Dateien manuell ändern
// → Änderungen gehen bei nächster Generierung verloren
```

**✅ IMMER:**
```bash
# 1. Registry erweitern
# shared/registry.json bearbeiten

# 2. Validieren
cd shared
npm run validate:registry

# 3. Code generieren
npm run generate:registry

# 4. Konsistenz prüfen
npm run check:consistency

# 5. Generierte Dateien committen
git add frontend/src/components/WorkflowBuilder/nodeRegistry/generatedMetadata.ts
git commit -m "feat: Add new node via registry"
```

**Warum:** Code-Generierung erstellt Frontend/Backend Code aus Registry. Ohne Generierung sind Metadaten veraltet.

**⚠️ WICHTIG:** Generierte Dateien MÜSSEN committet werden! Sie sind Teil des Build-Prozesses.

---

### 3. Node Processor Auto-Discovery

**❌ NIE:**
```typescript
// Processor manuell registrieren
import { registerNodeProcessor } from './index';
registerNodeProcessor({
  type: 'my-node',
  // ...
});
// FALSCH! (sollte in registerBuiltIns.ts oder separater Datei)

// Processor nicht nach Konvention benennen
// myNode.ts - FALSCH! (sollte myNodeProcessor.ts heißen)
```

**✅ IMMER:**
```typescript
// 1. Processor-Datei nach Konvention benennen
// nodes/myNodeProcessor.ts

// 2. Processor registrieren
import { registerNodeProcessor } from './index';

registerNodeProcessor({
  type: 'my-node', // Muss mit registry.json übereinstimmen
  name: 'My Node',
  processNodeData: async (node, input, context) => {
    // Implementation
  },
});

// 3. Auto-Discovery findet es automatisch!
```

**Warum:** Auto-Discovery findet Processors automatisch. Manuelle Registrierung ist nur in `registerBuiltIns.ts` nötig.

---

### 4. Registry JSON Schema

**❌ NIE:**
```json
// Falsche Struktur
{
  "my-node": { // FALSCH! (sollte in "nodes" Array sein)
    "type": "my-node"
  }
}

// Fehlende Pflichtfelder
{
  "type": "my-node" // FALSCH! (fehlt name, icon, category)
}
```

**✅ IMMER:**
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "version": "2.0.0",
  "nodes": [
    {
      "type": "my-node",
      "name": "My Node",
      "icon": "🎯",
      "description": "Does something awesome",
      "category": "utility",
      "animationSpeed": "fast",
      "typescriptProcessor": "./nodes/registerBuiltIns#my-node",
      "frontend": {
        "hasConfigForm": true,
        "useAutoConfigForm": true,
        "fields": {
          "label": {
            "type": "text",
            "placeholder": "Node Label"
          }
        }
      }
    }
  ]
}
```

**Pflichtfelder:**
- `type` - Node-Typ (kebab-case)
- `name` - Anzeigename
- `icon` - Emoji oder Icon
- `description` - Beschreibung
- `category` - Kategorie (core, ai, logic, data, integration, utility, tools)

**Warum:** Schema stellt sicher, dass alle Nodes vollständig definiert sind.

---

### 5. Node Type Naming Convention

**❌ NIE:**
```json
// Falsche Namenskonventionen
{
  "type": "MyNode", // FALSCH! (PascalCase)
  "type": "my_node", // FALSCH! (snake_case)
  "type": "myNode", // FALSCH! (camelCase)
}
```

**✅ IMMER:**
```json
{
  "type": "my-new-node" // ✅ kebab-case
}
```

**Warum:** kebab-case ist konsistent und URL-freundlich.

---

### 6. Processor Path Format

**❌ NIE:**
```json
// Falsche Processor-Pfade
{
  "typescriptProcessor": "myNodeProcessor" // FALSCH! (fehlt ./)
  "typescriptProcessor": "/nodes/myNodeProcessor" // FALSCH! (absoluter Pfad)
  "typescriptProcessor": "../nodes/myNodeProcessor" // FALSCH! (falsche Richtung)
}
```

**✅ IMMER:**
```json
{
  // Built-in Processor (in registerBuiltIns.ts)
  "typescriptProcessor": "./nodes/registerBuiltIns#my-node"
  
  // Custom Processor (separate Datei)
  "typescriptProcessor": "./nodes/myNodeProcessor"
}
```

**Format:**
- `./path/to/file` - Relativer Pfad
- `#identifier` - Optional, für Built-ins (z.B. `#start`, `#end`)

**Warum:** Registry Loader verwendet diese Pfade zum Importieren.

---

### 7. Frontend Fields - Auto-Config Form

**❌ NIE:**
```json
// Fields ohne useAutoConfigForm
{
  "frontend": {
    "hasConfigForm": true,
    "fields": { ... } // FALSCH! (useAutoConfigForm fehlt)
  }
}

// useAutoConfigForm ohne fields
{
  "frontend": {
    "useAutoConfigForm": true // FALSCH! (fields fehlen)
  }
}
```

**✅ IMMER:**
```json
{
  "frontend": {
    "hasConfigForm": true,
    "useAutoConfigForm": true, // Aktiviert Auto-Config-Form
    "fields": {
      "label": {
        "type": "text",
        "placeholder": "Node Label",
        "required": true
      },
      "prompt": {
        "type": "expression",
        "multiline": true,
        "rows": 6,
        "placeholder": "Enter prompt... Use {{variables}}"
      }
    }
  }
}
```

**Field Types:**
- `text` - Text Input
- `expression` - Expression Editor (mit `{{variables}}`)
- `number` - Number Input
- `select` - Dropdown
- `textarea` - Multi-line Text
- `secret` - Secret Selector

**Warum:** Auto-Config-Form generiert UI automatisch aus Fields. Ohne Fields gibt es keine UI.

---

### 8. Code-Generierung nicht manuell bearbeiten

**❌ NIE:**
```typescript
// Generierte Dateien manuell bearbeiten
// frontend/src/components/WorkflowBuilder/nodeRegistry/generatedMetadata.ts
export const GENERATED_NODE_METADATA = {
  'my-node': {
    // Manuell geändert - FALSCH!
    name: 'My Custom Name',
  },
};
```

**✅ IMMER:**
```typescript
// Generierte Dateien NIE bearbeiten!
// Stattdessen: Registry.json ändern und neu generieren

// 1. shared/registry.json ändern
{
  "type": "my-node",
  "name": "My Custom Name", // Hier ändern
  // ...
}

// 2. Code generieren
npm run generate:registry

// 3. Generierte Dateien werden automatisch aktualisiert
```

**Warum:** Manuelle Änderungen werden bei nächster Code-Generierung überschrieben.

---

### 9. Validierung vor Commit

**❌ NIE:**
```bash
# Registry ändern, aber nicht validieren
# → Fehler werden erst im Build entdeckt
```

**✅ IMMER:**
```bash
# Vor jedem Commit:
cd shared
npm run validate:registry
npm run check:consistency

# Validierung prüft:
# - Alle Pflichtfelder vorhanden
# - Keine doppelten Node-Typen
# - Processor-Pfade existieren
# - Frontend-Felder sind valide
# - Kategorien sind bekannt
```

**Warum:** Validierung verhindert Fehler frühzeitig.

---

### 10. Migration bestehender Nodes

**❌ NIE:**
```typescript
// Node direkt in Frontend/Backend registrieren ohne Registry
// → Node funktioniert, aber nicht in Registry
// → Code-Generierung funktioniert nicht
// → Metadaten sind verstreut
```

**✅ IMMER:**
```bash
# 1. Registry-Eintrag erstellen
# shared/registry.json

# 2. Code generieren
npm run generate:registry

# 3. Alte manuelle Registrierungen entfernen
# (wenn durch Registry ersetzt)

# 4. Validieren
npm run validate:registry
```

**Warum:** Migration zu Registry stellt Single Source of Truth sicher.

---

## 📋 Entwickler-Workflow

### Neuen Node hinzufügen

**Schritt 1: Registry erweitern**
```json
// shared/registry.json
{
  "type": "my-new-node",
  "name": "My New Node",
  "icon": "🎯",
  "description": "Does something awesome",
  "category": "utility",
  "animationSpeed": "fast",
  "typescriptProcessor": "./nodes/registerBuiltIns#my-new-node",
  "frontend": {
    "hasConfigForm": true,
    "useAutoConfigForm": true,
    "fields": {
      "label": {
        "type": "text",
        "placeholder": "Node Label"
      }
    }
  }
}
```

**Schritt 2: Processor erstellen**
```typescript
// packages/execution-service/src/nodes/myNewNodeProcessor.ts
import { registerNodeProcessor } from './index';

registerNodeProcessor({
  type: 'my-new-node', // Muss mit registry.json übereinstimmen
  name: 'My New Node',
  processNodeData: async (node, input, context) => {
    // Implementation
    return createNodeData(result, node.id, node.type);
  },
});
```

**Schritt 3: Code generieren**
```bash
cd shared
npm run generate:registry
```

**Schritt 4: Validieren**
```bash
npm run validate:registry
npm run check:consistency
```

**Schritt 5: Frontend Component (optional)**
```typescript
// Nur wenn Custom UI nötig
// frontend/src/components/WorkflowBuilder/NodeTypes/MyNewNode.tsx
import type { NodeProps } from '@xyflow/react';
import { BaseNode } from '../BaseNode';

export function MyNewNode(props: NodeProps) {
  const { data, id, type, selected } = props;
  const safeData = data || {};
  const label = (safeData.label as string) || 'My New Node';

  return (
    <BaseNode
      label={label}
      icon="🎯"
      category="utility"
      hasInput={true}
      hasOutput={true}
      node={{
        id: id || '',
        type: type || 'my-new-node',
        data: safeData,
        position: { x: 0, y: 0 },
      }}
      selected={selected}
      isAnimating={(safeData as any).isAnimating}
      executionStatus={(safeData as any).executionStatus}
    />
  );
}

// In nodeRegistry.ts registrieren
import { MyNewNode } from '../NodeTypes/MyNewNode';
const NODE_COMPONENTS: Record<string, ComponentType<any>> = {
  // ... existing components
  'my-new-node': MyNewNode,
};
```

**Schritt 6: Custom Config Form (optional)**

Nur wenn komplexe UI nötig ist (siehe [Node Development Guide](../../docs/NODE_DEVELOPMENT_GUIDE.md) für Details).

**✅ Fertig!** Node ist jetzt überall verfügbar.

> 💡 **Tipp:** Für vollständige Beispiele siehe [Node Development Guide](../../docs/NODE_DEVELOPMENT_GUIDE.md) - Abschnitt "Adding a New Node"

---

## 🔧 Code-Generierung

### Generierte Dateien

1. **Frontend:**
   - `frontend/src/components/WorkflowBuilder/nodeRegistry/generatedMetadata.ts`
   - Enthält Node-Metadaten für Frontend

2. **TypeScript Backend:**
   - `packages/execution-service/src/nodes/generatedRegisterBuiltIns.ts`
   - Enthält Processor-Registrierungen (optional, für Dokumentation)

3. **C# Backend:**
   - `AgentBuilder.AgentService/Processors/generatedNodeProcessorRegistration.cs`
   - **Hinweis:** C# Processors wurden entfernt, Datei ist nur für Referenz

### Generierung ausführen

```bash
cd shared
npm run generate:registry
```

**Wann generieren:**
- Nach jeder Registry-Änderung
- Vor jedem Build
- In CI/CD Pipeline

---

## 🛡️ Validierung

### Registry-Validator

```bash
cd shared
npm run validate:registry
```

**Prüft:**
- ✅ Alle Nodes haben Pflichtfelder (`type`, `name`, `icon`, `category`)
- ✅ Keine doppelten Node-Typen
- ✅ Frontend-Felder sind valide
- ✅ Processor-Pfade existieren
- ✅ Kategorien sind bekannt
- ✅ JSON Schema ist valide

### Konsistenz-Check

```bash
npm run check:consistency
```

**Prüft:**
- ✅ Processor-Dateien existieren
- ✅ Frontend Components existieren (wenn registriert)
- ✅ Registry und Code sind synchron

---

## 🔍 Auto-Discovery

### TypeScript Auto-Discovery

**Regeln:**
- Datei muss `*NodeProcessor.ts` heißen
- Muss `registerNodeProcessor()` aufrufen
- Wird automatisch gefunden beim Start

**Beispiel:**
```typescript
// nodes/myNodeProcessor.ts
import { registerNodeProcessor } from './index';

registerNodeProcessor({
  type: 'my-node',
  name: 'My Node',
  processNodeData: async (node, input, context) => {
    // Implementation
  },
});
```

**Wird automatisch gefunden!** Keine manuelle Registrierung nötig.

---

## 🎨 Frontend Integration

### Auto-Config Form

**Wenn `useAutoConfigForm: true` und `fields` definiert:**

```json
{
  "frontend": {
    "hasConfigForm": true,
    "useAutoConfigForm": true,
    "fields": {
      "label": { "type": "text" },
      "prompt": { "type": "expression", "multiline": true }
    }
  }
}
```

**Automatisch verfügbar:**
- ✅ Text-Inputs
- ✅ Expression Editor (mit `{{variables}}`)
- ✅ Select-Dropdowns
- ✅ Number-Slider
- ✅ Textareas
- ✅ VariableTreePopover
- ✅ Debug-Integration

**Kein zusätzlicher Code nötig!**

### Custom Config Form

**Nur wenn komplexe UI nötig:**

```typescript
// 1. Custom Form erstellen
// NodeConfigForms/MyNewNodeConfigForm.tsx

// 2. In configFormRegistry.tsx registrieren
registerCustomConfigForm('my-new-node', MyNewNodeConfigForm);

// 3. In Registry:
{
  "frontend": {
    "hasConfigForm": true,
    "useAutoConfigForm": false,
    "configFormComponent": "MyNewNodeConfigForm"
  }
}
```

---

## 🚨 Häufige Fehler

### 1. Node fehlt in Registry

**Symptom:** Node funktioniert nicht, Code-Generierung fehlt Node

**Lösung:**
```json
// shared/registry.json erweitern
{
  "type": "my-node",
  // ... alle Pflichtfelder
}
```

### 2. Processor nicht gefunden

**Symptom:** "No processor found for node type"

**Lösung:**
- Prüfe Dateiname: `*NodeProcessor.ts`
- Prüfe `registerNodeProcessor()` wird aufgerufen
- Prüfe `type` stimmt mit registry.json überein

### 3. Config Form zeigt nicht

**Symptom:** Config Panel ist leer

**Lösung:**
```json
// Prüfe Registry:
{
  "frontend": {
    "hasConfigForm": true, // Muss true sein
    "useAutoConfigForm": true, // Oder Custom Form registriert
    "fields": { ... } // Muss vorhanden sein wenn useAutoConfigForm
  }
}
```

### 4. Code-Generierung fehlgeschlagen

**Symptom:** Generierte Dateien sind leer oder fehlerhaft

**Lösung:**
```bash
# 1. Registry validieren
npm run validate:registry

# 2. JSON Syntax prüfen
# shared/registry.json muss valides JSON sein

# 3. Code-Generierung erneut ausführen
npm run generate:registry
```

### 5. Generierte Dateien manuell bearbeitet

**Symptom:** Änderungen werden bei nächster Generierung überschrieben

**Lösung:**
- Generierte Dateien NIE manuell bearbeiten
- Stattdessen: Registry.json ändern und neu generieren

---

## ✅ Checkliste vor Commit

### Registry
- [ ] Registry-Eintrag erstellt (shared/registry.json)
- [ ] Alle Pflichtfelder vorhanden (type, name, icon, category)
- [ ] Node-Typ ist kebab-case
- [ ] Processor-Pfad ist korrekt
- [ ] Frontend-Felder definiert (wenn useAutoConfigForm)

### Code-Generierung
- [ ] Code generiert (`npm run generate:registry`)
- [ ] Generierte Dateien nicht manuell bearbeitet
- [ ] Generierte Dateien sind im Git

### Validierung
- [ ] Registry validiert (`npm run validate:registry`)
- [ ] Konsistenz geprüft (`npm run check:consistency`)
- [ ] Keine Fehler

### Processor
- [ ] Processor-Datei erstellt (`*NodeProcessor.ts`)
- [ ] `registerNodeProcessor()` aufgerufen
- [ ] `type` stimmt mit registry.json überein

### Frontend (optional)
- [ ] Custom Component erstellt (wenn nötig)
- [ ] In nodeRegistry.ts registriert (wenn nötig)
- [ ] Custom Config Form registriert (wenn nötig)

---

## 🔗 Querverweise zu anderen Rules

- **[Frontend Workflow Rules](../frontend-workflow.md)** - Frontend Component Registrierung, Config Forms
- **[Backend Services Rules](../backend-services.md)`** - Node Processor Entwicklung

---

## 📚 Weitere Ressourcen

### Dokumentation

- **[Node Development Guide](../../docs/NODE_DEVELOPMENT_GUIDE.md)** ⭐ **HAUPTDOKUMENTATION** - Vollständige Anleitung für neue Entwickler
- **[Documentation Index](../../docs/README.md)** - Übersicht aller verfügbaren Dokumentationen

### Code-Referenzen

- `shared/registry.json` - Die zentrale Registry-Datei
- `shared/scripts/generateRegistry.ts` - Code-Generator
- `shared/scripts/validateRegistry.ts` - Validator
- `shared/scripts/registryConsistencyCheck.ts` - Konsistenz-Checker
- `frontend/src/components/WorkflowBuilder/nodeRegistry/generatedMetadata.ts` - Generierte Frontend-Metadaten
- `packages/execution-service/src/nodes/registerBuiltIns.ts` - Backend Processor-Registrierung

---

## 🎯 Best Practices

### 1. Immer Registry zuerst
- Neue Nodes/Tools immer zuerst in `registry.json` definieren
- Dann Processors erstellen
- Dann Code generieren

### 2. Konventionen befolgen
- **Node-Typen:** kebab-case
- **Processor-Dateien:** `*NodeProcessor.ts`
- **Processor-Pfade:** `./nodes/...` oder `./nodes/registerBuiltIns#identifier`

### 3. Metadata vollständig
- Immer `icon`, `description`, `category` angeben
- Frontend-Felder definieren für Auto-Config-Form
- Processor-Referenzen angeben

### 4. Validierung nutzen
- Vor jedem Commit: `npm run validate:registry`
- CI/CD Pipeline sollte Validator ausführen
- `prebuild` Script validiert automatisch

### 5. Code-Generierung nicht vergessen
- Nach jeder Registry-Änderung generieren
- Generierte Dateien committen
- Nie manuell bearbeiten

---

---

## 🔄 Workflow für Node-Änderungen

### Node anpassen (z.B. Agent Node)

**Beispiel:** Agent Node wurde angepasst, um OpenAI's Agent Builder UI zu entsprechen:

1. **Registry aktualisieren** (wenn Metadaten/Placeholder geändert werden):
   ```json
   // shared/registry.json
   {
     "type": "agent",
     "frontend": {
       "fields": {
         "systemPrompt": {
           "placeholder": "Enter instructions for the agent. Use {{variables}} for dynamic content"
           // Geändert von "Enter system prompt..."
         }
       }
     }
   }
   ```

2. **Code generieren:**
   ```bash
   cd shared
   npm run generate:registry
   ```

3. **Frontend Code anpassen** (wenn UI-Layout/Reihenfolge geändert wird):
   - `frontend/src/components/WorkflowBuilder/NodeConfigPanel.tsx` - Custom Form
   - Labels, Reihenfolge, Layout-Anpassungen

4. **Validieren:**
   ```bash
   npm run validate:registry
   ```

**Wichtig:** 
- Registry-Änderungen → Immer `npm run generate:registry` ausführen
- Frontend-UI-Änderungen → Direkt im Code (Custom Forms)
- Beide müssen synchron sein!

---

**Letzte Aktualisierung:** 17.01.2026  
**Wichtig:** Registry ist Single Source of Truth. Änderungen müssen hier gemacht werden, nicht in generierten Dateien!

**Für neue Entwickler:** Siehe [Node Development Guide](../../docs/NODE_DEVELOPMENT_GUIDE.md) für vollständige Anleitung.

