# 📋 Shared Registry - Single Source of Truth

This directory contains the **central registry** for all nodes and tools in the Monshy system.

---

## 🎯 Purpose

**Define once, use everywhere.** The registry (`registry.json`) is the single source of truth for:
- Node metadata (name, icon, category, etc.)
- Frontend configuration (config forms, fields)
- Backend processor references (C# and TypeScript)

---

## 📁 Structure

```
shared/
├── registry.json              # ⭐ Single Source of Truth
├── scripts/
│   ├── generateRegistry.ts    # Code generator
│   ├── validateRegistry.ts   # Validator
│   └── registryConsistencyCheck.ts  # Consistency check
├── package.json
└── tsconfig.json
```

---

## 🚀 Usage

### Extending the Registry

1. Open `registry.json`
2. Add node/tool (see examples in the file)
3. Validate: `npm run validate:registry`
4. Generate code: `npm run generate:registry` (optional)

### Validation

```bash
cd shared
npm install  # One-time setup
npm run validate:registry
npm run check:consistency
```

### Code Generation

```bash
npm run generate:registry
```

Generates:
- `frontend/.../generatedMetadata.ts`
- `AgentBuilder.AgentService/.../generatedNodeProcessorRegistration.cs`
- `execution-service/.../generatedRegisterBuiltIns.ts`

---

## 📚 Documentation

- **REGISTRY_QUICK_START.md**: 5-minute guide
- **REGISTRY_ARCHITECTURE.md**: Architecture overview
- **REGISTRY_MIGRATION_GUIDE.md**: Migration guide for existing nodes
- **HOW_TO_ADD_NODES_AND_TOOLS.md**: Complete guide

---

## ✅ Best Practices

1. **Always validate first** before code generation
2. **Check consistency** after changes
3. **Create backup** before major changes
4. **Version control** in Git for changes

---

## 🐛 Troubleshooting

### "registry.json not found"
→ Check that you are in the `shared/` directory
→ Check that `registry.json` exists

### "Validation failed"
→ Run `npm run validate:registry`
→ Check error messages

### "Code generation failed"
→ Check that `registry.json` is valid JSON
→ Check that all paths are correct

---

**🎉 With this registry architecture, developers can add new nodes/tools in minutes!**
