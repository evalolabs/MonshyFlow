# 🔄 Registry Migration Guide

## Übersicht

Dieser Guide erklärt, wie bestehende Nodes/Tools zur neuen Registry-Architektur migriert werden.

---

## 🎯 Ziel

**Alle Nodes/Tools sollen:**
- ✅ In `shared/registry.json` definiert sein
- ✅ Automatisch im Frontend verfügbar sein
- ✅ Automatisch im Backend registriert sein
- ✅ Config-Forms automatisch generiert werden

---

## 📋 Migrations-Schritte

### Schritt 1: Registry-Eintrag erstellen

Füge Node/Tool zu `shared/registry.json` hinzu:

```json
{
  "type": "existing-node",
  "name": "Existing Node",
  "icon": "🎯",
  "description": "Description",
  "category": "utility",
  "csharpProcessor": "ExistingNodeProcessor",
  "typescriptProcessor": "./nodes/registerBuiltIns#existing-node",
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

### Schritt 2: Code generieren

```bash
cd shared
npm run generate:registry
```

### Schritt 3: Frontend-Metadaten aktualisieren

Die generierten Metadaten werden automatisch in `nodeMetadata.ts` integriert. Falls Custom Form existiert:

```typescript
// configFormRegistry.tsx
import { ExistingNodeConfigForm } from '../NodeConfigForms/ExistingNodeConfigForm';
registerCustomConfigForm('existing-node', ExistingNodeConfigForm);
```

### Schritt 4: Validierung

```bash
npm run validate:registry
npm run check:consistency
```

### Schritt 5: Testen

- ✅ Node erscheint im Node-Selector
- ✅ Config-Form funktioniert
- ✅ Backend kann Node verarbeiten

---

## 🔍 Bestehende Nodes prüfen

### Welche Nodes müssen migriert werden?

1. **Nodes mit manuellen switch-cases in NodeConfigPanel**
   - → Sollten zu `useAutoConfigForm: true` migriert werden
   - → Oder Custom Form in `configFormRegistry.tsx` registrieren

2. **Nodes ohne Registry-Eintrag**
   - → Zu `shared/registry.json` hinzufügen

3. **Nodes mit manueller Processor-Registrierung**
   - → Auto-Discovery sollte sie finden
   - → Falls nicht: Registry-Eintrag hinzufügen

---

## ✅ Checkliste

- [ ] Node in `shared/registry.json` definiert
- [ ] Code-Generierung ausgeführt
- [ ] Frontend-Metadaten aktualisiert
- [ ] Config-Form migriert (Auto oder Custom)
- [ ] Validierung bestanden
- [ ] Konsistenz-Check bestanden
- [ ] Getestet im Frontend
- [ ] Getestet im Backend

---

## 🚀 Nach Migration

Nach erfolgreicher Migration:
- ✅ Node erscheint automatisch überall
- ✅ Keine manuellen Registrierungen mehr nötig
- ✅ Config-Form wird automatisch generiert
- ✅ Validierung verhindert Inkonsistenzen

