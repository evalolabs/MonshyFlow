# Functions & MCP Integrationen – Developer Guide

Dieser Leitfaden erklärt, wie du im `execution-service` neue **Function-Handler**, **MCP-Handler** und **Web-Search-Handler** hinzufügst, damit Endnutzer sie im Workflow-Builder auswählen können.

> 📚 **Wichtig:** Für Informationen über die Setup-Anleitung, die automatisch im Frontend angezeigt wird, siehe [PROVIDER_SETUP_GUIDE.md](./PROVIDER_SETUP_GUIDE.md).

---

## 1. Function-Handler (Custom Functions)

Function-Handler kapseln einzelne Funktionsaufrufe. Sie landen im Frontend unter dem Tool-Typ **Function**.

### Schritte

1. **Neuen Handler anlegen**  
   - Datei unter `execution-service/src/functions/tools/` erstellen, z. B. `myFunction.ts`.
   - Exportiere ein Objekt vom Typ `FunctionHandler`:
     ```ts
     import type { FunctionHandler } from '../index';

     export const myFunctionHandler: FunctionHandler = {
       name: 'my_function',
       description: 'Beschreibt, was die Funktion macht',
       parameters: { /* JSON Schema */ },
      metadata: {
        requiredSecrets: ['optional_secret'],
        docsUrl: 'https://docs.example.com',
        apiKeyUrl: 'https://example.com/api-keys',  // Optional: Direkter Link zur API Key-Seite
        setupInstructions: '1. Schritt 1\n2. Schritt 2\n3. Schritt 3',  // Optional: Schritt-für-Schritt Anleitung
      },
       async execute(args, context) {
         // Zugriff auf context.secrets, context.workflow, context.node
         return { /* Ergebnis */ };
       },
     };
     ```

2. **Handler registrieren**  
   - Datei `execution-service/src/functions/registerBuiltIns.ts` öffnen.
   - Handler importieren und in `registerBuiltInFunctionHandlers()` registrieren:
     ```ts
     import { myFunctionHandler } from './tools/myFunction';

     export function registerBuiltInFunctionHandlers() {
       registerFunction(myFunctionHandler);
       // ... weitere Handler
     }
     ```

3. **Optional: Tests / Docs**  
   - Beispielaufrufe oder Tests ergänzen.
   - Frontend-Doku aktualisieren, falls notwendig.

### Ergebnis
Nach dem Neustart des `execution-service` erscheint die Funktion automatisch im Workflow-Builder dropdown **Function → Funktionskatalog**. Secret-Anforderungen (`requiredSecrets`) werden im UI angezeigt.

---

## 2. MCP-Handler (Integrationen mit mehreren Tools)

MCP-Handler binden komplette Server/Services an (z. B. Slack, Jira, OpenWeatherMap). Jeder Handler kann mehrere Tools bereitstellen, die der Agent dynamisch nutzt.

### 2.1. Standard MCP-Handler (Custom/Third-Party)

Für eigene oder Third-Party MCP-Server:

1. **Handler-Datei erstellen**  
   - Neuer Ordnerpfad: `execution-service/src/mcp/handlers/`  
   - Beispiel: `slackMcpHandler.ts`
   - Importiere die Typen aus `execution-service/src/mcp/index.ts`:
     ```ts
     import type { McpHandler, McpConnection, McpHandlerContext, McpTool } from '..';
     ```

2. **Connection & Tools implementieren**  
   - Mindestens zwei Bestandteile:
     - `connect(config, context)` → baut eine Verbindung auf (z. B. REST-Client, SDK).
     - Eine Klasse, die `McpConnection` implementiert (`listTools()`, `invoke()`).
   - Beispielstruktur:
     ```ts
     class SlackConnection implements McpConnection {
       constructor(private readonly token: string) {}

       async listTools(): Promise<McpTool[]> {
         return [
           {
             name: 'postMessage',
             description: 'Sendet eine Nachricht in einen Channel',
             parameters: z.object({
               channel: z.string(),
               text: z.string(),
             }),
           },
         ];
       }

       async invoke(toolName: string, args: Record<string, any>) {
         // HTTP-Call oder SDK-Aufruf
       }
     }

     export const slackMcpHandler: McpHandler = {
       id: 'slack',
       name: 'Slack Workspace',
       description: 'Nachrichten senden, Channels durchsuchen …',
       metadata: {
         requiredSecrets: ['slack_bot_token'],
         docsUrl: 'https://api.slack.com',
       },
       defaultConfig: {
         requireApproval: 'never', // Automatische Tool-Ausführung
       },
       async connect(config, context) {
         const token = context.secrets.slack_bot_token;
         if (!token) throw new Error('Secret "slack_bot_token" fehlt.');
         return new SlackConnection(token);
       },
     };
     ```

3. **Handler registrieren**  
   - Datei `execution-service/src/mcp/registerBuiltIns.ts` öffnen.
   - Handler importieren und in `registerBuiltInMcpHandlers()` eintragen:
     ```ts
     import { slackMcpHandler } from './handlers/slackMcpHandler';

     export function registerBuiltInMcpHandlers() {
       registerMcpHandler(genericMcpHandler);
       registerMcpHandler(openWeatherMcpHandler);
       registerMcpHandler(slackMcpHandler);
     }
     ```

4. **Secrets & Defaults definieren**  
   - `metadata.requiredSecrets` → UI zeigt fehlende Secrets an.
   - `defaultConfig.requireApproval` → `'never'` für automatische Tool-Ausführung (empfohlen).

### 2.2. OpenAI MCP Connectors (hostedMcpTool)

Für OpenAI-hosted Connectors (Gmail, Google Calendar, Outlook, etc.) verwenden wir `hostedMcpTool` aus `@openai/agents`. Diese Connectors werden automatisch von OpenAI verwaltet.

**Wichtig:** Für OpenAI Connectors wird `hostedMcpTool` direkt verwendet, **nicht** `handler.connect()`!

1. **Handler-Datei erstellen** (nur Metadaten)
   - Beispiel: `gmailMcpHandler.ts`
   - **Keine `connect()` Implementierung nötig** - wird automatisch von `hostedMcpTool` gehandhabt:
     ```ts
     import type { McpHandler } from '..';

     export const gmailMcpHandler: McpHandler = {
       id: 'openai-gmail',
       name: 'Gmail (OpenAI Connector)',
       description: 'Gmail Integration via OpenAI hosted MCP connector',
       metadata: {
         requiredSecrets: ['google_oauth_token'],
         docsUrl: 'https://platform.openai.com/docs/guides/mcp',
       },
       defaultConfig: {
         requireApproval: 'never', // Wird automatisch auf 'never' gesetzt
       },
       // connect() wird NICHT implementiert - hostedMcpTool übernimmt
       async connect() {
         throw new Error('Gmail handler uses hostedMcpTool - connection is handled automatically');
       },
     };
     ```

2. **Handler registrieren**
   - In `execution-service/src/mcp/registerBuiltIns.ts` registrieren:
     ```ts
     import { gmailMcpHandler } from './handlers/gmailMcpHandler';

     export function registerBuiltInMcpHandlers() {
       registerMcpHandler(gmailMcpHandler);
       // ...
     }
     ```

3. **Tool Creator erkennt OpenAI Connectors automatisch**
   - Der Tool Creator in `execution-service/src/tools/registerBuiltIns.ts` erkennt OpenAI Connectors automatisch
   - Verwendet `hostedMcpTool` mit korrektem `connectorId`, `serverLabel`, `authorization` (OAuth Token) und `allowedTools`
   - `requireApproval` wird automatisch auf `'never'` gesetzt (unabhängig von Node-Konfiguration)

**Verfügbare OpenAI Connectors:**
- `openai-gmail` → `connector_gmail`
- `openai-google-calendar` → `connector_google_calendar`
- `openai-google-drive` → `connector_google_drive`
- `openai-outlook-email` → `connector_outlook_email`
- `openai-outlook-calendar` → `connector_outlook_calendar`
- `openai-sharepoint` → `connector_sharepoint`
- `openai-teams` → `connector_teams`
- `openai-dropbox` → `connector_dropbox`

**OAuth Token Secrets:**
- Google Services: `google_oauth_token` oder `GOOGLE_OAUTH_TOKEN`
- Microsoft Services: `microsoft_oauth_token` oder `MICROSOFT_OAUTH_TOKEN`
- Dropbox: `dropbox_oauth_token` oder `DROPBOX_OAUTH_TOKEN`

### Ergebnis
Nach Deployment erscheinen neue Integrationen im MCP-Dropdown des Workflow-Builder-Panels. Nutzer sehen Doku-Links, benötigte Secrets und können die Tools sofort nutzen. OpenAI Connectors werden automatisch mit `hostedMcpTool` integriert und benötigen keine manuelle `connect()` Implementierung.

---

## 3. Web-Search-Handler (Serper, Custom, Auto)

Web-Search-Handler kapseln externe Suchanbieter. Jeder Handler liefert exakt einen Such-Endpunkt, den Agenten-Tools und Web-Search-Nodes verwenden.

### Schritte

1. **Interfaces & Registry verwenden**  
   - Dateien liegen unter `execution-service/src/webSearch/`.  
   - Neue Handler unter `execution-service/src/webSearch/handlers/` anlegen und `WebSearchHandler` implementieren:
     ```ts
     import type { WebSearchHandler, WebSearchConnection, WebSearchHandlerContext, WebSearchQuery, WebSearchResponse } from '..';

     class TavilyConnection implements WebSearchConnection {
       constructor(private readonly apiKey: string) {}

       async search(query: WebSearchQuery): Promise<WebSearchResponse> {
         // HTTP-Request an Tavily API
         return { query: query.query, results: [] };
       }
     }

     export const tavilyWebSearchHandler: WebSearchHandler = {
       id: 'tavily',
       name: 'Tavily Search',
       description: 'AI-optimierter Web-Suchdienst',
       metadata: { requiredSecrets: ['tavily_api_key'], docsUrl: 'https://docs.tavily.com' },
       async connect(config, context) {
         const apiKey = context.secrets.tavily_api_key;
         if (!apiKey) throw new Error('Secret "tavily_api_key" fehlt.');
         return new TavilyConnection(apiKey);
       },
     };
     ```

2. **Handler registrieren**  
   - Datei `execution-service/src/webSearch/registerBuiltIns.ts` öffnen.
   - Handler importieren und in `registerBuiltInWebSearchHandlers()` registrieren (neben `auto`, `serper`, `custom`).
   - `execution-service/src/index.ts` registriert alle Handler automatisch beim Serverstart und stellt `/api/web-search-handlers` bereit.

3. **Gateway & Frontend**  
   - Der Gateway-Controller (`AgentBuilder.AgentService/Controllers/ExecutionGatewayController.cs`) proxyt `GET /api/execution/web-search-handlers` bereits.  
   - Das Frontend lädt Provider in `webSearchService.ts` und zeigt sie im Web-Search-Panel (`NodeConfigPanel`).

4. **Auto-Provider (Platzhalter)**  
   - `autoWebSearchHandler` ist ein Stub für zukünftige Algorithmen (Kosten-/Verfügbarkeitsbasierte Auswahl per Superadmin-Key).  
   - Entwickler können dort später Superadmin-Credentials & Routing-Logik ergänzen.

### Ergebnis
Nach dem Registrieren steht der Provider im Dropdown „Web Search → Provider" bereit. Secret-Hinweise werden inline angezeigt; der Serper-Handler nutzt z. B. das Secret `serper_api_key`. Custom-Handler akzeptieren konfigurierbare URLs/Headers und interpolieren Secrets (`{{secret:name}}`).

---

## 4. Frontend-Quickcheck

- **Function-Tool:** Dropdown „Funktionskatalog" zeigt neue `name`-Einträge automatisch.
- **MCP-Tool:** Dropdown „Integration" listet alle registrierten `McpHandler` mit `name` & `description`.
- **Web-Search-Tool:** Provider-Dropdown bietet `Auto`, `Serper`, `Custom` (und weitere registrierte Einträge). Fehlende Secrets werden hervorgehoben.

---

## 5. Tipps & Best Practices

- **Namenskonventionen:** Verwende kebab-case oder snake_case für Handler-IDs (`slack`, `google-drive`, `serper`).
- **Logging:** Füge hilfreiche Logs (nicht nur Fehler) hinzu, damit der Execution-Service bei Problemen diagnosierbar bleibt.
- **Timeouts & Fehlertexte:** Gib klare Fehlermeldungen zurück (`Secret fehlt`, `API 401`, etc.), damit das UI Hinweise anzeigen kann.
- **Dokumentation:** Verlinke `metadata.docsUrl` auf interne oder externe How-Tos.
- **Tests:** Für komplexe Integrationen lohnt sich ein Testskript unter `execution-service/` (z. B. `test-slack-mcp.ts` oder `test-serper-web-search.ts`).
- **OpenAI Connectors:** Verwende `hostedMcpTool` für OpenAI-hosted Connectors - keine manuelle `connect()` Implementierung nötig!

---

Mit dieser Struktur können wir beliebig viele Functions, MCPs und Web-Search-Integrationen aufnehmen – Endnutzer wählen sie nur noch aus, Entwickler haben einen klaren Pfad für neue Erweiterungen.
