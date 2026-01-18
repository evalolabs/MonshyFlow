# MonshyFlow Documentation

Welcome to the MonshyFlow documentation. This directory contains comprehensive guides for developers working on the platform.

## 📚 Available Documentation

### Core Development Guides

- **[Node Development Guide](./NODE_DEVELOPMENT_GUIDE.md)** ⭐ **START HERE**
  - Complete guide for adding and modifying nodes
  - Understanding the registry system
  - Step-by-step instructions with examples
  - Best practices and troubleshooting

### Architecture Documentation

- **Frontend Analysis** - See `analysis/FRONTEND_ANALYSIS.md`
- **Backend Architecture** - See individual service READMEs in `packages/`

### Deployment Documentation

- **Azure Deployment** - See `azure-deployment/README.md`
- **Environment Variables** - See `azure-deployment/ENVIRONMENT_VARIABLES.md`

### API Documentation

- **API Integrations** - See `shared/apiIntegrations/`
- **API Authentication Categories** - See `docs/API_INTEGRATIONS_AUTH_CATEGORIES.md` (if generated)

## 🚀 Quick Start for New Developers

1. **Read the Node Development Guide**
   - Essential for understanding how nodes work
   - Explains the registry system (critical!)
   - Provides examples and best practices

2. **Understand the Registry System**
   - `shared/registry.json` is the Single Source of Truth
   - Always run `npm run generate:registry` after changes
   - Never hardcode node metadata

3. **Study Existing Nodes**
   - Simple: `delay` node
   - Medium: `transform` node
   - Complex: `agent` node, `code` node

## 📝 Contributing

When adding new features or modifying existing ones:

1. **Check existing documentation first**
2. **Update documentation if needed**
3. **Follow the patterns in existing code**
4. **Run validation scripts before committing**

## 🔍 Finding Information

- **Node Development:** See [NODE_DEVELOPMENT_GUIDE.md](./NODE_DEVELOPMENT_GUIDE.md)
- **Frontend Components:** See `frontend/src/components/`
- **Backend Services:** See `packages/`
- **Registry System:** See `shared/registry.json` and `.cursor/rules/registry-system.md`

## ❓ Need Help?

1. Check the relevant documentation
2. Review existing code examples
3. Check registry validation errors
4. Review generated metadata files

---

**Last Updated:** 2026-01-17

