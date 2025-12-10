# Problem: Start Node Input-Daten werden nicht korrekt weitergegeben

## Problembeschreibung

Beim Testen des Start Nodes mit Input-Daten (z.B. `{ "userPrompt": "was ist ein Gin" }`) werden die Daten nicht korrekt an den `execution-service` weitergegeben. Der Start Node erhält `input: {}` (leer) statt der tatsächlichen Input-Daten, was zu einem Validierungsfehler führt:

```
Input validation failed: root: must have required property 'userPrompt'
```

## Erwartetes Verhalten

1. **Frontend**: Benutzer gibt Input-Daten im "Test Input: Start" Modal ein: `{ "userPrompt": "was ist ein Gin" }`
2. **Frontend → API-Service**: Frontend sendet die Daten direkt als Request Body:
   ```javascript
   api.post(`/api/workflows/${workflowId}/nodes/${nodeId}/test-with-context`, input)
   // input = { userPrompt: "was ist ein Gin" }
   ```
3. **API-Service → Execution-Service**: API-Service extrahiert die Input-Daten aus `req.body` und sendet sie an den execution-service:
   ```javascript
   {
     workflow: {...},
     nodeId: "start-...",
     input: { userPrompt: "was ist ein Gin" },  // ← Sollte die Input-Daten enthalten
     secrets: {...}
   }
   ```
4. **Execution-Service**: Start Node verarbeitet die Input-Daten und gibt sie als `output.json` zurück

## Tatsächliches Verhalten

1. ✅ **Frontend sendet korrekt**: Browser-Konsole zeigt:
   ```javascript
   [workflowService.testNode] 🔵 Sending test request: {
     workflowId: '6939799420ef6cd4a637b856',
     nodeId: 'start-1765374356726',
     input: {userPrompt: "was ist ein Gin"},  // ← Daten sind vorhanden
     inputKeys: ['userPrompt'],
     inputString: '{"userPrompt":"was ist ein Gin"}'
   }
   ```

2. ❌ **API-Service empfängt leer**: Der `execution-service` erhält:
   ```javascript
   {
     workflow: {...},
     nodeId: "start-...",
     input: {},  // ← LEER! Sollte { userPrompt: "..." } sein
     secrets: {...}
   }
   ```

3. ❌ **Execution-Service validiert fehl**: Da `input` leer ist, schlägt die Schema-Validierung fehl:
   ```
   Input validation failed: root: must have required property 'userPrompt'
   ```

4. ❌ **Output ist null**: Start Node gibt zurück:
   ```json
   {
     "json": null,
     "error": {
       "message": "Input validation failed: root: must have required property 'userPrompt'",
       "code": "VALIDATION_ERROR"
     }
   }
   ```

## Technischer Kontext

### Frontend (React/TypeScript)
- **Datei**: `frontend/src/services/workflowService.ts`
- **Methode**: `testNode(workflowId, nodeId, input)`
- **Code**:
  ```typescript
  async testNode(workflowId: string, nodeId: string, input?: any): Promise<any> {
    const response = await api.post(
      `/api/workflows/${workflowId}/nodes/${nodeId}/test-with-context`, 
      input || {}
    );
    return response.data;
  }
  ```
- **Status**: ✅ Sendet korrekt `{ userPrompt: "..." }` als Request Body

### API-Service (Node.js/Express)
- **Datei**: `packages/api-service/src/routes/index.ts`
- **Route**: `POST /api/workflows/:workflowId/nodes/:nodeId/test-with-context`
- **Aktueller Code** (vereinfacht):
  ```typescript
  app.post('/api/workflows/:workflowId/nodes/:nodeId/test-with-context', authMiddleware, async (req: Request, res: Response) => {
    // ...
    let inputData: any = req.body || {};  // ← Sollte die Input-Daten enthalten
    
    const executionRequestBody = {
      workflow: {...},
      nodeId,
      input: inputData,  // ← Wird als {} weitergegeben statt { userPrompt: "..." }
      secrets: secrets,
    };
    
    const response = await axios.post(
      `${executionServiceUrl}/api/execution/test-node-with-context`,
      executionRequestBody,
      // ...
    );
  });
  ```
- **Problem**: `req.body` ist leer oder wird nicht richtig geparst

### Execution-Service (Node.js)
- **Datei**: `packages/execution-service/src/controllers/executionController.ts`
- **Methode**: `testNodeWithContext`
- **Code**:
  ```typescript
  async testNodeWithContext(req: Request, res: Response): Promise<void> {
    const { workflow, input, nodeId, secrets } = req.body;
    // input ist {} statt { userPrompt: "..." }
    
    const execution: Execution = {
      id: `test-${Date.now()}`,
      workflowId: workflow.id || 'test-workflow',
      status: 'running',
      input: input || {},  // ← Leer!
      // ...
    };
  }
  ```

## Debugging-Versuche

### 1. Logging hinzugefügt
- ✅ Frontend-Logging: Zeigt, dass Daten korrekt gesendet werden
- ❌ Backend-Logging: `process.stdout.write` und `logger.info` Ausgaben erscheinen nicht in Docker-Logs
- **Vermutung**: Logs werden nicht richtig weitergeleitet oder Code wird nicht ausgeführt

### 2. Body-Parser überprüft
- ✅ `express.json({ limit: '10mb' })` ist korrekt konfiguriert in `packages/api-service/src/index.ts`
- ✅ Middleware ist vor der Route registriert

### 3. Input-Extraktion vereinfacht
- **Vorher**: Komplexe Logik mit Checks für `req.body.input`, excluded fields, etc.
- **Jetzt**: Direkt `req.body` als Input verwenden
- **Problem bleibt**: `req.body` scheint leer zu sein

## Mögliche Ursachen

### 1. Body-Parser Problem
- `req.body` wird nicht richtig geparst
- Middleware-Reihenfolge könnte falsch sein
- Content-Type Header könnte fehlen oder falsch sein

### 2. Kong Gateway Problem
- Request geht durch Kong Gateway (Port 5000)
- Kong könnte den Request Body modifizieren oder entfernen
- Kong-Konfiguration könnte problematisch sein

### 3. Axios/Request-Interceptor Problem
- Frontend verwendet `api.post()` (axios instance)
- Request-Interceptor könnte den Body modifizieren
- `Content-Type` Header könnte fehlen

### 4. Route-Reihenfolge Problem
- Route könnte von einer anderen Route abgefangen werden
- Express-Routing könnte falsch sein

## Nächste Schritte zur Problemlösung

1. **Request Body direkt loggen**:
   - Middleware vor der Route hinzufügen, die `req.body` direkt loggt
   - Prüfen, ob `req.body` überhaupt ankommt

2. **Kong Gateway prüfen**:
   - Request direkt an API-Service senden (ohne Kong)
   - Kong-Logs prüfen

3. **Network Tab prüfen**:
   - Browser DevTools → Network Tab
   - Request Details prüfen: Headers, Payload, Response

4. **Direkter Test**:
   - Mit Postman/curl direkt an API-Service senden
   - Prüfen, ob Problem nur im Frontend liegt

## Relevante Dateien

- `frontend/src/services/workflowService.ts` (Zeile 233-236)
- `frontend/src/components/DebugPanel/DebugPanel.tsx` (Zeile 365)
- `packages/api-service/src/routes/index.ts` (Zeile 106-275)
- `packages/api-service/src/index.ts` (Zeile 23 - Body-Parser)
- `packages/execution-service/src/controllers/executionController.ts` (Zeile 68-109)
- `kong/kong.yml` (Gateway-Konfiguration)

## Logs

### Frontend (Browser-Konsole)
```
[workflowService.testNode] 🔵 Sending test request: {
  workflowId: '6939799420ef6cd4a637b856',
  nodeId: 'start-1765374356726',
  input: {userPrompt: "was ist ein Gin"},
  inputKeys: ['userPrompt'],
  inputString: '{"userPrompt":"was ist ein Gin"}'
}
```

### Execution-Service
```
[ExecutionController] 📥 Received test-node-with-context request
   nodeId: start-1765374356726
   input received: {}  // ← LEER!
   input keys: []
```

### API-Service
```
[19:50:29 UTC] INFO: Request completed
   method: "POST"
   path: "/api/workflows/6939799420ef6cd4a637b856/nodes/start-1765374356726/test-with-context"
   statusCode: 200
   duration: "265ms"
```

**Hinweis**: Die hinzugefügten Debug-Logs (`🔴🔴🔴`, `📥`, etc.) erscheinen nicht in den Docker-Logs, obwohl der Code ausgeführt wird (Request ist erfolgreich).

## Zusammenfassung

Das Frontend sendet die Input-Daten korrekt (`{ userPrompt: "..." }`), aber der API-Service empfängt sie nicht (`req.body` ist leer). Die Daten gehen zwischen Frontend und API-Service verloren, vermutlich durch:
- Kong Gateway (modifiziert/entfernt Request Body)
- Body-Parser Problem (parst nicht richtig)
- Request-Interceptor Problem (modifiziert Body)

Die Lösung sollte sicherstellen, dass `req.body` im API-Service die Input-Daten enthält, bevor sie an den execution-service weitergegeben werden.

