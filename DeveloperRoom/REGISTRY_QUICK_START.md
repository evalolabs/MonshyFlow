# ⚡ Registry Quick Start - Neue Nodes/Tools in 5 Minuten

## 🎯 Ziel

Neuen Node oder Tool hinzufügen **ohne an vielen Stellen Code anzupassen**.

---

## 📝 Schritt-für-Schritt

### 1. Registry erweitern (1 Minute)

Öffne `shared/registry.json` und füge hinzu:

```json
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
        "rows": 6,
        "placeholder": "Enter prompt... Use {{variables}}"
      }
    }
  }
}
```

### 2. Processor erstellen (2 Minuten)

#### C# Processor:
```csharp
// AgentBuilder.AgentService/Processors/MyNewNodeProcessor.cs
public class MyNewNodeProcessor : BaseNodeProcessor
{
    public MyNewNodeProcessor() : base(null!) { }
    
    public override async Task<BsonDocument?> ProcessAsync(Node node, ExecutionContext context)
    {
        // Your logic here
        return CreateOutput("Result", null, true);
    }
}
```

**Wird automatisch gefunden!** (Auto-Discovery)

#### TypeScript Processor:
```typescript
// execution-service/src/nodes/myNewNodeProcessor.ts
import { registerNodeProcessor } from './index';

registerNodeProcessor({
    type: 'my-new-node',
    name: 'My New Node',
    process: async (node, input, context) => {
        // Your logic here
        return { result: 'success' };
    },
});
```

**Wird automatisch gefunden!** (Auto-Discovery)

### 3. Frontend Component (1 Minute, optional)

Nur wenn Custom UI nötig:

```tsx
// frontend/src/components/WorkflowBuilder/NodeTypes/MyNewNode.tsx
import { BaseNode } from './BaseNode';

export function MyNewNode({ data }: any) {
  return (
    <BaseNode
      label={data.label || 'My New Node'}
      icon="🎯"
      category="utility"
      hasInput={true}
      hasOutput={true}
    />
  );
}
```

Dann in `nodeRegistry.ts` registrieren:
```typescript
import { MyNewNode } from '../NodeTypes/OptimizedNodes';
'my-new-node': MyNewNode,
```

### 4. Validieren (30 Sekunden)

```bash
cd shared
npm run validate:registry
npm run check:consistency
```

### 5. Fertig! 🎉

**Der Node ist jetzt:**
- ✅ Im Frontend sichtbar
- ✅ Im Backend ausführbar
- ✅ Config-Form automatisch generiert
- ✅ Expression Editor integriert
- ✅ VariableTreePopover verfügbar

---

## 🎨 Config-Form automatisch

Wenn `useAutoConfigForm: true` und `fields` definiert sind:

**Automatisch verfügbar:**
- ✅ Text-Inputs
- ✅ Expression Editor (mit `{{variables}}`)
- ✅ Select-Dropdowns
- ✅ Number-Slider
- ✅ Textareas
- ✅ VariableTreePopover
- ✅ Debug-Integration

**Kein zusätzlicher Code nötig!**

---

## 🔧 Custom Config-Form (falls nötig)

Falls komplexe UI nötig:

1. **Custom Form erstellen:**
```tsx
// NodeConfigForms/MyNewNodeConfigForm.tsx
export function MyNewNodeConfigForm({ config, onConfigChange, ... }) {
  return (
    <div className="space-y-4">
      {/* Custom UI */}
    </div>
  );
}
```

2. **Registrieren:**
```typescript
// configFormRegistry.tsx
import { MyNewNodeConfigForm } from '../NodeConfigForms/MyNewNodeConfigForm';
registerCustomConfigForm('my-new-node', MyNewNodeConfigForm);
```

3. **In Registry:**
```json
"frontend": {
  "hasConfigForm": true,
  "useAutoConfigForm": false,
  "configFormComponent": "MyNewNodeConfigForm"
}
```

---

## ✅ Checkliste

- [ ] Registry-Eintrag erstellt
- [ ] C# Processor erstellt (wird auto-gefunden)
- [ ] TypeScript Processor erstellt (wird auto-gefunden)
- [ ] Frontend Component (optional)
- [ ] Validierung bestanden
- [ ] Getestet

**Das war's!** 🚀

---

## 📚 Weitere Ressourcen

- **HOW_TO_ADD_NODES_AND_TOOLS.md**: Detaillierte Anleitung
- **CONFIG_PANEL_STANDARD.md**: Config-Panel Standard
- **REGISTRY_ARCHITECTURE.md**: Architektur-Übersicht

