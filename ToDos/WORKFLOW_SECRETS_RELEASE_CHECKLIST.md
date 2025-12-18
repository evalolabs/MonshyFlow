# ✅ Workflow + Secrets — Release Readiness Checkliste (Professional)
**Zweck:** Sicherstellen, dass **Secrets** im Zusammenhang mit dem **Workflow Builder** für Kunden **intuitiv, sicher, multi-tenant-fähig und production-ready** sind.

---

## 🎯 Kern-Prinzipien (Produkt-Standard)
- [ ] **User muss Secret-Namen nicht raten** (UI führt über Auswahl, Vorschläge, Copy-Templates).
- [ ] **Defaults funktionieren out-of-the-box** (Tenant/Public Defaults), aber **Override ist möglich** (per Node / Advanced).
- [ ] **Keine Klartext-Secrets im Workflow State** (Frontend speichert Referenzen/IDs, nicht values).
- [ ] **Explizite Scopes** (Tenant vs User/Private vs Environment) — keine Namenskollisionen/“magische” Auflösung.
- [ ] **Fehler sind handlungsorientiert** (inline Actions wie “Secret anlegen”, “Secrets öffnen”), nicht nur rot markiert.
- [ ] **Actions fühlen sich professionell an** (keine dicken Buttons im Fehlertext; Links/Badges/Icons, konsistenter Stil).

---

## 👥 Kunden-Szenarien (muss abgedeckt sein)

### 1) Single-Tenant SMB (einfach)
- [ ] User legt 1–3 Secrets an (OpenAI, Slack, SMTP) und baut Workflows ohne Doku lesen zu müssen.
- [ ] “Required secrets” werden pro Node klar angezeigt und sind verlinkt (Setup Guide / Tooltip / Inline).

### 2) Multi-Tenant User (ein User, mehrere Tenants)
- [ ] **Aktiver Tenant** ist in UI immer sichtbar (Header/Selector).
- [ ] Secrets Seite zeigt **nur Secrets des aktiven Tenants** (oder klare Grouping + Scope Badges).
- [ ] NodeConfig zeigt Secrets nur aus dem richtigen Scope (kein “aus Versehen falscher Tenant”).

### 3) Enterprise Tenant (viele User, Policies)
- [ ] RBAC/Permissions: Wer darf **sehen**, **nutzen**, **anlegen**, **deaktivieren**, **decrypten**?
- [ ] Audit: Wer hat Secret erstellt/editiert/rotiert/benutzt? (zumindest lastAccessed/createdBy).
- [ ] Optional: Approval Flow / 4-Augen bei kritischen Secrets (wenn geplant).

### 4) “Shared Defaults + Override”
- [ ] Tenant hat “Public/Default Secrets” (für Standard-Integrationen).
- [ ] NodeConfig hat **Advanced Override** (anderes Secret wählen, “custom secret reference” oder “custom auth mode”).
- [ ] Override ist **sichtbar** (Badge/Label “overridden”) und leicht rückgängig zu machen (“reset to default”).

### 5) Rotation & Incident Response
- [ ] Secret-Rotation ändert **Value** ohne Workflows zu brechen (Key/Id stabil).
- [ ] Deaktiviertes Secret erzeugt klare Compile/Validation Errors in betroffenen Workflows.
- [ ] Quick mitigation: “Replace references” / “Migrate to new secret” (Bulk) ist geplant oder documented.

### 6) Environments (dev/staging/prod)
- [ ] Secrets sind environment-scoped oder es gibt klare Guidelines (Naming/Tagging/tenant separation).
- [ ] Workflow export/import berücksichtigt Environment Mapping (falls Feature vorhanden).

---

## 🧠 UX — Workflow Builder (Secrets im Kontext)

### A) Discoverability: “Was ist ein Secret?”
- [ ] NodeConfig erklärt kurz: **Secrets = sicher gespeicherte Zugangsdaten**; in Workflows werden **Referenzen** genutzt.
- [ ] UI zeigt Beispiele: `{{secrets.OPENAI_API_KEY}}` (Copy-Button).
- [ ] User sieht klar den Unterschied: **Secret Name** vs **Provider** vs **Type**.

### B) Guidance: “Welche Secrets brauche ich?”
- [ ] Für Tool/Provider Nodes (Functions/MCP/WebSearch): `requiredSecrets` + `apiKeyUrl` + `setupInstructions` sichtbar.
- [ ] Für API Integrations (HTTP Node): Required Secret(s) aus Integration-Metadata sichtbar.
- [ ] Für Email/SMTP: klare UX (SMTP Profile oder Secrets) + Requirements sichtbar.
- [ ] NodeInfoOverlay/Validation zeigt nicht nur Fehler, sondern **inline Actions**:
  - [ ] **Secret anlegen** (öffnet Create-Modal vorbefüllt)
  - [ ] **Secrets öffnen**
  - [ ] (Optional) **Reload secrets**
- [ ] **Navigation UX:** “Secret anlegen” öffnet in **neuem Tab**, damit Workflow/Config offen bleibt.
- [ ] **Deep-Linking:** `/admin/secrets?create=1&name=...&type=...&provider=...&returnTo=...` unterstützt.

### C) Input ergonomics: keine Tipparbeit
- [ ] Wo immer möglich: Dropdown (`SecretSelector`) statt Freitext.
- [ ] Wenn Freitext nötig (Custom Headers/Body): Autocomplete / Insert helper für `{{secrets.*}}`.
- [ ] “Advanced Override” ist standardmäßig zu, aber leicht zu finden.

### D) Explainability: “Warum ist mein Workflow rot?”
- [ ] Compile/Validation meldet:
  - [ ] Missing secret (Name/Id)
  - [ ] Inactive secret
  - [ ] Wrong type (ApiKey vs Token vs Password)
  - [ ] Wrong scope/tenant/environment
- [ ] Fehlermeldungen sind verständlich (“OpenAI API Key fehlt”) statt nur technisch (“Secret X missing”).
- [ ] Fehlermeldungen enthalten (wenn möglich) **Provider-Kontext** (“OpenAI API Key fehlt”) statt nur Key-Name.

---

## 🔐 Security — Frontend/Backend Interface

### A) Klartext Handling
- [ ] Default: Secrets API liefert **nie** values an den Workflow Builder.
- [ ] Decrypt endpoint ist:
  - [ ] permission-gated
  - [ ] auditiert
  - [ ] UI warnt & zeigt nur temporär (optional)
- [ ] Keine Klartext-Secrets in:
  - [ ] Browser Console Logs
  - [ ] localStorage/sessionStorage
  - [ ] Workflow JSON Export
  - [ ] Error messages / toast payloads

### B) Transport & Auth
- [ ] Token handling: refresh/logout flows stabil; 401 → redirect ok.
- [ ] CORS/CSRF je nach Architektur sauber.
- [ ] Rate limiting / abuse protection (Secrets endpoints, decrypt).

### C) Least Privilege
- [ ] User ohne Secret-Permission sieht nicht einmal die Namen (wenn Policy).
- [ ] “Use secret in node” darf getrennt sein von “manage secrets”.

---

## 🗂️ Datenmodell & Referenzierung (entscheidend für perfekte UX)

### A) Referenzform (Name vs ID)
- [ ] Entscheidung dokumentiert: speichern wir **Secret Name** oder **Secret ID** in Node configs?
- [ ] Wenn Name:
  - [ ] Name ist eindeutig pro Scope
  - [ ] Rename-Strategie: Rename bricht nichts oder Migration vorhanden
- [ ] Wenn ID:
  - [ ] UI zeigt Name, speichert ID
  - [ ] Export/Import hat Mapping (“missing secret, choose replacement”)

### B) Scope & Collision
- [ ] “Tenant secrets” vs “My secrets” (falls geplant): UI gruppiert & resolved deterministisch.
- [ ] Collision handling (gleicher Name in zwei Scopes) ist definiert und getestet.

---

## 🧪 Test & Qualität (gezielt für Workflow↔Secrets)

### A) Unit/Integration Tests (Frontend)
- [ ] `useSecrets` caching/reload/error handling
- [ ] `SecretSelector` filter by type, empty states, disabled states
- [ ] Node validation: `{{secrets.X}}` extraction, missing/inactive warnings
- [ ] NodeConfigPanel: switching tool types doesn’t leak old secret fields

### B) E2E Critical Flows
- [ ] New tenant → add secret → configure node → run workflow
- [ ] Missing secret → user guided to create → returns to node → validation clears
- [ ] Rotation/deactivation → impacted workflows flagged
- [ ] Multi-tenant: tenant switch changes available secrets & validations

### C) Performance
- [ ] Secrets list scales (100–1000 secrets) without UI lag (search/filter/virtualization if needed).

---

## 🧭 Dokumentation & Onboarding
- [ ] “How secrets work” kurze Produkt-Doku (1–2 min read).
- [ ] Provider Setup Guide best practices: consistent naming, requiredSecrets, apiKeyUrl.
- [ ] Examples/Templates: OpenAI, Pipedrive, SMTP.

---

## ✅ Release Gate (Go/No-Go)
- [ ] Keine UX Stelle, wo User Secret-Namen erraten muss (oder es gibt einen klaren Helper).
- [ ] Multi-tenant: kein mögliches “secret leakage” zwischen Tenants.
- [ ] Decrypt/Value exposure ist klar geregelt (Permission + Audit + UI).
- [ ] Workflow Builder zeigt actionable errors und führt zur Lösung.


