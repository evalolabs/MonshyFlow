# 🏗️ Registry Architecture - Single Source of Truth

## 🎯 Vision

**Einmal definieren, überall nutzen.** Die Registry-Architektur stellt sicher, dass neue Nodes und Tools an **nur einer Stelle** definiert werden müssen und automatisch überall verfügbar sind.

---

## 📋 Architektur-Übersicht

```
shared/registry.json (Single Source of Truth)
    │
    ├─→ Code-Generator (generateRegistry.ts)
    │   ├─→ Frontend: generatedMetadata.ts
    │   ├─→ C#: generatedNodeProcessorRegistration.cs
    │   └─→ TypeScript: generatedRegisterBuiltIns.ts
    │
    ├─→ Frontend (React)
    │   ├─→ nodeMetadata.ts (merged with generated)
    │   ├─→ nodeRegistry.ts (Component mapping)
    │   └─→ NodeConfigPanel (metadata-driven)
    │
    └─→ Backend TypeScript (Execution Service)
        ├─→ registryLoader.ts (loads from registry.json)
        ├─→ autoDiscovery.ts (file-based discovery)
        └─→ Node/Tool Registries (runtime registries)
```

---

## 🔄 Registrierungs-Flow

### 1. **Registry Definition** (`shared/registry.json`)

```json
{
  "nodes": [
    {
      "type": "my-new-node",
      "name": "My New Node",
      "icon": "🎯",
      "description": "Does something awesome",
      "category": "utility",
      "csharpProcessor": "MyNewNodeProcessor",
      "typescriptProcessor": "./nodes/registerBuiltIns#my-new-node",
      "frontend": {
        "hasConfigForm": true,
        "useAutoConfigForm": true,
        "fields": {
          "label": { "type": "text", "placeholder": "Node Label" },
          "prompt": { 
            "type": "expression", 
            "multiline": true, 
            "rows": 6 
          }
        }
      }
    }
  ]
}
```

### 2. **Code-Generierung** (Optional, aber empfohlen)

```bash
cd shared
npm run generate:registry
```

Generiert:
- `frontend/src/components/WorkflowBuilder/nodeRegistry/generatedMetadata.ts`
- `AgentBuilder.AgentService/Processors/generatedNodeProcessorRegistration.cs`
- `execution-service/src/nodes/generatedRegisterBuiltIns.ts`

### 3. **Automatische Registrierung**

#### Frontend:
- **Auto-Discovery**: Lädt Node-Metadaten automatisch vom Backend (`/api/schemas/nodes`)
- **Node Metadata**: Wird aus `nodeMetadata.ts` + Auto-Discovery geladen
- **Component Registry**: `nodeRegistry.ts` mappt Node-Typen zu React-Komponenten
- **Config Forms**: `NodeConfigPanel` verwendet `MetadataDrivenConfigForm` → automatisch aus Metadaten

#### Backend TypeScript:
- **registryLoader**: Lädt `registry.json` → importiert Processor-Dateien
- **autoDiscovery**: Findet alle `*NodeProcessor.ts` Dateien → registriert automatisch
- **Fallback**: Falls Registry nicht gefunden wird, verwendet `registerBuiltIns.ts`

---

## ✅ Vorteile

### 1. **Single Source of Truth**
- ✅ Eine Datei (`shared/registry.json`) definiert alles
- ✅ Keine Duplikation von Metadaten
- ✅ Konsistenz zwischen Frontend und Backend garantiert

### 2. **Automatische Discovery**
- ✅ Neue Processors werden automatisch gefunden (C#: Reflection, TS: File-Scan)
- ✅ Keine manuelle Registrierung nötig
- ✅ Konvention über Konfiguration

### 3. **Metadata-Driven UI**
- ✅ Config-Forms werden automatisch aus Metadaten generiert
- ✅ Keine manuellen switch-cases mehr nötig
- ✅ Expression Editor, VariableTreePopover automatisch integriert

### 4. **Validierung**
- ✅ Registry-Validator prüft Konsistenz
- ✅ Build-Time Checks verhindern Fehler
- ✅ Type-Safety durch Code-Generierung

---

## 🚀 Entwickler-Workflow

### Neuen Node hinzufügen:

1. **Registry erweitern** (`shared/registry.json`)
   ```json
   {
     "type": "my-node",
     "name": "My Node",
     "icon": "🎯",
     "category": "utility",
     "csharpProcessor": "MyNodeProcessor",
     "typescriptProcessor": "./nodes/registerBuiltIns#my-node",
     "frontend": {
       "hasConfigForm": true,
       "useAutoConfigForm": true,
       "fields": { ... }
     }
   }
   ```

2. **Processor erstellen**
   - **TypeScript**: `nodes/myNodeProcessor.ts` (wird automatisch gefunden)
   - **Wichtig**: C# Processors wurden entfernt, alle Execution läuft über TypeScript

3. **Frontend Component** (optional, nur wenn Custom UI nötig)
   - `NodeTypes/MyNode.tsx`
   - In `nodeRegistry.ts` registrieren

4. **Code generieren** (optional)
   ```bash
   npm run generate:registry
   ```

5. **Validieren**
   ```bash
   npm run validate:registry
   ```

**Fertig!** Der Node ist jetzt überall verfügbar:
- ✅ Im Frontend sichtbar
- ✅ Im Backend ausführbar
- ✅ Config-Form automatisch generiert

---

## 🔍 Auto-Discovery Details

### TypeScript Auto-Discovery

**Regeln:**
- Datei muss `*NodeProcessor.ts` heißen
- Muss `NodeProcessor` Interface implementieren
- Muss `registerNodeProcessor()` aufrufen

**Beispiel:**
```typescript
// nodes/myNodeProcessor.ts
import { registerNodeProcessor } from './index';

registerNodeProcessor({
    type: 'my-node',
    name: 'My Node',
    process: async (node, input, context) => {
        // Implementation
    },
});
```

---

## 🛡️ Validierung

### Registry-Validator

```bash
cd shared
npm run validate:registry
```

**Prüft:**
- ✅ Alle Nodes haben `type`, `name`, `category`
- ✅ Keine doppelten Node-Typen
- ✅ Frontend-Felder sind valide
- ✅ Processor-Referenzen existieren
- ✅ Kategorien sind bekannt

### Build-Time Checks

- **Frontend**: TypeScript-Compiler prüft generierte Metadaten
- **Backend C#**: Compiler prüft generierte Registrierungen
- **CI/CD**: Validator läuft automatisch vor Build

---

## 📚 Best Practices

### 1. **Immer Registry zuerst**
- Neue Nodes/Tools immer zuerst in `registry.json` definieren
- Dann Processors erstellen
- Code-Generierung ausführen

### 2. **Konventionen befolgen**
- **C# Processors**: `*NodeProcessor.cs` im `Processors/` Ordner
- **TypeScript Processors**: `*NodeProcessor.ts` im `nodes/` Ordner
- **Node-Typen**: kebab-case (z.B. `my-new-node`)

### 3. **Metadata vollständig**
- Immer `icon`, `description`, `category` angeben
- Frontend-Felder definieren für Auto-Config-Form
- Processor-Referenzen angeben

### 4. **Validierung nutzen**
- Vor jedem Commit: `npm run validate:registry`
- CI/CD Pipeline sollte Validator ausführen

---

## 🎯 Migration von bestehenden Nodes

### Schritt 1: Registry-Eintrag erstellen

Füge Node zu `shared/registry.json` hinzu mit allen Metadaten.

### Schritt 2: Code-Generierung

```bash
npm run generate:registry
```

### Schritt 3: Frontend-Metadaten mergen

Die generierten Metadaten werden automatisch in `nodeMetadata.ts` integriert.

### Schritt 4: Config-Form migrieren

- Falls `useAutoConfigForm: true` → automatisch
- Falls Custom Form → in `configFormRegistry.tsx` registrieren

### Schritt 5: Validierung

```bash
npm run validate:registry
```

---

## 🐛 Troubleshooting

### "Node not found in registry"
→ Node zu `shared/registry.json` hinzufügen

### "Processor not registered"
→ Auto-Discovery sollte es finden, falls nicht:
- C#: Prüfe Klassennamen endet mit `NodeProcessor`
- TypeScript: Prüfe Dateiname endet mit `NodeProcessor.ts`

### "Config form not showing"
→ Prüfe `hasConfigForm: true` in Registry
→ Prüfe `useAutoConfigForm: true` oder Custom Form registriert

### "Code generation failed"
→ Prüfe `shared/registry.json` ist valide JSON
→ Führe `npm run validate:registry` aus

---

## 📈 Roadmap

### ✅ Implementiert
- [x] Registry als Single Source of Truth
- [x] Code-Generator für Frontend/C#/TypeScript
- [x] Auto-Discovery für C# (Reflection)
- [x] Auto-Discovery für TypeScript (File-Scan)
- [x] Metadata-Driven Config Forms
- [x] Registry-Validator

### 🚀 Geplant
- [ ] Visual Registry Editor (UI zum Bearbeiten von registry.json)
- [ ] Hot-Reload für Registry-Änderungen (Development)
- [ ] Registry-Versionierung (Migration zwischen Versionen)
- [ ] Registry-Export/Import (für Plugins)

---

## 📖 Weitere Ressourcen

- **HOW_TO_ADD_NODES_AND_TOOLS.md**: Schritt-für-Schritt Anleitung
- **CONFIG_PANEL_STANDARD.md**: Standard für Config-Panels
- **shared/scripts/generateRegistry.ts**: Code-Generator
- **shared/scripts/validateRegistry.ts**: Validator

---

**🎉 Mit dieser Architektur können Entwickler neue Nodes/Tools in Minuten hinzufügen, ohne an vielen Stellen Code anpassen zu müssen!**

