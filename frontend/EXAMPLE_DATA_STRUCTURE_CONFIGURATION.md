# Beispiel: Data Structure Configuration

## Szenario: Weather API Workflow

**Workflow:** Start (Webhook) → Agent → HTTP Request → End

### Problem
- **Start Node** erhält Webhook-Request mit `{ city: "Berlin" }`
- **Agent Node** soll Wetter-Info generieren
- **HTTP Node** soll API aufrufen, braucht aber nur den Text-String

---

## Schritt 1: Start Node - Input Schema konfigurieren

### Was der User macht:
1. Start Node öffnen
2. "Input Data Structure" → "+ Configure Schema"
3. Schema definieren:

```json
{
  "type": "object",
  "properties": {
    "city": {
      "type": "string",
      "description": "City name for weather query"
    }
  },
  "required": ["city"]
}
```

### Was passiert:
- ✅ Webhook-Requests werden validiert
- ✅ Fehlerhafte Requests werden abgelehnt
- ✅ User sieht Beispiel-Input im UI

**Beispiel-Input:**
```json
{
  "city": "Berlin"
}
```

---

## Schritt 2: Agent Node - Output Schema konfigurieren

### Was der User macht:
1. Agent Node öffnen
2. "Data Structure Configuration" → "Output Schema" → "+ Configure Schema"
3. Schema definieren:

```json
{
  "type": "object",
  "properties": {
    "data": {
      "type": "string",
      "description": "Weather information text"
    },
    "metadata": {
      "type": "object",
      "properties": {
        "nodeId": { "type": "string" },
        "timestamp": { "type": "string" }
      }
    }
  },
  "required": ["data"]
}
```

### Was passiert:
- ✅ Dokumentiert, was der Agent ausgibt
- ✅ Bei Ausführung: Warnung wenn Output nicht passt
- ✅ Expression Editor zeigt verfügbare Felder

**Agent Output (Standard):**
```json
{
  "data": "In Berlin ist das Wetter derzeit klarer Himmel. Die Temperatur beträgt 5,42°C...",
  "metadata": {
    "nodeId": "agent-123",
    "nodeType": "agent",
    "timestamp": "2025-01-18T15:52:13.935Z"
  }
}
```

---

## Schritt 3: Agent Node - Output Mapping konfigurieren

### Problem:
HTTP Node erwartet nur den String, nicht das ganze NodeData-Objekt.

### Lösung: Output Mapping

**Was der User macht:**
1. Agent Node öffnen
2. "Output Mapping" → Dropdown wählen: "🔍 Extract Path"
3. Path eingeben: `"data"`

### Was passiert bei Ausführung:

**Vorher (ohne Output Mapping):**
```json
// HTTP Node bekommt:
{
  "data": "In Berlin ist das Wetter...",
  "metadata": { ... }
}
// ❌ HTTP Node kann damit nichts anfangen
```

**Nachher (mit Output Mapping):**
```json
// HTTP Node bekommt:
"In Berlin ist das Wetter derzeit klarer Himmel..."
// ✅ HTTP Node kann den String verwenden
```

---

## Schritt 4: HTTP Node - Input Schema konfigurieren

### Was der User macht:
1. HTTP Node öffnen
2. "Input Schema" → "+ Configure Schema"
3. Schema definieren:

```json
{
  "type": "string",
  "description": "Weather text to send to external API"
}
```

### Was passiert:
- ✅ Validierung: HTTP Node erwartet String
- ✅ Fehler wird früh erkannt, wenn Agent falsche Daten sendet

---

## Vollständiges Beispiel

### Workflow:
```
Start (Webhook) → Agent → HTTP Request → End
```

### Konfiguration:

**1. Start Node:**
- Input Schema: `{ city: string }`
- Output: `{ entryType: "webhook", input: { city: "Berlin" } }`

**2. Agent Node:**
- Input Schema: Keine (akzeptiert alles)
- Output Schema: `{ data: string, metadata: object }`
- **Output Mapping:** Extract Path → `"data"`
- Output an HTTP: `"In Berlin ist das Wetter..."`

**3. HTTP Node:**
- Input Schema: `string`
- Input erhält: `"In Berlin ist das Wetter..."` ✅
- Output: API Response

### Was passiert bei Ausführung:

```
1. Webhook Request kommt:
   { "city": "Berlin" }
   ✅ Validierung gegen Start Node Input Schema

2. Agent Node verarbeitet:
   Input: { city: "Berlin" }
   Output: {
     data: "In Berlin ist das Wetter...",
     metadata: { ... }
   }
   ✅ Output Mapping angewendet
   → Weitergegeben: "In Berlin ist das Wetter..."

3. HTTP Node erhält:
   Input: "In Berlin ist das Wetter..."
   ✅ Validierung gegen HTTP Node Input Schema (string)
   ✅ HTTP Request wird gesendet
```

---

## Alternative: Ohne Output Mapping

**Ohne Output Mapping:**
```
Agent → [Transform Node] → HTTP
```
- Zusätzlicher Node nötig
- Mehr Overhead
- Workflow wird komplexer

**Mit Output Mapping:**
```
Agent → HTTP
```
- Einfacher
- Direkt am Node konfigurierbar
- Workflow bleibt übersichtlich

---

## Zusammenfassung

**Input Schema:**
- ✅ Validierung der Eingabe
- ✅ Frühe Fehlererkennung
- ✅ Dokumentation

**Output Schema:**
- ✅ Dokumentation der Ausgabe
- ✅ Warnungen bei Abweichungen
- ✅ Auto-Complete im Expression Editor

**Output Mapping:**
- ✅ Einfache Daten-Transformation
- ✅ Kein zusätzlicher Node nötig
- ✅ Workflow bleibt übersichtlich

