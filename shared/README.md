# 📋 Shared Registry - Single Source of Truth

Dieses Verzeichnis enthält die **zentrale Registry** für alle Nodes und Tools im Monshy-System.

---

## 🎯 Zweck

**Einmal definieren, überall nutzen.** Die Registry (`registry.json`) ist die einzige Quelle für:
- Node-Metadaten (Name, Icon, Kategorie, etc.)
- Frontend-Konfiguration (Config-Forms, Felder)
- Backend-Processor-Referenzen (C# und TypeScript)

---

## 📁 Struktur

```
shared/
├── registry.json              # ⭐ Single Source of Truth
├── scripts/
│   ├── generateRegistry.ts    # Code-Generator
│   ├── validateRegistry.ts   # Validator
│   └── registryConsistencyCheck.ts  # Konsistenz-Check
├── package.json
└── tsconfig.json
```

---

## 🚀 Verwendung

### Registry erweitern

1. Öffne `registry.json`
2. Füge Node/Tool hinzu (siehe Beispiele in der Datei)
3. Validiere: `npm run validate:registry`
4. Code generieren: `npm run generate:registry` (optional)

### Validierung

```bash
cd shared
npm install  # Einmalig
npm run validate:registry
npm run check:consistency
```

### Code-Generierung

```bash
npm run generate:registry
```

Generiert:
- `frontend/.../generatedMetadata.ts`
- `AgentBuilder.AgentService/.../generatedNodeProcessorRegistration.cs`
- `execution-service/.../generatedRegisterBuiltIns.ts`

---

## 📚 Dokumentation

- **REGISTRY_QUICK_START.md**: 5-Minuten-Anleitung
- **REGISTRY_ARCHITECTURE.md**: Architektur-Übersicht
- **REGISTRY_MIGRATION_GUIDE.md**: Migration bestehender Nodes
- **HOW_TO_ADD_NODES_AND_TOOLS.md**: Vollständige Anleitung

---

## ✅ Best Practices

1. **Immer zuerst validieren** vor Code-Generierung
2. **Konsistenz prüfen** nach Änderungen
3. **Backup erstellen** vor größeren Änderungen
4. **Versionierung** in Git für Änderungen

---

## 🐛 Troubleshooting

### "registry.json not found"
→ Prüfe, dass du im `shared/` Verzeichnis bist
→ Prüfe, dass `registry.json` existiert

### "Validation failed"
→ Führe `npm run validate:registry` aus
→ Prüfe Fehler-Messages

### "Code generation failed"
→ Prüfe, dass `registry.json` valide JSON ist
→ Prüfe, dass alle Pfade korrekt sind

---

**🎉 Mit dieser Registry-Architektur können Entwickler neue Nodes/Tools in Minuten hinzufügen!**

