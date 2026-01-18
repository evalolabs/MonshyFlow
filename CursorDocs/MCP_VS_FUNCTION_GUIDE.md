# MCP vs. Function: Entscheidungsleitfaden für MonshyFlow

## Übersicht

In MonshyFlow gibt es zwei Möglichkeiten, Tools für Agents bereitzustellen:
- **Function**: Zentraler Function Catalog im eigenen System
- **MCP Server**: Externer Server mit Standard-Protokoll

Beide können technisch dasselbe tun (z.B. GraphHopper API aufrufen), aber sie unterscheiden sich in Architektur, Wiederverwendbarkeit und Einsatzbereich.

---

## Was ist eine Function?

### Definition
Eine **Function** in MonshyFlow ist:
- Eine **zentral registrierte Funktion** im Function Catalog
- Code läuft **im Execution Service** (im eigenen System)
- Verfügbar für **alle Agents und Workflows** innerhalb von MonshyFlow
- Wird über `/api/functions` bereitgestellt

### Beispiel
```typescript
// Registriert in packages/execution-service/src/functions/
export const graphhopperDistanceHandler: FunctionHandler = {
    name: 'calculate_distance_graphhopper',
    description: 'Calculate driving distance between two addresses',
    // ... Parameter, Metadata, execute Funktion
};
```

### Eigenschaften
✅ **Wiederverwendbar** innerhalb von MonshyFlow  
✅ **Einfach zu entwickeln** (direkt im Code)  
✅ **Schnell** (kein Netzwerk-Hop)  
✅ **Zentral verwaltet** (einmal registriert, überall nutzbar)  
❌ **Nur in MonshyFlow** nutzbar  
❌ **Kein Standard-Protokoll**

---

## Was ist ein MCP Server?

### Definition
Ein **MCP Server** (Model Context Protocol Server) ist:
- Ein **externer Service** (separater Server)
- Verwendet das **standardisierte MCP-Protokoll**
- Bietet **Tool-Discovery** (Agent erkennt automatisch verfügbare Tools)
- Kann von **mehreren Systemen/Plattformen** genutzt werden

### Beispiel
```typescript
// Externer MCP-Server (z.B. auf eigenem Server gehostet)
GET /tools → Liste der verfügbaren Tools
POST /invoke/:toolName → Tool ausführen
```

### Eigenschaften
✅ **Plattformübergreifend** (nicht nur MonshyFlow)  
✅ **Standard-Protokoll** (MCP)  
✅ **Tool-Discovery** (automatisch)  
✅ **Zentrale Kontrolle** (Auth, Logging, Quotas)  
❌ **Mehr Infrastruktur** nötig  
❌ **Etwas höhere Latenz** (Netzwerk-Hop)

---

## Vergleichstabelle

| Aspekt | Function (MonshyFlow) | MCP Server |
|--------|----------------------|------------|
| **Wo läuft Code?** | Im Execution Service | Externer Server |
| **Wiederverwendbar?** | ✅ Ja (innerhalb MonshyFlow) | ✅ Ja (plattformübergreifend) |
| **Protokoll** | Proprietär (MonshyFlow) | Standard (MCP) |
| **Andere Systeme nutzbar?** | ❌ Nein | ✅ Ja |
| **Tool-Discovery** | ❌ Nein (manuell registriert) | ✅ Ja (automatisch) |
| **Entwicklungsaufwand** | ✅ Niedrig | ⚠️ Mittel-Hoch |
| **Latenz** | ✅ Niedrig | ⚠️ Etwas höher |
| **Skalierbarkeit** | ⚠️ An Execution Service gebunden | ✅ Unabhängig skalierbar |
| **Governance** | ⚠️ Begrenzt | ✅ Zentral (Auth, Logging, Quotas) |

---

## Entscheidungshilfe: Wann Function, wann MCP?

### ✅ Verwende Function, wenn:

1. **Tool nur in MonshyFlow genutzt wird**
   - Beispiel: `calculate_distance_graphhopper` für interne Workflows

2. **Schnelle Entwicklung gewünscht ist**
   - Tool soll schnell verfügbar sein
   - Keine separate Infrastruktur nötig

3. **Einfache Use Cases**
   - Einzelne API-Aufrufe
   - Einfache Berechnungen
   - Datenbankabfragen

4. **Niedrige Latenz wichtig ist**
   - Tool wird häufig aufgerufen
   - Performance ist kritisch

5. **Zentrale Verwaltung innerhalb MonshyFlow ausreicht**
   - Alle Agents/Workflows nutzen dasselbe System
   - Keine externe Nutzung geplant

### ✅ Verwende MCP Server, wenn:

1. **Tool von anderen Systemen genutzt werden soll**
   - Nicht nur MonshyFlow, sondern auch andere Plattformen
   - Beispiel: Tool soll auch von ChatGPT, Claude, oder anderen LLMs genutzt werden

2. **Standard-Protokoll gewünscht ist**
   - Tool soll plattformübergreifend kompatibel sein
   - MCP-Standard soll genutzt werden

3. **Zentrale Governance wichtig ist**
   - Auth, Logging, Quotas zentral verwalten
   - Audit-Trail für alle Tool-Aufrufe

4. **Unabhängige Skalierung nötig ist**
   - Tool hat hohe Last
   - Soll unabhängig vom Execution Service skalieren

5. **Tool-Ökosystem aufgebaut wird**
   - Viele Tools sollen zentral verwaltet werden
   - Tool-Discovery automatisch funktionieren soll

---

## Praktische Entscheidungsregel

```
┌─────────────────────────────────────────┐
│  Tool nur in MonshyFlow?               │
│  └─→ JA → Function                     │
│  └─→ NEIN → MCP Server                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Tool von anderen Systemen nutzbar?     │
│  └─→ JA → MCP Server                   │
│  └─→ NEIN → Function                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Standard-Protokoll gewünscht?          │
│  └─→ JA → MCP Server                   │
│  └─→ NEIN → Function                   │
└─────────────────────────────────────────┘
```

**Einfache Regel:**
- **Function**: Für 80-90% der Use Cases (schnell, einfach, ausreichend)
- **MCP Server**: Wenn Tool plattformübergreifend oder mit Standard-Protokoll genutzt werden soll

---

## Beispiele

### Beispiel 1: GraphHopper Distance

**Szenario**: Distanzberechnung zwischen zwei Adressen

**Function (empfohlen für Start)**:
```typescript
// Registriert in packages/execution-service/src/functions/tools/
export const graphhopperDistanceHandler: FunctionHandler = {
    name: 'calculate_distance_graphhopper',
    // ... Implementation
};
```
- ✅ Schnell implementiert
- ✅ Für alle MonshyFlow Agents verfügbar
- ✅ Keine externe Infrastruktur nötig

**MCP Server (wenn plattformübergreifend)**:
```typescript
// Externer MCP-Server
@mcp.tool
def distance(origin: str, destination: str) -> dict:
    # GraphHopper API aufrufen
    return {...}
```
- ✅ Kann auch von anderen Systemen genutzt werden
- ✅ Standard-Protokoll
- ⚠️ Mehr Setup-Aufwand

**Empfehlung**: Start mit **Function**, migriere zu **MCP** wenn nötig.

---

### Beispiel 2: Firmeninterne Datenbank

**Szenario**: Zugriff auf firmeninterne Datenbank

**Function (empfohlen)**:
- Tool nur für interne MonshyFlow Workflows
- Keine externe Nutzung geplant
- Einfache Implementierung

**MCP Server (nicht empfohlen)**:
- Overkill für interne Tools
- Zusätzliche Infrastruktur ohne Mehrwert

**Empfehlung**: **Function**

---

### Beispiel 3: Öffentliches Tool-Ökosystem

**Szenario**: Tool soll von verschiedenen Plattformen genutzt werden

**Function (nicht geeignet)**:
- Nur in MonshyFlow nutzbar
- Kein Standard-Protokoll

**MCP Server (empfohlen)**:
- Plattformübergreifend nutzbar
- Standard-Protokoll
- Tool-Discovery automatisch

**Empfehlung**: **MCP Server**

---

## Migration: Von Function zu MCP

### Wann migrieren?

Migriere von Function zu MCP, wenn:
1. Tool von anderen Systemen genutzt werden soll
2. Standard-Protokoll benötigt wird
3. Zentrale Governance wichtig wird
4. Unabhängige Skalierung nötig ist

### Wie migrieren?

1. **MCP-Server erstellen**
   - Gleiche Funktionalität wie Function
   - MCP-Protokoll implementieren

2. **In MonshyFlow registrieren**
   - Als "Custom MCP Server" hinzufügen
   - Server-URL konfigurieren

3. **Function behalten (optional)**
   - Für Backward-Compatibility
   - Oder schrittweise migrieren

---

## Zusammenfassung

### Function = Code-Level-Tool
- **Löst**: Ein Agentenproblem
- **Für**: Schnelle, agent-spezifische Tools
- **Einsatz**: 80-90% der Use Cases

### MCP = System-Level-Tool
- **Löst**: Ein Organisationsproblem
- **Für**: Wiederverwendbare, plattformübergreifende Services
- **Einsatz**: 10-20% der Use Cases (wenn Standard-Protokoll oder externe Nutzung nötig)

### Wichtigste Erkenntnis

**Beide können technisch dasselbe tun.**  
**Der Unterschied ist nicht WAS sie können, sondern WO sie leben und WIE sie angebunden sind.**

- **Function**: Zentraler Catalog, Code im eigenen System
- **MCP**: Externer Server, Standard-Protokoll, plattformübergreifend

---

## Empfehlung für MonshyFlow

1. **Start mit Function** für die meisten Use Cases
2. **Migriere zu MCP** wenn:
   - Tool plattformübergreifend genutzt werden soll
   - Standard-Protokoll gewünscht ist
   - Zentrale Governance wichtig wird

3. **Beide können kombiniert werden**:
   - Kleine Helper als Function
   - Business-relevante Fähigkeiten als MCP

---

## Weitere Ressourcen

- [OpenAI MCP Documentation](https://platform.openai.com/docs/mcp)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [MonshyFlow Function Development Guide](../docs/NODE_DEVELOPMENT_GUIDE.md)

