# Checkliste: Professionelle Umsetzung von `{{...}}` Expression Resolution

## Übersicht der 9 Verbesserungspunkte

### 1. Architektur & Design
- [ ] A. Parser-basierte Lösung statt Regex
- [ ] B. Type-Safety verbessern

### 2. Performance-Optimierungen
- [ ] A. Caching von normalisierten Kontexten
- [ ] B. Expression-Caching
- [ ] C. Lazy Evaluation

### 3. Code-Organisation
- [ ] A. Separation of Concerns
- [ ] B. Strategy Pattern für verschiedene Syntax-Typen

### 4. Features
- [ ] A. Expression-Validierung
- [ ] B. Debug-Modus
- [ ] C. Type-Aware Resolution

### 5. Sicherheit
- [ ] A. Injection-Schutz
- [ ] B. Expression-Whitelist

### 6. Error Handling
- [ ] A. Strukturierte Fehler
- [ ] B. Fallback-Strategien

### 7. Testing & Debugging
- [ ] A. Unit Tests
- [ ] B. Expression-Validator für Frontend

### 8. Dokumentation
- [ ] A. Expression-Referenz

### 9. Konkrete Code-Verbesserungen
- [ ] A. Entferne Legacy-Support
- [ ] B. Vereinfachte API

---

## Priorisierung & Umsetzungsplan

### Phase 1: Foundation (Kritisch - Muss zuerst gemacht werden)
**Ziel:** Solide Basis schaffen, Legacy entfernen, Type-Safety

#### 1.1 Legacy-Support entfernen ⚠️
- [ ] Entferne `data` → `json` Migration aus `normalizeToNodeData`
- [ ] Entferne Fallback auf `.data` in `resolveNodeDataPath`
- [ ] Entferne Fallback auf `.data` in Input-Auflösung
- [ ] Aktualisiere `isNodeData` - nur noch `json` prüfen
- [ ] Teste: Alle Nodes müssen `json` Feld verwenden
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

#### 1.2 Type-Safety verbessern 🔒
- [ ] Erstelle strikte Typen für `ExpressionContext`
  ```typescript
  interface ExpressionContext {
      steps: Record<string, NodeData>;  // Statt Record<string, any>
      input: NodeData | null;           // Statt any
      secrets: Record<string, string>;
  }
  ```
- [ ] Erstelle `ExpressionResult` Type
  ```typescript
  type ExpressionResult = string | number | boolean | object | null;
  ```
- [ ] Ersetze alle `any` durch konkrete Typen
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

#### 1.3 Vereinfachte API 📦
- [ ] Refactore `resolveExpressions` Signatur:
  ```typescript
  resolveExpressions(
      text: string,
      context: ExpressionContext,
      options?: {
          execution?: Execution;
          currentNodeId?: string;
          itemIndex?: number;
          debug?: boolean;
          onError?: 'throw' | 'warn' | 'fallback';
          fallbackValue?: string;
      }
  ): string
  ```
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

#### 1.4 Strukturierte Fehlerbehandlung 🚨
- [ ] Erstelle `ExpressionResolutionError` Klasse
  ```typescript
  class ExpressionResolutionError extends Error {
      constructor(
          public expression: string,
          public reason: 'not_found' | 'invalid_path' | 'type_mismatch',
          public details?: any
      ) {
          super(`Failed to resolve expression: ${expression}`);
      }
  }
  ```
- [ ] Implementiere Fallback-Strategien basierend auf `options.onError`
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

**Zeitaufwand Phase 1:** ~4-6 Stunden  
**Abhängigkeiten:** Keine  
**Risiko:** Mittel (kann bestehende Workflows beeinflussen)

---

### Phase 2: Robustheit & User Experience (Wichtig)
**Ziel:** Bessere Fehlermeldungen, Debug-Info, Validierung

#### 2.1 Bessere Fehlermeldungen 📝
- [ ] Implementiere `getAvailablePaths()` Methode
  ```typescript
  private getAvailablePaths(data: any, prefix: string = ''): string[] {
      // Rekursiv alle verfügbaren Pfade sammeln
      // z.B. ['status', 'body', 'data', 'data[0]', 'data[0].id']
  }
  ```
- [ ] Erweitere Fehlermeldungen mit verfügbaren Pfaden
  ```typescript
  if (replacement === null) {
      const availablePaths = this.getAvailablePaths(nodeDataValue);
      throw new ExpressionResolutionError(
          fullMatch,
          'not_found',
          { availablePaths, nodeId }
      );
  }
  ```
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

#### 2.2 Debug-Modus 🐛
- [ ] Implementiere `ResolutionTrace` Interface
  ```typescript
  interface ResolutionTrace {
      expression: string;
      resolvedValue: any;
      steps: ResolutionStep[];
      duration: number;
      errors?: string[];
  }
  ```
- [ ] Sammle Trace-Informationen wenn `options.debug === true`
- [ ] Erweitere Return-Type für Debug-Modus
  ```typescript
  resolveExpressions(..., options?): string | { result: string; trace: ResolutionTrace[] }
  ```
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

#### 2.3 Expression-Validierung ✅
- [ ] Erstelle `ExpressionValidator` Klasse
  ```typescript
  class ExpressionValidator {
      validateSyntax(expression: string): ValidationResult;
      validateReferences(expression: string, context: ExpressionContext): ValidationResult;
      validateTypes(expression: string, context: ExpressionContext): ValidationResult;
  }
  ```
- [ ] Implementiere Validierung vor Resolution
- [ ] **Datei:** `packages/execution-service/src/services/expressionValidator.ts` (neu)

**Zeitaufwand Phase 2:** ~6-8 Stunden  
**Abhängigkeiten:** Phase 1  
**Risiko:** Niedrig

---

### Phase 3: Performance & Architektur (Optimierung)
**Ziel:** Performance verbessern, Code besser organisieren

#### 3.1 Caching ⚡
- [ ] Implementiere Context-Cache
  ```typescript
  private contextCache = new Map<string, ExpressionContext>();
  private getNormalizedContext(context: ExpressionContext): ExpressionContext {
      const cacheKey = this.createContextKey(context);
      if (this.contextCache.has(cacheKey)) {
          return this.contextCache.get(cacheKey)!;
      }
      const normalized = this.normalizeContext(context);
      this.contextCache.set(cacheKey, normalized);
      return normalized;
  }
  ```
- [ ] Implementiere Expression-Cache (optional, nur für häufig verwendete Expressions)
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

#### 3.2 Separation of Concerns 🏗️
- [ ] Erstelle `expressionParser.ts` (neu)
  ```typescript
  class ExpressionParser {
      parse(expression: string): ExpressionAST;
      extractExpressions(text: string): string[];
  }
  ```
- [ ] Erstelle `expressionResolver.ts` (neu)
  ```typescript
  class ExpressionResolver {
      resolve(ast: ExpressionAST, context: ExpressionContext): ExpressionResult;
  }
  ```
- [ ] Refactore `ExpressionResolutionService` als Orchestrator
- [ ] **Dateien:** 
  - `packages/execution-service/src/services/expressionParser.ts` (neu)
  - `packages/execution-service/src/services/expressionResolver.ts` (neu)
  - `packages/execution-service/src/services/expressionResolutionService.ts` (refactored)

#### 3.3 Strategy Pattern (Optional) 🎯
- [ ] Erstelle `ExpressionStrategy` Interface
  ```typescript
  interface ExpressionStrategy {
      canHandle(expression: string): boolean;
      resolve(expression: string, context: ExpressionContext): ExpressionResult;
  }
  ```
- [ ] Implementiere Strategien:
  - `StepsExpressionStrategy`
  - `InputExpressionStrategy`
  - `SecretsExpressionStrategy`
- [ ] **Datei:** `packages/execution-service/src/services/expressionStrategies/` (neu)

**Zeitaufwand Phase 3:** ~8-12 Stunden  
**Abhängigkeiten:** Phase 1, Phase 2  
**Risiko:** Mittel (größere Refactorings)

---

### Phase 4: Erweiterte Features (Nice-to-Have)
**Ziel:** Zusätzliche Features für bessere UX

#### 4.1 Optional Chaining 🔗
- [ ] Unterstütze `?.` Syntax
  ```typescript
  {{steps.nodeId.json.data?.[0]?.id}}  // Gibt null zurück wenn Pfad fehlt
  ```
- [ ] Implementiere in `resolveObjectPath`
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

#### 4.2 Type-Aware Resolution 📊
- [ ] Unterstütze explizite Type-Casts
  ```typescript
  {{steps.nodeId.json.field as string}}
  {{steps.nodeId.json.count as number}}
  ```
- [ ] Implementiere Type-Conversion
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

#### 4.3 Array-Helper-Funktionen 📋
- [ ] Unterstütze `.first()`, `.last()`, `.length`
  ```typescript
  {{steps.nodeId.json.data.first().id}}
  {{steps.nodeId.json.data.last().id}}
  {{steps.nodeId.json.data.length}}
  ```
- [ ] Implementiere in `resolveObjectPath`
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

**Zeitaufwand Phase 4:** ~4-6 Stunden  
**Abhängigkeiten:** Phase 1, Phase 2  
**Risiko:** Niedrig

---

### Phase 5: Sicherheit & Testing (Wichtig)
**Ziel:** Sicherheit verbessern, Tests schreiben

#### 5.1 Injection-Schutz 🔐
- [ ] Implementiere `sanitizeReplacement()` Methode
  ```typescript
  private sanitizeReplacement(value: any, context: 'url' | 'json' | 'text'): string {
      if (context === 'url') {
          return encodeURIComponent(String(value));
      }
      if (context === 'json') {
          return JSON.stringify(value);
      }
      return String(value);
  }
  ```
- [ ] Verwende Sanitization basierend auf Kontext
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

#### 5.2 Expression-Whitelist (Optional) ✅
- [ ] Definiere erlaubte Expression-Patterns
  ```typescript
  private allowedExpressions = [
      /^steps\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_.]+$/,
      /^input\.[a-zA-Z0-9_.]+$/,
      /^secrets\.[a-zA-Z0-9_-]+$/
  ];
  ```
- [ ] Validiere Expressions gegen Whitelist (nur wenn `strictMode: true`)
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

#### 5.3 Unit Tests 🧪
- [ ] Erstelle Test-Suite für `ExpressionResolutionService`
  ```typescript
  describe('ExpressionResolutionService', () => {
      it('should resolve simple steps expression', () => { ... });
      it('should resolve nested paths', () => { ... });
      it('should resolve array indices', () => { ... });
      it('should handle missing paths gracefully', () => { ... });
      it('should resolve secrets', () => { ... });
      it('should resolve input', () => { ... });
  });
  ```
- [ ] Teste Edge Cases (null, undefined, leere Strings, etc.)
- [ ] **Datei:** `packages/execution-service/src/services/__tests__/expressionResolutionService.test.ts` (neu)

#### 5.4 Integration Tests 🔗
- [ ] Teste mit echten HTTP Request Node Responses
- [ ] Teste mit verschiedenen API-Strukturen (Arrays, Objekte, verschachtelt)
- [ ] **Datei:** `packages/execution-service/src/services/__tests__/expressionResolutionService.integration.test.ts` (neu)

**Zeitaufwand Phase 5:** ~6-8 Stunden  
**Abhängigkeiten:** Phase 1, Phase 2  
**Risiko:** Niedrig

---

### Phase 6: Dokumentation & Frontend (Kommunikation)
**Ziel:** Dokumentation und Frontend-Integration

#### 6.1 Expression-Referenz 📚
- [ ] Erstelle umfassende Dokumentation
  ```markdown
  # Expression Reference
  
  ## Syntax
  - {{steps.nodeId.json.field}}
  - {{input.json.field}}
  - {{secrets.name}}
  
  ## Examples
  - Simple field access
  - Nested access
  - Array access
  - Optional chaining
  ```
- [ ] **Datei:** `packages/execution-service/docs/EXPRESSION_REFERENCE.md` (neu)

#### 6.2 Expression-Validator für Frontend 🎨
- [ ] Exportiere Validierungs-Funktion für Frontend
  ```typescript
  export function validateExpressionSyntax(expression: string): ValidationResult;
  export function validateExpressionReferences(
      expression: string,
      availableNodes: string[]
  ): ValidationResult;
  ```
- [ ] Frontend kann Expressions vor dem Speichern validieren
- [ ] **Datei:** `packages/execution-service/src/services/expressionValidator.ts`

#### 6.3 Code-Kommentare 💬
- [ ] Füge JSDoc-Kommentare zu allen öffentlichen Methoden hinzu
- [ ] Dokumentiere alle Expression-Syntax-Varianten
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`

**Zeitaufwand Phase 6:** ~3-4 Stunden  
**Abhängigkeiten:** Phase 1, Phase 2  
**Risiko:** Niedrig

---

## Gesamt-Zeitaufwand

| Phase | Zeitaufwand | Priorität | Abhängigkeiten |
|-------|-------------|-----------|----------------|
| Phase 1: Foundation | 4-6h | 🔴 Kritisch | Keine |
| Phase 2: Robustheit | 6-8h | 🟠 Wichtig | Phase 1 |
| Phase 3: Performance | 8-12h | 🟡 Optional | Phase 1, 2 |
| Phase 4: Features | 4-6h | 🟢 Nice-to-Have | Phase 1, 2 |
| Phase 5: Sicherheit | 6-8h | 🟠 Wichtig | Phase 1, 2 |
| Phase 6: Dokumentation | 3-4h | 🟡 Optional | Phase 1, 2 |
| **Gesamt** | **31-44h** | | |

---

## Empfohlene Reihenfolge

### Sprint 1 (Foundation) - 1-2 Wochen
1. ✅ Phase 1.1: Legacy-Support entfernen
2. ✅ Phase 1.2: Type-Safety verbessern
3. ✅ Phase 1.3: Vereinfachte API
4. ✅ Phase 1.4: Strukturierte Fehlerbehandlung
5. ✅ Phase 5.3: Unit Tests (Grundlagen)

### Sprint 2 (Robustheit) - 1-2 Wochen
1. ✅ Phase 2.1: Bessere Fehlermeldungen
2. ✅ Phase 2.2: Debug-Modus
3. ✅ Phase 2.3: Expression-Validierung
4. ✅ Phase 5.1: Injection-Schutz
5. ✅ Phase 5.4: Integration Tests

### Sprint 3 (Optimierung) - 1-2 Wochen
1. ✅ Phase 3.1: Caching
2. ✅ Phase 3.2: Separation of Concerns
3. ✅ Phase 4.1: Optional Chaining
4. ✅ Phase 6.1: Dokumentation

### Sprint 4 (Erweiterte Features) - Optional
1. ✅ Phase 3.3: Strategy Pattern
2. ✅ Phase 4.2: Type-Aware Resolution
3. ✅ Phase 4.3: Array-Helper-Funktionen
4. ✅ Phase 5.2: Expression-Whitelist
5. ✅ Phase 6.2: Frontend-Validator
6. ✅ Phase 6.3: Code-Kommentare

---

## Risiken & Mitigation

### Risiko 1: Breaking Changes durch Legacy-Entfernung
**Mitigation:**
- Migration-Script erstellen, das bestehende Workflows aktualisiert
- Deprecation-Warnung für 1-2 Releases
- Fallback-Mechanismus für Übergangszeit

### Risiko 2: Performance-Regression durch Caching
**Mitigation:**
- Caching nur für häufig verwendete Expressions
- Cache-Größe limitieren (LRU Cache)
- Performance-Tests vor/nach Implementierung

### Risiko 3: Komplexität durch Parser-basierte Lösung
**Mitigation:**
- Schrittweise Migration (erst Regex, dann Parser)
- Umfassende Tests
- Dokumentation

---

## Definition of Done

Eine Phase ist abgeschlossen, wenn:
- [ ] Alle Code-Änderungen implementiert sind
- [ ] Unit Tests geschrieben und bestanden
- [ ] Integration Tests bestanden
- [ ] Code-Review durchgeführt
- [ ] Dokumentation aktualisiert
- [ ] Keine Regressionen in bestehenden Workflows
- [ ] Performance-Tests bestanden (wenn relevant)

---

## Notizen

- **API-Integrationen:** Die Expression-Resolution funktioniert bereits mit unbekannten API-Strukturen, da sie dynamisch durch JSON navigiert. Verbesserungen fokussieren sich auf Robustheit und bessere Fehlermeldungen.
- **Backward Compatibility:** Phase 1 entfernt Legacy-Support. Migration-Script sollte erstellt werden.
- **Testing:** Jede Phase sollte mit Tests abgeschlossen werden, um Regressionen zu vermeiden.

