# Tool Implementation Checklist

Diese Checkliste dokumentiert den Status aller Tool-Typen, die noch angepasst oder implementiert werden müssen.

## ✅ Abgeschlossen

- [x] **tool-mcp-server** - MCP Server Tools
  - ✅ Implementiert in `packages/execution-service/src/tools/registerBuiltIns.ts`
  - ✅ Unterstützt OpenAI Connectors und Custom MCP Servers
  - ✅ UI-Konfiguration in `NodeConfigPanel.tsx`
  - ✅ Output Mapping entfernt (Tools geben Daten direkt an Agent zurück)

- [x] **tool-function** - Function Tools
  - ✅ Implementiert in `packages/execution-service/src/services/executionService.ts`
  - ✅ Unterstützt Function Catalog und externe Endpoints
  - ✅ UI-Konfiguration in `NodeConfigPanel.tsx`
  - ✅ Output Mapping entfernt (Tools geben Daten direkt an Agent zurück)

## ✅ Abgeschlossen (Fortsetzung)

- [x] **tool-web-search** - Web Search Tool
  - ✅ Vollständige Implementierung in `packages/execution-service/src/tools/registerBuiltIns.ts`
  - ✅ Unterstützt verschiedene Web Search Handler (Serper, Custom, Auto)
  - ✅ Verbesserte Tool-Beschreibung für bessere Agent-Erkennung
  - ✅ Vollständige Fehlerbehandlung mit try-catch-finally
  - ✅ Connection Cleanup (dispose) nach jeder Suche
  - ✅ Provider Override Support (providerId Parameter)
  - ✅ Parameter-Validierung und -Beschreibungen
  - ✅ Unterstützung für maxResults, location, allowedDomains
  - ✅ Fallback auf 'serper' wenn Handler nicht gefunden

## ✅ Abgeschlossen (Fortsetzung)

- [x] **tool-file-search** - File Search Tool
  - ✅ Vollständige Implementierung mit OpenAI's `fileSearchTool`
  - ✅ Unterstützt Vector Store IDs (komma-separiert oder Array)
  - ✅ Max Results Konfiguration (1-100, Standard: 20)
  - ✅ Vollständige Fehlerbehandlung
  - ✅ UI-Konfiguration mit Vector Store IDs und Max Results Feldern
  - ✅ Validierung: Mindestens eine Vector Store ID erforderlich
  - 📍 **Datei:** `packages/execution-service/src/tools/registerBuiltIns.ts`

- [x] **tool-code-interpreter** - Code Interpreter Tool
  - ✅ Vollständige Implementierung mit OpenAI's `codeInterpreterTool`
  - ✅ Python Code Execution in OpenAI's sicherer Sandbox-Umgebung
  - ✅ Automatische Datei-Integration (über Files-API)
  - ✅ UI-Konfiguration vorhanden
  - 📍 **Datei:** `packages/execution-service/src/tools/registerBuiltIns.ts`

- [ ] **tool-client** - Client Tool (ChatKit)
  - ⚠️ **Status:** Stub-Implementierung (nur Warnung)
  - 📍 **Datei:** `packages/execution-service/src/tools/registerBuiltIns.ts` (Zeile 283-307)
  - **Zu implementieren:**
    - [ ] ChatKit Integration
    - [ ] Client-seitige Tool-Hooks
    - [ ] Action/Data-Handling
    - [ ] UI-Konfiguration überprüfen/anpassen

- [ ] **tool-custom** - Custom Tool
  - ⚠️ **Status:** Stub-Implementierung (nur Warnung)
  - 📍 **Datei:** `packages/execution-service/src/tools/registerBuiltIns.ts` (Zeile 310-332)
  - **Zu implementieren:**
    - [ ] Custom Tool Execution Logic
    - [ ] Payload-Handling
    - [ ] Erweiterte Konfiguration
    - [ ] UI-Konfiguration überprüfen/anpassen

## 📋 Allgemeine Aufgaben für alle Tools

- [x] Output Mapping entfernt (Tools geben Daten direkt an Agent zurück)
- [ ] **Für alle Tools prüfen:**
  - [ ] Sind die Tool-Beschreibungen klar und hilfreich für den Agent?
  - [ ] Werden alle Parameter korrekt validiert?
  - [ ] Ist die Fehlerbehandlung ausreichend?
  - [ ] Sind die Tool-Namen eindeutig und beschreibend?
  - [ ] Funktioniert die Tool-Registrierung korrekt?

## 🔍 Weitere Tool-Typen (im Output Format Dropdown, aber nicht als Tool-Typ implementiert)

Diese erscheinen im Agent Node "Output Format" Dropdown, sind aber möglicherweise keine separaten Tool-Typen:

- [ ] **image-generation** - Image Generation
  - 📍 **Erwähnt in:** `NodeConfigPanel.tsx` (Output Format Dropdown)
  - **Status:** Unklar, ob als Tool implementiert werden soll

- [ ] **dev-environment** - Dev Environment
  - 📍 **Erwähnt in:** `NodeConfigPanel.tsx` (Output Format Dropdown)
  - **Status:** Unklar, ob als Tool implementiert werden soll

## 📝 Notizen

- Alle Tools verwenden jetzt das ToolCreator-System in `packages/execution-service/src/tools/registerBuiltIns.ts`
- Tools werden in `executionService.ts` über `buildToolsForAgent` registriert
- Die Legacy-Implementierung in `executionService.ts` (switch case) wird als Fallback verwendet, wenn ToolCreator `null` zurückgibt
- Tools sind nicht mehr in `registry.json` (werden manuell in `nodeRegistry.ts` behandelt)

## 🎯 Prioritäten

1. **Abgeschlossen:** 
   - ✅ tool-web-search
   - ✅ tool-file-search
   - ✅ tool-code-interpreter
2. **Mittel:** tool-client, tool-custom (spezielle Use Cases)

## 🧪 Testanleitung für tool-web-search

### Voraussetzungen
- Web Search Handler konfiguriert (z.B. Serper API Key als Secret)
- Workflow Editor geöffnet

### Test-Schritte

1. **Workflow erstellen/öffnen**
   - Neuen Workflow erstellen oder bestehenden öffnen

2. **Agent Node hinzufügen**
   - Aus dem Node-Selector "Agent" auswählen
   - Agent konfigurieren:
     - Agent Name: z.B. "Test Agent"
     - Model: z.B. "gpt-4o"
     - Instructions: z.B. "Du bist ein hilfreicher Assistent, der Web-Suchen durchführen kann."

3. **Web Search Tool Node hinzufügen**
   - Im **Tools Tab** "Web Search Tool" auswählen
   - Tool Node erscheint auf dem Canvas
   - Tool konfigurieren (optional):
     - Web Search Handler: z.B. "serper"
     - Query: z.B. "current weather" (kann auch beim Aufruf übergeben werden)

4. **Tool mit Agent verbinden**
   - Vom **Web Search Tool Node** eine Verbindung zum **Agent Node** ziehen
   - Die Verbindung sollte am **unteren "Tool" Handle** des Agent Nodes enden

5. **Start Node konfigurieren**
   - Start Node öffnen
   - Entry Type: "Manual" wählen
   - User Prompt Feld: z.B. "Was ist das aktuelle Wetter in Berlin?"

6. **Testen im Debug Panel**
   - Debug Panel öffnen (rechts)
   - Auf **"Play"** beim Start Node klicken
   - Der Agent sollte:
     - Die User-Anfrage erhalten
     - Das Web Search Tool erkennen und aufrufen
     - Die Suchergebnisse verarbeiten
     - Eine Antwort mit den Suchergebnissen zurückgeben

### Erwartetes Ergebnis

Der Agent sollte:
- ✅ Das Web Search Tool automatisch erkennen und verwenden
- ✅ Eine Suchanfrage durchführen
- ✅ Die Suchergebnisse in seiner Antwort verwenden
- ✅ Eine hilfreiche Antwort mit aktuellen Informationen geben

### Fehlerbehandlung testen

1. **Ohne API Key:**
   - Secret entfernen
   - Tool sollte eine klare Fehlermeldung zurückgeben

2. **Ohne Query:**
   - Query-Parameter nicht übergeben
   - Tool sollte eine Fehlermeldung zurückgeben

3. **Ungültiger Provider:**
   - `providerId: "invalid-provider"` übergeben
   - Tool sollte auf 'serper' zurückfallen

### Debug-Tipps

- **Console Logs prüfen:** Backend-Logs zeigen Connection-Status und Fehler
- **Tool Output prüfen:** Im Debug Panel die Tool-Ausgabe ansehen
- **Agent Trace:** Im Agent Output den `trace` ansehen, um Tool-Aufrufe zu sehen

## 🧪 Testanleitung für tool-file-search

### Voraussetzungen

- OpenAI API Key als Secret konfiguriert (z.B. `OPENAI_API_KEY`)
- Workflow Editor geöffnet
- **Keine manuellen Schritte nötig!** Alles wird automatisch im Workflow erledigt.

### Test-Schritte

1. **Workflow erstellen/öffnen**
   - Neuen Workflow erstellen oder bestehenden öffnen

2. **Agent Node hinzufügen**
   - Aus dem Node-Selector "Agent" auswählen
   - Agent konfigurieren:
     - Agent Name: z.B. "File Search Agent"
     - Model: z.B. "gpt-4o" oder "gpt-4-turbo"
     - Instructions: z.B. "Du bist ein Assistent, der Informationen aus hochgeladenen Dateien abrufen kann. Nutze das File Search Tool, wenn du Fragen zu den Dateien beantworten musst."

3. **File Search Tool Node hinzufügen**
   - Im **Tools Tab** "File Search Tool" auswählen
   - Tool Node erscheint auf dem Canvas
   - Tool konfigurieren:
     - **Vector Store & Files:** 
       - Klicke auf die Drag & Drop-Fläche oder den Upload-Button
       - Wähle Dateien aus (z.B. PDF, TXT, DOCX, MD)
       - **Ein Vector Store wird automatisch erstellt!**
       - Die hochgeladenen Dateien werden automatisch zum Vector Store hinzugefügt
       - Die Vector Store ID wird automatisch gespeichert
     - **Max Results:** z.B. `20` (Standard: 20, Max: 100)
     - **Display Name:** z.B. "Document Search"
     - **Beschreibung:** z.B. "Zugriff auf Dokumente und Dateien"

4. **Tool mit Agent verbinden**
   - Vom **File Search Tool Node** eine Verbindung zum **Agent Node** ziehen
   - Die Verbindung sollte am **unteren "Tool" Handle** des Agent Nodes enden

5. **Start Node konfigurieren**
   - Start Node öffnen
   - Entry Type: "Manual" wählen
   - User Prompt Feld: z.B. "Was steht in den Dokumenten über das Projekt X?" oder "Finde Informationen über [Thema] in den hochgeladenen Dateien"

6. **Testen im Debug Panel**
   - Debug Panel öffnen (rechts)
   - Auf **"Play"** beim Start Node klicken
   - Der Agent sollte:
     - Die User-Anfrage erhalten
     - Das File Search Tool erkennen und aufrufen
     - Die Vector Store durchsuchen
     - Die relevanten Dokumente/Dateien finden
     - Eine Antwort mit den gefundenen Informationen zurückgeben

### Erwartetes Ergebnis

Der Agent sollte:
- ✅ Das File Search Tool automatisch erkennen und verwenden
- ✅ Die Vector Store durchsuchen
- ✅ Relevante Dokumente/Dateien finden
- ✅ Die gefundenen Informationen in seiner Antwort verwenden
- ✅ Eine hilfreiche Antwort mit Zitaten aus den Dokumenten geben

### Fehlerbehandlung testen

1. **Ohne Dateien hochgeladen:**
   - Keine Dateien hochladen
   - Tool sollte eine Fehlermeldung zurückgeben: "File Search Tool requires at least one vector store ID. Please upload files to create a vector store in the node settings."

2. **Ohne OpenAI API Key:**
   - Secret entfernen
   - Beim Upload sollte eine Fehlermeldung erscheinen

3. **Leerer Vector Store:**
   - Alle Dateien aus dem Vector Store entfernen
   - Tool sollte keine Ergebnisse zurückgeben (aber keinen Fehler)

4. **Ungültige Dateiformate:**
   - Nicht unterstützte Dateiformate hochladen
   - OpenAI sollte eine entsprechende Fehlermeldung zurückgeben

### Debug-Tipps

- **Console Logs prüfen:** Backend-Logs zeigen Vector Store IDs und Fehler
- **Tool Output prüfen:** Im Debug Panel die Tool-Ausgabe ansehen (sollte relevante Dokumente enthalten)
- **Agent Trace:** Im Agent Output den `trace` ansehen, um Tool-Aufrufe zu sehen
- **Vector Store Status:** Prüfe auf https://platform.openai.com/storage/files, ob der Vector Store existiert und Dateien enthält
- **Max Results:** Wenn zu viele/zu wenige Ergebnisse, `maxResults` anpassen (1-100)

