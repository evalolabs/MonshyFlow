# Cursor Rules - Übersicht

**Entwicklungsregeln für MonshyFlow - Single Source of Truth für Architektur-Entscheidungen**

---

## 📋 Verfügbare Rules

### 1. [Frontend Workflow](./frontend-workflow.md)
**Für:** Frontend-Entwicklung am WorkflowBuilder  
**Wichtig für:** React Components, Hooks, State Management, Animation, Auto-Layout

**Kritische Themen:**
- Node Data Struktur (Object, nie String)
- Immutable State Updates
- Edge Type Bestimmung
- Tool Nodes Positionierung
- Animation System
- Node Grouping

### 2. [Backend Services](./backend-services.md)
**Für:** Backend-Service-Entwicklung  
**Wichtig für:** Clean Architecture, Dependency Injection, API Development

**Kritische Themen:**
- Clean Architecture (Controller → Service → Repository)
- Dependency Injection (TSyringe)
- Input Validation (Zod)
- Error Handling
- Multi-Tenant Isolation
- Execution Service Patterns

### 3. [Registry System](./registry-system.md)
**Für:** Node/Tool-Entwicklung  
**Wichtig für:** Neue Nodes/Tools hinzufügen, Code-Generierung

**Kritische Themen:**
- Single Source of Truth (shared/registry.json)
- Code-Generierung Workflow
- Auto-Discovery
- Validierung

---

## 🎯 Wie verwenden?

### Beim Entwickeln

1. **Relevante Rules lesen** - Je nach Aufgabe (Frontend/Backend/Registry)
2. **Checkliste durchgehen** - Vor jedem Commit
3. **Bei Unsicherheit** - Rules konsultieren, nicht raten

### Bei Code Review

1. **Rules als Checkliste** - Prüfen ob eingehalten
2. **Kritische Regeln** - Müssen immer eingehalten werden
3. **Best Practices** - Sollten eingehalten werden

---

## ⚠️ Priorisierung

### 🔴 KRITISCH - Nie verletzen
- Node Data Struktur (Object, nie String)
- Immutable State Updates
- Clean Architecture Schichten
- Registry Single Source of Truth
- Tenant Isolation
- Input Validation

### 🟡 WICHTIG - Sollten eingehalten werden
- Performance Optimierungen
- Code-Generierung Workflow
- Strukturiertes Logging
- Error Handling Patterns

### 🟢 BEST PRACTICES - Empfohlen
- React.memo, useMemo, useCallback
- Code-Organisation
- Dokumentation

---

## 🔗 Querverweise

### Frontend → Backend
- Node Data Format muss übereinstimmen
- API Calls verwenden workflowService (sanitized)
- Expression Resolution (Frontend Editor → Backend Processing)

### Frontend → Registry
- Neue Nodes müssen in Registry definiert sein
- Metadaten kommen aus Registry
- Code-Generierung für Frontend

### Backend → Registry
- Node Processors müssen registriert sein
- Tools müssen in Registry definiert sein
- Code-Generierung für Backend

---

## 📊 Coverage

| Bereich | Coverage | Status |
|---------|----------|--------|
| Frontend Workflow | ✅ Sehr gut | 973 Zeilen |
| Backend Services | ✅ Sehr gut | 812 Zeilen |
| Registry System | ✅ Sehr gut | 745 Zeilen |
| API/Integration | ⚠️ Fehlt | TODO |
| Testing | ⚠️ Fehlt | TODO |
| Deployment | ⚠️ Fehlt | TODO |
| Monitoring | ⚠️ Fehlt | TODO |

---

## 🚀 Nächste Schritte

1. **API/Integration Rules** - Gateway, Webhooks, SSE Events
2. **Testing Rules** - Unit Tests, Integration Tests, E2E
3. **Deployment Rules** - Docker, Azure, CI/CD
4. **Monitoring Rules** - Logging, Metrics, Alerts

---

**Letzte Aktualisierung:** 15.12.2025  
**Wichtig:** Diese Rules sind lebende Dokumente. Bei Änderungen: Rules aktualisieren!

