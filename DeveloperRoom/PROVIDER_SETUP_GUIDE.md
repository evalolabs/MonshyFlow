# Provider Setup Guide - Entwickler-Dokumentation

## Übersicht

Wenn Entwickler neue Functions, MCP Handler oder Web Search Handler erstellen, können sie Metadaten bereitstellen, die automatisch als Setup-Anleitung im Frontend angezeigt werden. Dies hilft Benutzern dabei, die notwendigen API Keys zu erhalten und zu konfigurieren.

## Verfügbare Metadaten-Felder

Jeder Handler kann folgende Metadaten-Felder bereitstellen:

```typescript
metadata: {
  requiredSecrets?: string[];      // Liste der benötigten Secret-Namen
  docsUrl?: string;                 // Link zur vollständigen Dokumentation
  apiKeyUrl?: string;               // Direkter Link zur API Key-Seite
  setupInstructions?: string;       // Schritt-für-Schritt Anleitung (mehrzeilig)
}
```

## Beispiele

### Function Handler

```typescript
// execution-service/src/functions/tools/myFunction.ts
import type { FunctionHandler } from '../index';

export const myFunctionHandler: FunctionHandler = {
    name: 'my_custom_function',
    description: 'Eine benutzerdefinierte Funktion',
    parameters: {
        type: 'object',
        properties: {
            // ... Parameter-Definition
        },
    },
    metadata: {
        requiredSecrets: ['my_api_key', 'my_secret_token'],
        docsUrl: 'https://docs.example.com',
        apiKeyUrl: 'https://example.com/api-keys',
        setupInstructions: `1. Erstelle einen Account auf example.com
2. Navigiere zu den API-Einstellungen
3. Generiere einen neuen API Key
4. Kopiere den Key und füge ihn als Secret "my_api_key" hinzu
5. Optional: Füge auch "my_secret_token" hinzu für erweiterte Features`,
    },
    async execute(args, context) {
        const apiKey = context.secrets.my_api_key;
        if (!apiKey) {
            throw new Error('Secret "my_api_key" fehlt');
        }
        // ... Funktions-Logik
    },
};
```

### MCP Handler

```typescript
// execution-service/src/mcp/handlers/myMcpHandler.ts
import type { McpHandler } from '..';

export const myMcpHandler: McpHandler = {
    id: 'my-mcp',
    name: 'My MCP Integration',
    description: 'Eine benutzerdefinierte MCP Integration',
    metadata: {
        requiredSecrets: ['mcp_api_key'],
        docsUrl: 'https://docs.mcp.example.com',
        apiKeyUrl: 'https://mcp.example.com/settings/api-keys',
        setupInstructions: '1. Logge dich in dein MCP-Konto ein\n2. Erstelle einen neuen API Key\n3. Füge den Key als Secret "mcp_api_key" hinzu',
    },
    defaultConfig: {
        // ... Standard-Konfiguration
    },
    async connect(config, context) {
        const apiKey = context.secrets.mcp_api_key;
        if (!apiKey) {
            throw new Error('Secret "mcp_api_key" fehlt');
        }
        // ... Verbindungs-Logik
    },
};
```

### Web Search Handler

```typescript
// execution-service/src/webSearch/handlers/myWebSearchHandler.ts
import type { WebSearchHandler } from '..';

export const myWebSearchHandler: WebSearchHandler = {
    id: 'my-search',
    name: 'My Search Provider',
    description: 'Ein benutzerdefinierter Web-Search Provider',
    metadata: {
        requiredSecrets: ['search_api_key'],
        docsUrl: 'https://docs.search.example.com',
        apiKeyUrl: 'https://search.example.com/get-api-key',
        setupInstructions: `1. Besuche search.example.com
2. Registriere dich für einen kostenlosen Account
3. Navigiere zu "API Keys" im Dashboard
4. Kopiere deinen API Key
5. Füge ihn als Secret "search_api_key" hinzu`,
    },
    defaultConfig: {
        maxResults: 10,
    },
    async connect(config, context) {
        const apiKey = context.secrets.search_api_key;
        if (!apiKey) {
            throw new Error('Secret "search_api_key" fehlt');
        }
        // ... Verbindungs-Logik
    },
};
```

## Frontend-Anzeige

Die `ProviderSetupGuide` Komponente zeigt automatisch:

1. **Benötigte Secrets**: Liste aller benötigten Secret-Namen
2. **API Key erhalten**: Direkter Link zur API Key-Seite (falls `apiKeyUrl` gesetzt)
3. **Anleitung**: Schritt-für-Schritt Anleitung (falls `setupInstructions` gesetzt)
4. **Dokumentation**: Link zur vollständigen Dokumentation (falls `docsUrl` gesetzt)
5. **Tipp**: Hinweis, dass Secrets im Secrets-Bereich angelegt werden müssen

Die Anleitung wird nur angezeigt, wenn:
- Ein Handler/Function aus dem Dropdown ausgewählt wurde
- Mindestens eines der Metadaten-Felder gesetzt ist

## Best Practices

1. **`requiredSecrets`**: Liste alle Secrets auf, die der Handler benötigt. Verwende konsistente Namen (z.B. `snake_case`).

2. **`apiKeyUrl`**: Biete einen direkten Link zur Seite an, wo Benutzer ihren API Key erstellen können.

3. **`setupInstructions`**: 
   - Verwende mehrzeilige Strings mit `\n` für Zeilenumbrüche
   - Nummeriere die Schritte (1., 2., 3., ...)
   - Sei präzise und klar
   - Erwähne den exakten Secret-Namen, der verwendet werden soll

4. **`docsUrl`**: Link zur vollständigen API-Dokumentation für fortgeschrittene Benutzer.

## Registrierung

Nach dem Erstellen eines neuen Handlers, registriere ihn in der entsprechenden `registerBuiltIns.ts` Datei:

- Functions: `execution-service/src/functions/registerBuiltIns.ts`
- MCP Handlers: `execution-service/src/mcp/registerBuiltIns.ts`
- Web Search Handlers: `execution-service/src/webSearch/registerBuiltIns.ts`

## Beispiel: GraphHopper Distance Function

Siehe `execution-service/src/functions/tools/graphhopperDistance.ts` für ein vollständiges Beispiel mit allen Metadaten-Feldern.

