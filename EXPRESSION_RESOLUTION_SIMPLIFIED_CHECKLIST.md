# Checkliste: Professionelle Umsetzung von `{{...}}` Expression Resolution (Vereinfacht)

## Philosophie: Professionell, aber Pragmatisch

**Prinzipien:**
- ✅ Code-Qualität (Type-Safety, Tests, Fehlerbehandlung)
- ✅ Robustheit (Validierung, bessere Fehlermeldungen)
- ✅ Wartbarkeit (klare Struktur, Dokumentation)
- ❌ Kein Over-Engineering (keine unnötigen Patterns, keine vorzeitige Optimierung)

---

## Phase 1: Foundation & Type-Safety (Kritisch) - 8-10h

### 1.1 Type-Safety verbessern 🔒
**Ziel:** Strikte Typen statt `any`, bessere IDE-Unterstützung

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
- [ ] Ersetze alle `any` durch konkrete Typen in `resolveExpressions`
- [ ] Ersetze alle `any` durch konkrete Typen in `resolveObjectPath`
- [ ] Ersetze alle `any` durch konkrete Typen in `resolveNodeDataPath`
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`
- [ ] **Test:** TypeScript-Kompilierung ohne `any`-Warnungen

**Zeitaufwand:** ~2-3 Stunden  
**Risiko:** Niedrig  
**Nutzen:** Hoch (bessere IDE-Unterstützung, weniger Bugs)

---

### 1.2 Vereinfachte API 📦
**Ziel:** Bessere API mit Options-Objekt statt vielen Parametern

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
- [ ] Aktualisiere alle Aufrufe von `resolveExpressions` im Codebase
  - `packages/execution-service/src/services/executionService.ts`
  - `packages/execution-service/src/nodes/registerBuiltIns.ts`
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`
- [ ] **Test:** Alle bestehenden Aufrufe funktionieren noch

**Zeitaufwand:** ~2-3 Stunden  
**Risiko:** Mittel (Breaking Change für interne API)  
**Nutzen:** Hoch (bessere API, einfacher zu erweitern)

---

### 1.3 Strukturierte Fehlerbehandlung 🚨
**Ziel:** Bessere Fehlermeldungen mit Kontext

- [ ] Erstelle `ExpressionResolutionError` Klasse
  ```typescript
  class ExpressionResolutionError extends Error {
      constructor(
          public expression: string,
          public reason: 'not_found' | 'invalid_path' | 'type_mismatch' | 'missing_node',
          public details?: {
              nodeId?: string;
              availableNodes?: string[];
              path?: string;
          }
      ) {
          super(`Failed to resolve expression: ${expression} (${reason})`);
          this.name = 'ExpressionResolutionError';
      }
  }
  ```
- [ ] Implementiere Fallback-Strategien basierend auf `options.onError`
  ```typescript
  if (replacement === null) {
      const error = new ExpressionResolutionError(
          fullMatch,
          'not_found',
          { nodeId, availableNodes: Object.keys(normalizedContext.steps) }
      );
      
      switch (options?.onError) {
          case 'throw':
              throw error;
          case 'warn':
              this.logger?.warn(error.message);
              break;
          case 'fallback':
              return options.fallbackValue || fullMatch;
      }
  }
  ```
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`
- [ ] **Test:** Fehlerbehandlung funktioniert für alle Strategien

**Zeitaufwand:** ~2-3 Stunden  
**Risiko:** Niedrig  
**Nutzen:** Hoch (bessere Debugging-Erfahrung)

---

### 1.4 Unit Tests - Grundlagen 🧪
**Ziel:** Test-Coverage für kritische Pfade

- [ ] Erstelle Test-Suite
  ```typescript
  describe('ExpressionResolutionService', () => {
      it('should resolve simple steps expression', () => {
          const service = new ExpressionResolutionService();
          const context = {
              steps: {
                  'node1': { json: { field: 'value' }, metadata: {...} }
              },
              secrets: {}
          };
          const result = service.resolveExpressions(
              '{{steps.node1.json.field}}',
              context
          );
          expect(result).toBe('value');
      });
      
      it('should resolve nested paths', () => { ... });
      it('should resolve array indices', () => { ... });
      it('should resolve input expressions', () => { ... });
      it('should resolve secrets', () => { ... });
      it('should handle missing paths gracefully', () => { ... });
      it('should handle null/undefined values', () => { ... });
  });
  ```
- [ ] **Datei:** `packages/execution-service/src/services/__tests__/expressionResolutionService.test.ts` (neu)
- [ ] **Ziel:** Mindestens 80% Code-Coverage für kritische Methoden

**Zeitaufwand:** ~2-3 Stunden  
**Risiko:** Niedrig  
**Nutzen:** Hoch (verhindert Regressionen)

---

## Phase 2: Robustheit & User Experience (Wichtig) - 6-8h

### 2.1 Bessere Fehlermeldungen 📝
**Ziel:** Hilfreiche Fehlermeldungen mit verfügbaren Pfaden (limitiert auf kleine Objekte)

- [ ] Implementiere `getAvailablePaths()` Methode (nur für Objekte < 100 Keys)
  ```typescript
  private getAvailablePaths(data: any, prefix: string = '', maxDepth: number = 3): string[] {
      // Nur für kleine Objekte (Performance)
      if (this.getObjectSize(data) > 100) {
          return ['(object too large to list all paths)'];
      }
      
      const paths: string[] = [];
      if (typeof data === 'object' && data !== null) {
          if (Array.isArray(data)) {
              // Für Arrays: zeige nur [0], [1], [2] und length
              for (let i = 0; i < Math.min(data.length, 5); i++) {
                  paths.push(`${prefix}[${i}]`);
              }
              paths.push(`${prefix}.length`);
          } else {
              for (const key in data) {
                  if (data.hasOwnProperty(key)) {
                      const newPath = prefix ? `${prefix}.${key}` : key;
                      paths.push(newPath);
                      
                      // Rekursiv, aber limitiert auf maxDepth
                      if (maxDepth > 0 && typeof data[key] === 'object') {
                          paths.push(...this.getAvailablePaths(data[key], newPath, maxDepth - 1));
                      }
                  }
              }
          }
      }
      return paths;
  }
  
  private getObjectSize(obj: any): number {
      // Zähle alle Keys rekursiv
      if (typeof obj !== 'object' || obj === null) return 0;
      let size = Object.keys(obj).length;
      for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
              size += this.getObjectSize(obj[key]);
          }
      }
      return size;
  }
  ```
- [ ] Erweitere Fehlermeldungen mit verfügbaren Pfaden
  ```typescript
  if (replacement === null) {
      const availablePaths = this.getAvailablePaths(nodeDataValue.json, 'json');
      throw new ExpressionResolutionError(
          fullMatch,
          'not_found',
          { 
              nodeId, 
              availablePaths: availablePaths.slice(0, 20) // Limit auf 20 Pfade
          }
      );
  }
  ```
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`
- [ ] **Test:** Fehlermeldungen enthalten hilfreiche Informationen

**Zeitaufwand:** ~2-3 Stunden  
**Risiko:** Niedrig (Performance-Limitierung verhindert Probleme)  
**Nutzen:** Hoch (bessere User Experience)

---

### 2.2 Debug-Modus 🐛
**Ziel:** Trace-Informationen für Debugging

- [ ] Implementiere `ResolutionTrace` Interface
  ```typescript
  interface ResolutionTrace {
      expression: string;
      resolvedValue: any;
      duration: number;
      errors?: string[];
  }
  ```
- [ ] Sammle Trace-Informationen wenn `options.debug === true`
  ```typescript
  resolveExpressions(
      text: string,
      context: ExpressionContext,
      options?: { debug?: boolean; ... }
  ): string | { result: string; trace: ResolutionTrace[] } {
      const traces: ResolutionTrace[] = [];
      const startTime = Date.now();
      
      // ... Resolution-Logik ...
      
      if (options?.debug) {
          return {
              result: text,
              trace: traces
          };
      }
      return text;
  }
  ```
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`
- [ ] **Test:** Debug-Modus gibt Trace-Informationen zurück

**Zeitaufwand:** ~2-3 Stunden  
**Risiko:** Niedrig  
**Nutzen:** Mittel (hilfreich für Debugging, aber nicht kritisch)

---

### 2.3 Expression-Validierung ✅
**Ziel:** Validiere Expressions vor Resolution (verhindert Fehler früh)

- [ ] Erstelle `ExpressionValidator` Klasse
  ```typescript
  class ExpressionValidator {
      validateSyntax(expression: string): { valid: boolean; error?: string } {
          // Prüfe grundlegende Syntax
          if (!expression.startsWith('{{') || !expression.endsWith('}}')) {
              return { valid: false, error: 'Expression must be wrapped in {{}}' };
          }
          
          // Prüfe auf gültige Patterns
          const validPatterns = [
              /^steps\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_.\[\]]+$/,
              /^input\.[a-zA-Z0-9_.\[\]]+$/,
              /^secrets\.[a-zA-Z0-9_-]+$/
          ];
          
          const innerExpression = expression.slice(2, -2).trim();
          const isValid = validPatterns.some(pattern => pattern.test(innerExpression));
          
          return {
              valid: isValid,
              error: isValid ? undefined : `Invalid expression syntax: ${expression}`
          };
      }
      
      validateReferences(
          expression: string,
          availableNodes: string[]
      ): { valid: boolean; error?: string } {
          // Prüfe ob referenzierte Nodes existieren
          const nodeMatch = expression.match(/^steps\.([a-zA-Z0-9_-]+)\./);
          if (nodeMatch) {
              const nodeId = nodeMatch[1];
              if (!availableNodes.includes(nodeId)) {
                  return {
                      valid: false,
                      error: `Node '${nodeId}' not found. Available nodes: ${availableNodes.join(', ')}`
                  };
              }
          }
          return { valid: true };
      }
  }
  ```
- [ ] Integriere Validierung in `resolveExpressions` (optional, nur wenn `options.validate === true`)
- [ ] **Datei:** `packages/execution-service/src/services/expressionValidator.ts` (neu)
- [ ] **Test:** Validierung erkennt Syntax-Fehler und fehlende Referenzen

**Zeitaufwand:** ~2-3 Stunden  
**Risiko:** Niedrig  
**Nutzen:** Mittel (verhindert Fehler, aber nicht kritisch)

---

## Phase 3: Sicherheit & Testing (Kritisch) - 6-8h

### 3.1 Injection-Schutz 🔐
**Ziel:** Verhindere Code-Injection in Expressions

- [ ] Implementiere `sanitizeReplacement()` Methode
  ```typescript
  private sanitizeReplacement(
      value: any, 
      context: 'url' | 'json' | 'text'
  ): string {
      if (context === 'url') {
          // Für URLs: encodeURIComponent
          return encodeURIComponent(String(value));
      }
      if (context === 'json') {
          // Für JSON: stringify (sicher)
          return JSON.stringify(value);
      }
      // Für Text: escape HTML/JS falls nötig
      return String(value);
  }
  ```
- [ ] Verwende Sanitization basierend auf Kontext (URLs, JSON, Text)
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts`
- [ ] **Test:** Injection-Versuche werden blockiert

**Zeitaufwand:** ~2-3 Stunden  
**Risiko:** Niedrig  
**Nutzen:** Hoch (Sicherheit ist kritisch)

---

### 3.2 Integration Tests 🔗
**Ziel:** Teste mit echten Szenarien

- [ ] Erstelle Integration Tests
  ```typescript
  describe('ExpressionResolutionService Integration', () => {
      it('should resolve expressions in HTTP Request Node response', () => {
          // Simuliere HTTP Request Response
          const httpResponse = {
              json: {
                  status: 200,
                  data: [
                      { id: 1, name: 'Test' },
                      { id: 2, name: 'Test2' }
                  ],
                  success: true
              },
              metadata: { ... }
          };
          
          const context = {
              steps: { 'http-request-1': httpResponse },
              secrets: {}
          };
          
          const result = service.resolveExpressions(
              '{{steps.http-request-1.json.data[0].name}}',
              context
          );
          
          expect(result).toBe('Test');
      });
      
      it('should handle complex nested structures', () => { ... });
      it('should handle array responses', () => { ... });
      it('should handle missing paths in API responses', () => { ... });
  });
  ```
- [ ] **Datei:** `packages/execution-service/src/services/__tests__/expressionResolutionService.integration.test.ts` (neu)
- [ ] **Ziel:** Teste reale API-Response-Strukturen

**Zeitaufwand:** ~3-4 Stunden  
**Risiko:** Niedrig  
**Nutzen:** Hoch (verhindert Regressionen in Production)

---

### 3.3 Dokumentation 📚
**Ziel:** Umfassende Dokumentation für Entwickler

- [ ] Erstelle Expression-Referenz
  ```markdown
  # Expression Reference
  
  ## Syntax
  
  ### Steps
  - `{{steps.nodeId.json.field}}` - Zugriff auf Node-Output
  - `{{steps.nodeId.json.data[0].id}}` - Array-Zugriff
  - `{{steps.nodeId.json.metadata.timestamp}}` - Metadata-Zugriff
  
  ### Input
  - `{{input.json.field}}` - Zugriff auf Workflow-Input
  - `{{input.json.userPrompt}}` - Beispiel
  
  ### Secrets
  - `{{secrets.API_KEY}}` - Zugriff auf Secrets
  - `{{secret:API_KEY}}` - Alternative Syntax
  
  ## Examples
  ...
  ```
- [ ] Füge JSDoc-Kommentare zu allen öffentlichen Methoden hinzu
- [ ] **Datei:** `packages/execution-service/docs/EXPRESSION_REFERENCE.md` (neu)
- [ ] **Datei:** `packages/execution-service/src/services/expressionResolutionService.ts` (JSDoc)

**Zeitaufwand:** ~1-2 Stunden  
**Risiko:** Niedrig  
**Nutzen:** Mittel (hilfreich für Entwickler)

---

## Zusammenfassung

### Zeitaufwand
- **Phase 1:** 8-10 Stunden
- **Phase 2:** 6-8 Stunden
- **Phase 3:** 6-8 Stunden
- **Gesamt:** 20-26 Stunden (statt 31-44h)

### Was WEGGELASSEN wurde (Over-Engineering):
- ❌ Legacy-Support entfernen (zu riskant ohne Migration)
- ❌ Caching (zu riskant, Contexts ändern sich)
- ❌ Separation of Concerns (nicht nötig für 600 Zeilen)
- ❌ Strategy Pattern (Over-Engineering für 3 Expression-Typen)
- ❌ Type-Casts in Expressions (nice-to-have)
- ❌ Array-Helper-Funktionen (nice-to-have)
- ❌ Expression-Whitelist (nicht nötig, Validierung reicht)

### Was BEHALTEN wurde (Professionell):
- ✅ Type-Safety (kritisch)
- ✅ Strukturierte Fehlerbehandlung (kritisch)
- ✅ Unit & Integration Tests (kritisch)
- ✅ Bessere Fehlermeldungen (wichtig)
- ✅ Debug-Modus (hilfreich)
- ✅ Expression-Validierung (hilfreich)
- ✅ Injection-Schutz (kritisch)
- ✅ Dokumentation (wichtig)

---

## Definition of Done

Eine Phase ist abgeschlossen, wenn:
- [ ] Alle Code-Änderungen implementiert sind
- [ ] Unit Tests geschrieben und bestanden (>80% Coverage)
- [ ] Integration Tests bestanden
- [ ] TypeScript kompiliert ohne Warnungen
- [ ] Code-Review durchgeführt
- [ ] Dokumentation aktualisiert
- [ ] Keine Regressionen in bestehenden Workflows

---

## Risiken & Mitigation

### Risiko 1: Breaking Changes durch API-Änderung
**Mitigation:**
- Schrittweise Migration (erst neue API, dann alte entfernen)
- Beide APIs parallel unterstützen für 1 Release
- Umfassende Tests

### Risiko 2: Performance bei getAvailablePaths
**Mitigation:**
- Limitierung auf Objekte < 100 Keys
- Max-Depth-Limitierung (3 Ebenen)
- Nur bei Fehlern aufrufen, nicht bei normaler Resolution

### Risiko 3: Type-Safety könnte bestehenden Code brechen
**Mitigation:**
- Schrittweise Migration (erst neue Typen, dann alte entfernen)
- Type-Assertions wo nötig
- Umfassende Tests

---

## Notizen

- **API-Integrationen:** Die Expression-Resolution funktioniert bereits mit unbekannten API-Strukturen. Diese Checkliste verbessert Robustheit und Fehlerbehandlung.
- **Pragmatisch:** Fokus auf das Wesentliche, kein Over-Engineering.
- **Professionell:** Code-Qualität, Tests, Sicherheit, Dokumentation.

