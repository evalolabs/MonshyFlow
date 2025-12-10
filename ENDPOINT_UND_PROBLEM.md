# Endpoint und Problem - Detaillierte Analyse

## Endpoint-Details

### Route
```
POST /api/workflows/:workflowId/nodes/:nodeId/test-with-context
```

### Datei
`packages/api-service/src/routes/index.ts` (Zeile 63-158)

### Vollständiger Code
```typescript
app.post('/api/workflows/:workflowId/nodes/:nodeId/test-with-context', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { workflowId, nodeId } = req.params;
    const user = (req as any).user;
    
    // CRITICAL: Log req.body IMMEDIATELY to see if it's empty
    process.stderr.write(`\n🔴🔴🔴 TEST-WITH-CONTEXT - req.body check\n`);
    process.stderr.write(`🔴 req.body exists: ${!!req.body}\n`);
    process.stderr.write(`🔴 req.body type: ${typeof req.body}\n`);
    process.stderr.write(`🔴 req.body keys: ${req.body ? Object.keys(req.body).join(', ') : 'NO_BODY'}\n`);
    process.stderr.write(`🔴 req.body content: ${JSON.stringify(req.body || {}).substring(0, 300)}\n`);
    process.stderr.write(`🔴 req.headers['content-type']: ${req.headers['content-type']}\n`);
    process.stderr.write(`🔴 req.headers['content-length']: ${req.headers['content-length']}\n\n`);
    
    // Get workflow from database
    const workflowService = container.resolve('WorkflowService') as any;
    const workflowData = await workflowService.getById(workflowId);
    
    if (!workflowData) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    
    const workflow = workflowData.toObject ? workflowData.toObject() : workflowData;
    
    // Load secrets...
    let secrets: Record<string, string> = {};
    // ... (secrets loading code)
    
    // Prepare request body for execution-service
    // Frontend sends input data directly as req.body (e.g., { userPrompt: "..." })
    // Use req.body directly as input (not req.body.input)
    const inputData = req.body || {};
    
    logger.info({ 
      workflowId, 
      nodeId,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      bodySample: JSON.stringify(req.body).substring(0, 500),
      inputKeys: Object.keys(inputData),
      inputSample: JSON.stringify(inputData).substring(0, 200)
    }, '📥 Received test-node-with-context request - using req.body directly as input');
    
    const executionRequestBody = {
      workflow: {
        ...workflow,
        nodes: workflow.nodes || [],
        edges: workflow.edges || [],
      },
      nodeId,
      input: inputData, // ← PROBLEM: inputData ist {} statt { userPrompt: "..." }
      secrets: secrets,
    };
    
    // Forward to execution-service
    const executionServiceUrl = config.services.execution.url;
    const response = await axios.post(
      `${executionServiceUrl}/api/execute/test-node-with-context`,
      executionRequestBody,
      {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    res.json({ success: true, data: response.data });
  } catch (error: any) {
    // Error handling...
  }
});
```

## Request Flow

### 1. Frontend (Browser)
```
POST http://localhost:5000/api/workflows/.../test-with-context
Headers:
  Content-Type: application/json
  Authorization: Bearer ...
Body:
  { "userPrompt": "was ist ein Gin" }
```

### 2. Kong Gateway (Port 5000)
- Empfängt Request von Frontend
- Routet zu `api-service:80` (intern)
- **MÖGLICHES PROBLEM**: Kong könnte den Request Body entfernen oder modifizieren

### 3. API-Service (Port 80, intern)
- Empfängt Request von Kong
- `express.json()` Middleware sollte `req.body` parsen
- **PROBLEM**: `req.body` ist `{}` (leer) statt `{ userPrompt: "..." }`

### 4. Execution-Service
- Empfängt `{ workflow, nodeId, input: {}, secrets }`
- **PROBLEM**: `input` ist leer → Validierungsfehler

## Beobachtungen

### ✅ Was funktioniert
- Frontend sendet korrekt: Browser Network Tab zeigt `{userPrompt: "was ist ein Gin"}`
- Request kommt an: API-Service Logs zeigen `POST /api/workflows/.../test-with-context` (200 OK)
- Route wird ausgeführt: Request ist erfolgreich

### ❌ Was nicht funktioniert
- `req.body` ist leer: `{}` statt `{ userPrompt: "..." }`
- Debug-Logs erscheinen nicht: `process.stderr.write` und `logger.info` Ausgaben fehlen
- Input-Daten gehen verloren: Zwischen Frontend und API-Service

## Mögliche Ursachen

### 1. Kong Gateway entfernt Request Body
**Wahrscheinlichkeit: HOCH**
- Kong könnte den Request Body aus Sicherheitsgründen entfernen
- Kong-Konfiguration könnte Body-Parsing deaktivieren
- Kong Plugin könnte den Body modifizieren

**Lösung**: Kong-Konfiguration prüfen, Body-Parsing aktivieren

### 2. Body-Parser Problem
**Wahrscheinlichkeit: MITTEL**
- `express.json()` Middleware wird nicht ausgeführt
- Middleware-Reihenfolge ist falsch
- Content-Type Header wird nicht erkannt

**Lösung**: Middleware-Reihenfolge prüfen, Body-Parser explizit aktivieren

### 3. Request-Interceptor Problem
**Wahrscheinlichkeit: NIEDRIG**
- Frontend Request-Interceptor modifiziert Body
- Axios-Konfiguration ist falsch

**Lösung**: Frontend Request-Interceptor prüfen

## Debugging-Schritte

### 1. Kong Gateway Logs prüfen
```bash
docker-compose logs kong --tail 50
```

### 2. Direkt an API-Service testen (ohne Kong)
```bash
# API-Service ist intern auf Port 80
# Test mit curl direkt an Container
docker exec monshyflow-api-service curl -X POST http://localhost:80/api/workflows/.../test-with-context \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ..." \
  -d '{"userPrompt":"test"}'
```

### 3. Kong-Konfiguration prüfen
- Prüfen, ob Kong den Request Body durchlässt
- Prüfen, ob Plugins den Body modifizieren

### 4. Body-Parser explizit testen
- Middleware vor Route hinzufügen, die `req.body` loggt
- Prüfen, ob `express.json()` ausgeführt wird

## Nächste Schritte

1. **Kong Gateway Logs prüfen**: Sehen, ob Kong den Body entfernt
2. **Direkt an API-Service testen**: Umgehen von Kong, um zu sehen, ob das Problem bei Kong liegt
3. **Body-Parser explizit aktivieren**: Sicherstellen, dass `express.json()` ausgeführt wird
4. **Request-Interceptor prüfen**: Frontend-Code prüfen, ob Body modifiziert wird

## Relevante Dateien

- `packages/api-service/src/routes/index.ts` (Zeile 63-158) - Endpoint
- `packages/api-service/src/index.ts` (Zeile 23) - Body-Parser Konfiguration
- `kong/kong.yml` - Kong Gateway Konfiguration
- `frontend/src/services/workflowService.ts` (Zeile 233-236) - Frontend Request

