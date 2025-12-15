# Animation System - Logs & Problem Tracking

## Test #1 - 2025-01-XX

### Logs:
```
useSequentialNodeAnimation.ts:145 Workflow Structure: {nodes: Array(4), edges: Array(3), executionOrder: Array(4)}
DebugPanel.tsx:314 Play clicked: End (end, id: end-1765711951585)
WorkflowCanvas.tsx:466 Play triggered animation: End (end, id: end-1765711951585)
useSequentialNodeAnimation.ts:380 start-1765711796556 209ms
useSequentialNodeAnimation.ts:463 Pipedrive: Get All Activities 252ms
useSequentialNodeAnimation.ts:380 end-1765711951585 208ms
```

### Workflow Structure:
- **Nodes**: 4 (Start, Pipedrive, Agent, End)
- **Edges**: 3
- **Execution Order**: 4 Nodes

### Problem:
**Agent Node wird übersprungen!**

**Erwartete Animation:**
1. Start ✓ (209ms)
2. Pipedrive: Get All Activities ✓ (252ms)
3. **Agent** ✗ (FEHLT!)
4. End ✓ (208ms)

**Tatsächliche Animation:**
1. Start ✓
2. Pipedrive ✓
3. End ✓

### Analyse:
- Start und End sind Fast Nodes → werden korrekt animiert
- Pipedrive ist Slow Node → wird korrekt animiert (wartet auf node.end)
- **Agent ist Slow Node → wird NICHT animiert!**

### Mögliche Ursachen:
1. **Agent Node erhält kein `node.end` Event** → Animation wartet ewig
2. **Agent Node wird nicht in Execution Order erkannt** → wird übersprungen
3. **Race Condition**: Agent Animation wird gestartet, aber sofort übersprungen
4. **SSE Event Filtering**: Agent Events werden gefiltert/ignoriert

### Status:
🔴 **KRITISCH** - Agent Node wird komplett übersprungen

### Debug-Logs hinzugefügt:
✅ `[moveToNextNode]` - Zeigt, welcher Node als nächstes animiert wird
✅ `[node.start]` - Zeigt alle empfangenen node.start Events
✅ `[node.end]` - Zeigt alle empfangenen node.end Events

### Nächste Schritte:
1. **Test mit neuen Debug-Logs durchführen**
2. Prüfen, ob Agent Node in Execution Order enthalten ist (sollte in `[moveToNextNode]` sichtbar sein)
3. Prüfen, ob Agent `node.start` Event erhält (sollte in `[node.start]` sichtbar sein)
4. Prüfen, ob Agent `node.end` Event erhält (sollte in `[node.end]` sichtbar sein)
5. Prüfen, ob Event-Filtering Agent Events blockiert (sollte in `[node.start]` / `[node.end]` sichtbar sein)

### Erwartete Logs für nächsten Test:
```
[moveToNextNode] Moving to: Start (...), type: start, fast: true, slow: false
[moveToNextNode] Moving to: Pipedrive: Get All Activities (...), type: http-request, fast: false, slow: true
[node.start] Received: Pipedrive: Get All Activities (...)
[node.end] Received: Pipedrive: Get All Activities (...)
[moveToNextNode] Moving to: Agent (...), type: agent, fast: false, slow: true
[node.start] Received: Agent (...)  ← Sollte erscheinen!
[node.end] Received: Agent (...)    ← Sollte erscheinen!
[moveToNextNode] Moving to: End (...), type: end, fast: true, slow: false
```

---

## Test #2 - 2025-01-XX

### Logs:
```
[moveToNextNode] Moving to: Start (...), type: start, fast: true, slow: false, index: 0/4
start-1765711796556 201ms
[moveToNextNode] Moving to: Pipedrive: Get All Activities (...), type: http-request, fast: false, slow: true, index: 1/4
[node.end] Received: Pipedrive: Get All Activities (...), currentAnimatedNodeId: http-request-1765711814581, waitingForEvent: true
Pipedrive: Get All Activities 257ms
[moveToNextNode] Moving to: Agent (agent-1765711826257), type: agent, fast: false, slow: true, index: 2/4
[node.end] Received: Agent (agent-1765711826257), currentAnimatedNodeId: agent-1765711826257, waitingForEvent: false  ← PROBLEM!
[moveToNextNode] Moving to: End (end-1765711951585), type: end, fast: true, slow: false, index: 3/4
end-1765711951585 216ms
```

### Problem:
**Zwei Probleme identifiziert:**

1. **Agent Node wird animiert (sichtbar), aber nicht geloggt**
   - `node.end` kommt an: `currentAnimatedNodeId: agent-1765711826257`
   - **ABER**: `waitingForEvent: false` → Bedingung `nodeId === prev.currentAnimatedNodeId && waitingForEventRef.current` ist nicht erfüllt
   - **Ursache**: `waitingForEventRef.current` wird zu früh auf `false` gesetzt (wahrscheinlich in `moveToNextNode`)

2. **End Node wird geloggt, aber keine Animation sichtbar**
   - End wird geloggt: `end-1765711951585 216ms`
   - **ABER**: Animation ist nicht sichtbar
   - **Ursache**: Animation wird zu schnell beendet (wahrscheinlich durch `moveToNextNode` Aufruf, der `currentIndex >= executionOrder.length` erkennt)

### Analyse:
**Agent Problem:**
- `moveToNextNode` wird aufgerufen → setzt `waitingForEventRef.current = false` (für nächsten Node)
- `node.end` für Agent kommt später an → findet `waitingForEvent: false` → Log wird nicht ausgeführt
- **Race Condition**: `moveToNextNode` wird aufgerufen, bevor `node.end` für Agent verarbeitet wird

**End Problem:**
- End ist Fast Node → Timeout läuft ab (216ms)
- Log wird ausgegeben
- **ABER**: `moveToNextNode` wird aufgerufen → erkennt `currentIndex >= executionOrder.length` → stoppt Animation sofort
- Die zusätzlichen 500ms Timeout werden nicht abgewartet

### Status:
🟡 **ZWEI PROBLEME**:
1. Agent: `waitingForEventRef.current` wird zu früh auf `false` gesetzt
2. End: Animation wird zu schnell beendet, bevor zusätzlicher Timeout abläuft

### Lösung:
1. **Agent**: `waitingForEventRef.current` sollte erst auf `false` gesetzt werden, NACHDEM `node.end` verarbeitet wurde
2. **End**: `moveToNextNode` sollte nicht aufgerufen werden, wenn wir bereits am End sind und auf zusätzlichen Timeout warten

### Nächste Schritte:
1. ✅ Prüfen, wo `waitingForEventRef.current = false` gesetzt wird
2. ✅ Prüfen, warum `moveToNextNode` für End aufgerufen wird, obwohl wir auf zusätzlichen Timeout warten
3. ✅ Fix für beide Probleme implementieren

### Fixes implementiert:
1. **Agent Logging**: Log-Bedingung angepasst - jetzt wird auch geloggt, wenn `waitingForEvent: false` ist, aber der Node noch animiert wird (Race Condition behoben)
2. **End Animation**: `moveToNextNode` wird nicht mehr aufgerufen, wenn wir bereits am End sind (verhindert sofortiges Stoppen)

### Erwartetes Verhalten nach Fix:
- Agent Node sollte jetzt geloggt werden, auch wenn `waitingForEvent: false` ist
- End Node Animation sollte jetzt sichtbar bleiben für ~700ms (200ms + 500ms)

---

## Test #3 - 2025-01-XX

### Logs:
```
[moveToNextNode] Moving to: Start (...), type: start, fast: true, slow: false, index: 0/4
start-1765711796556 202ms
[moveToNextNode] Moving to: Pipedrive: Get All Activities (...), type: http-request, fast: false, slow: true, index: 1/4
[moveToNextNode] Moving to: Agent (agent-1765711826257), type: agent, fast: false, slow: true, index: 2/4
[node.end] Received: agent-1765711826257 (agent-1765711826257), currentAnimatedNodeId: null, waitingForEvent: true
Agent 3.22s  ← ✅ JETZT GELOGGT!
[moveToNextNode] Moving to: End (end-1765711951585), type: end, fast: true, slow: false, index: 3/4
End 66ms  ← ❌ PROBLEM: Nur 66ms statt ~200ms!
```

### Problem:
**End Node hat nur 66ms statt ~200ms!**

**Erwartete Dauer:**
- Fast Node: 200ms (Timeout)
- Zusätzlich für getesteten Node: 500ms
- **Gesamt: ~700ms**

**Tatsächliche Dauer:**
- **Nur 66ms** → Animation wird zu früh gestoppt

### Analyse:
- Agent wird jetzt korrekt geloggt ✅
- End wird geloggt, aber Dauer ist falsch ❌
- **Problem**: Start-Zeit wird möglicherweise zu spät gesetzt oder zu früh gelöscht
- **Oder**: Timeout wird zu früh ausgelöst

### Mögliche Ursachen:
1. **Start-Zeit wird zu spät gesetzt**: Wenn `moveToNextNode` für End aufgerufen wird, wird die Start-Zeit gesetzt, aber der Timeout läuft bereits
2. **Race Condition**: `moveToNextNode` wird mehrfach aufgerufen, Start-Zeit wird überschrieben
3. **Timeout wird zu früh ausgelöst**: Der 200ms Timeout wird nicht korrekt gesetzt

### Status:
🟡 **TEILWEISE BEHOBEN**:
- ✅ Agent wird jetzt geloggt
- ❌ End Dauer ist falsch (66ms statt ~200ms)

### Nächste Schritte:
1. ✅ Prüfen, wann Start-Zeit für End gesetzt wird
2. ✅ Prüfen, ob Timeout korrekt gesetzt wird (200ms)
3. ✅ Prüfen, ob Start-Zeit zu früh gelöscht wird

### Fixes implementiert:
1. **Start-Zeit wird jetzt immer aktualisiert**: Wenn `moveToNextNode` mehrfach aufgerufen wird, wird die Start-Zeit aktualisiert (nicht übersprungen)
2. **Debug-Logs für Timeout-Clearing**: Zeigt, wann Timeouts gelöscht werden

### Problem bleibt:
- End hat immer noch nur 95ms statt ~200ms
- **Ursache**: `moveToNextNode` wird zweimal aufgerufen, der zweite Timeout überschreibt den ersten, aber die Start-Zeit wird nicht aktualisiert

### Neuer Fix:
- Start-Zeit wird jetzt IMMER aktualisiert, auch wenn sie bereits existiert
- Dies stellt sicher, dass die Start-Zeit korrekt ist, auch wenn `moveToNextNode` mehrfach aufgerufen wird

### Problem bleibt:
- End hat immer noch nur 91ms statt ~200ms
- **Ursache**: `moveToNextNode` wird zweimal aufgerufen, der zweite Aufruf löscht den Timeout und setzt einen neuen, aber die Dauer ist falsch

### Neuer Fix (Test #4):
- **Verhindere doppelte Aufrufe**: Wenn ein Fast Node bereits animiert wird und ein Timeout gesetzt ist, wird der zweite Aufruf ignoriert
- Dies verhindert, dass Timeouts gelöscht und neu gesetzt werden

### Problem bleibt:
- End hat immer noch nur 66ms statt ~200ms
- **Ursache**: Die Prüfung greift nicht, weil sie vor der Berechnung von `animationDuration` läuft
- **Neue Ursache**: Der zweite Aufruf kommt, bevor `currentAnimatedNodeId` aktualisiert wurde

### Neuer Fix (Test #5):
- **Prüfung nach `animationDuration` Berechnung**: Prüfe, ob bereits ein Timeout für diesen Node existiert, NACHDEM `animationDuration` berechnet wurde
- Dies verhindert, dass doppelte Aufrufe verarbeitet werden, auch wenn der State noch nicht aktualisiert wurde

---

## Test #4 - 2025-01-XX

### Logs:
```
[moveToNextNode] Moving to: End (end-1765711951585), type: end, fast: true, slow: false, index: 3/4
[moveToNextNode] Set start time for End: 1765752757046, duration: 200ms
[moveToNextNode] Moving to: End (end-1765711951585), type: end, fast: true, slow: false, index: 3/4
[moveToNextNode] Updated start time for End: 1765752757046 -> 1765752757047, duration: 200ms
End 126ms  ← ❌ PROBLEM: Nur 126ms statt ~200ms!
```

### Problem:
**Zwei Probleme:**
1. **End Node hat nur 126ms statt ~200ms** - Start-Zeit wird um 1ms aktualisiert, aber Timeout läuft trotzdem
2. **Animation ist im Browser nicht sichtbar** - Obwohl geloggt wird, sieht der User keine Animation

### Analyse:
- Start-Zeit wird um 1ms aktualisiert (1765752757046 -> 1765752757047)
- Timeout wird gelöscht und neu gesetzt
- **Problem**: Der zweite Aufruf kommt zu schnell, die Prüfung greift nicht
- **Problem**: Für getestete Nodes wird `currentAnimatedNodeId` zu früh auf `null` gesetzt (nach 500ms zusätzlich, aber das reicht nicht)

### Status:
🟡 **ZWEI PROBLEME**:
1. End Dauer ist falsch (126ms statt ~200ms)
2. Animation ist nicht sichtbar (zu schnell gestoppt)

### Fixes implementiert:
1. **Prüfung für getestete Nodes**: Wenn Start-Zeit weniger als 50ms alt ist, wird der Aufruf ignoriert
2. **Längere Sichtbarkeit**: Für getestete Fast Nodes wird die Animation jetzt 1000ms länger sichtbar gehalten (statt 500ms)
3. **Debug-Logs**: Zeigen, wann Animation gestoppt wird

### Erwartetes Verhalten nach Fix:
- End Node sollte jetzt ~200ms haben (nicht 126ms)
- Animation sollte im Browser sichtbar bleiben für ~1200ms (200ms + 1000ms)

### Problem bleibt:
- End hat immer noch nur 64ms statt ~200ms
- Animation ist im Browser nicht sichtbar, obwohl Log sagt "keeping animation visible"

### Neue Fixes (Test #5):
1. ✅ **Prüfung für getestete Nodes früher**: Prüfe, ob Start-Zeit weniger als 50ms alt ist, BEVOR sie aktualisiert wird
2. ✅ **Verifizierung von currentAnimatedNodeId**: Stelle sicher, dass `currentAnimatedNodeId` korrekt gesetzt ist, bevor wir die Animation sichtbar halten
3. ✅ **Debug-Logs**: Zeigen, ob `currentAnimatedNodeId` korrekt gesetzt ist

### Problem bleibt:
- End hat immer noch nur 116ms statt ~200ms
- Animation ist im Browser nicht sichtbar
- **KRITISCH**: `currentAnimatedNodeId` wird auf `null` gesetzt, BEVOR der Timeout abläuft
- **Ursache**: `testingNodeId` wird zu früh auf `null` gesetzt (nach 500ms in `handleDebugTestResult`), was den State zurücksetzt

### Neuer Fix (Test #6):
- ✅ **Verhindere State-Reset während Animation**: Wenn `testingNodeId` auf `null` gesetzt wird, aber der getestete Node noch animiert wird, verzögere den Reset
- ✅ **Längere Delay in handleDebugTestResult**: Delay von 500ms auf 1500ms erhöht, um Animation zu beenden (200ms + 1000ms + Buffer)
- Dies verhindert, dass `currentAnimatedNodeId` zu früh auf `null` gesetzt wird

### Erwartetes Verhalten nach Fix:
- `testingNodeId` wird erst nach 1500ms auf `null` gesetzt (statt 500ms)
- `currentAnimatedNodeId` bleibt für ~1200ms gesetzt
- Animation sollte im Browser sichtbar sein

### Problem bleibt:
- End hat immer noch nur 96ms statt ~200ms
- Animation ist im Browser nicht sichtbar
- **KRITISCH**: `[moveToNextNode] Stopping animation for tested node end-...` wird ZWEIMAL aufgerufen
- **Ursache**: Der Stop-Timeout wird zweimal gesetzt, beide laufen ab und stoppen die Animation sofort

### Neuer Fix (Test #7):
- **Stop-Timeout Tracking**: Verwende `stopTimeoutRef` um zu tracken, ob bereits ein Stop-Timeout für einen Node gesetzt wurde
- **Verhindere doppelte Stop-Timeouts**: Wenn bereits ein Stop-Timeout existiert, wird kein neuer gesetzt
- **Cleanup**: Stop-Timeouts werden beim Reset gelöscht

### Erwartetes Verhalten nach Fix:
- Stop-Timeout wird nur einmal gesetzt
- Animation bleibt für ~1200ms sichtbar
- `currentAnimatedNodeId` wird nicht zu früh auf `null` gesetzt

---

## Test #5 - [Datum]

### Logs:
```
[Logs hier einfügen]
```

### Problem:
[Problem beschreiben]

### Status:
[Status]

---

