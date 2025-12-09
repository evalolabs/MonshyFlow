# Monshy Feature Roadmap

## 🎯 Priorisierte Feature-Implementierung

Basierend auf der Analyse der fehlenden Features im Vergleich zu n8n.

---

## 🔴 Phase 1: Kritische Features (Sofort)

### 1. Workflow Scheduling ⏰
**Priorität:** 🔴 **KRITISCH**  
**Geschätzte Zeit:** 2-3 Wochen  
**Impact:** Workflows können nicht automatisch ausgeführt werden

#### Implementierungsschritte:
- [ ] **Backend: Scheduler Service** (.NET)
  - [ ] Hangfire oder Quartz.NET integrieren
  - [ ] Scheduler Service erstellen
  - [ ] Cron Expression Parser
  - [ ] Workflow Execution Trigger
  
- [ ] **Backend: Workflow Model erweitern**
  - [ ] `ScheduleConfig` Feld hinzufügen
  - [ ] `IsActive` Flag für Workflow Activation
  - [ ] `LastScheduledRun` Timestamp
  
- [ ] **Backend: Scheduler Controller**
  - [ ] Endpoints für Schedule Management
  - [ ] Schedule CRUD Operations
  
- [ ] **Frontend: Schedule Configuration**
  - [ ] Cron Expression Editor
  - [ ] Schedule Preview (nächste Ausführungen)
  - [ ] Timezone Selection
  
- [ ] **Frontend: Workflow Activation Toggle**
  - [ ] Toggle in WorkflowSettingsPanel
  - [ ] Visual Status Indicator

**Dependencies:** Keine  
**Blockiert:** Workflow Automation

---

### 2. Workflow Templates 📚
**Priorität:** 🔴 **KRITISCH**  
**Geschätzte Zeit:** 2-3 Wochen  
**Impact:** User müssen jeden Workflow von Grund auf bauen

#### Implementierungsschritte:
- [ ] **Backend: Template Model**
  - [ ] Template Entity (Name, Description, Category, Tags, Workflow JSON)
  - [ ] Template Repository
  - [ ] Template Service
  
- [ ] **Backend: Template Controller**
  - [ ] GET /api/templates (Liste mit Filtering)
  - [ ] GET /api/templates/:id
  - [ ] POST /api/templates (Create)
  - [ ] PUT /api/templates/:id
  - [ ] DELETE /api/templates/:id
  - [ ] POST /api/templates/:id/use (Workflow aus Template erstellen)
  
- [ ] **Frontend: Template Gallery**
  - [ ] Template List View mit Kategorien
  - [ ] Template Card Component
  - [ ] Template Preview Modal
  - [ ] Template Search & Filter
  
- [ ] **Frontend: Template Creation**
  - [ ] "Save as Template" Button im WorkflowEditor
  - [ ] Template Creation Modal
  - [ ] Template Metadata Form
  
- [ ] **Basis-Templates erstellen:**
  - [ ] AI Agent Workflow Template
  - [ ] Data Processing Template
  - [ ] Webhook Handler Template
  - [ ] Scheduled Report Template
  - [ ] Email Automation Template
  - [ ] API Integration Template
  - [ ] Document Processing Template
  - [ ] Database Query Template
  - [ ] LLM Chat Template
  - [ ] Multi-Step Agent Template

**Dependencies:** Keine  
**Blockiert:** User Adoption

---

### 3. Mehr Nodes 🧩
**Priorität:** 🔴 **KRITISCH**  
**Geschätzte Zeit:** 4-6 Wochen (in Phasen)  
**Impact:** Sehr begrenzte Integrations-Möglichkeiten

#### Phase 3.1: Code Execution Nodes (1-2 Wochen)
- [ ] **JavaScript Code Node**
  - [ ] Node Definition in registry.json
  - [ ] Frontend: Code Editor mit Syntax Highlighting
  - [ ] Backend: Node.js Code Execution (Sandbox)
  - [ ] Security: Code Sandboxing
  
- [ ] **Python Code Node**
  - [ ] Node Definition
  - [ ] Frontend: Python Code Editor
  - [ ] Backend: Python Code Execution (Sandbox)
  - [ ] Security: Code Sandboxing

#### Phase 3.2: Data Transformation Nodes (1 Woche)
- [ ] **Set Node** - Daten setzen/überschreiben
- [ ] **Transform Node** - Daten transformieren (JSONPath, Template)
- [ ] **Filter Node** - Daten filtern basierend auf Bedingungen
- [ ] **Sort Node** - Daten sortieren
- [ ] **Split Node** - Daten aufteilen (Array → einzelne Items)

#### Phase 3.3: File Operations Nodes (1 Woche)
- [ ] **Read File Node** - Dateien lesen
- [ ] **Write File Node** - Dateien schreiben
- [ ] **List Files Node** - Dateien auflisten
- [ ] **Delete File Node** - Dateien löschen
- [ ] **Move File Node** - Dateien verschieben

#### Phase 3.4: Format Nodes (1 Woche)
- [ ] **JSON Node** - JSON Parse/Stringify
- [ ] **XML Node** - XML Parse/Stringify
- [ ] **CSV Node** - CSV Parse/Stringify
- [ ] **Excel Node** - Excel Read/Write

#### Phase 3.5: Communication Nodes (1 Woche)
- [ ] **Email Send Node** - E-Mails senden
- [ ] **Email Receive Node** - E-Mails empfangen (Trigger)
- [ ] **Slack Node** - Slack Integration
- [ ] **Teams Node** - Microsoft Teams Integration

#### Phase 3.6: Database Nodes (1 Woche)
- [ ] **PostgreSQL Node** - PostgreSQL Queries
- [ ] **MySQL Node** - MySQL Queries
- [ ] **SQL Server Node** - SQL Server Queries
- [ ] **MongoDB Node** - MongoDB Queries (erweitern)

**Dependencies:** Keine  
**Blockiert:** Platform Viability

---

## 🟡 Phase 2: Wichtige Features (Bald)

### 4. Error Workflows ⚠️
**Priorität:** 🟡 **WICHTIG**  
**Geschätzte Zeit:** 1-2 Wochen

#### Implementierungsschritte:
- [ ] **Backend: Workflow Model erweitern**
  - [ ] `ErrorWorkflowId` Feld hinzufügen
  
- [ ] **Backend: Error Handling Logic**
  - [ ] Error Detection im ExecutionService
  - [ ] Error Workflow Trigger
  - [ ] Error Context Passing
  
- [ ] **Frontend: Error Workflow Selection**
  - [ ] Dropdown im WorkflowSettingsPanel
  - [ ] Error Workflow Preview

**Dependencies:** Keine

---

### 5. Workflow Versioning 📝
**Priorität:** 🟡 **WICHTIG**  
**Geschätzte Zeit:** 2 Wochen

#### Implementierungsschritte:
- [ ] **Backend: Version Model**
  - [ ] WorkflowVersion Entity
  - [ ] Version History Storage
  - [ ] Version Comparison Logic
  
- [ ] **Backend: Version Service**
  - [ ] Auto-Versioning bei Workflow Updates
  - [ ] Version Rollback
  - [ ] Version Diff
  
- [ ] **Frontend: Version History UI**
  - [ ] Version List View
  - [ ] Version Comparison View
  - [ ] Rollback Button

**Dependencies:** Keine

---

### 6. Execution History & Logging 📋
**Priorität:** 🟡 **WICHTIG**  
**Geschätzte Zeit:** 1-2 Wochen

#### Implementierungsschritte:
- [ ] **Backend: Execution History erweitern**
  - [ ] Detaillierte Logs pro Node
  - [ ] Execution Filtering (Status, Date, User)
  - [ ] Execution Search
  
- [ ] **Backend: Execution Export**
  - [ ] JSON Export
  - [ ] CSV Export
  
- [ ] **Frontend: History View**
  - [ ] Execution List mit Filtering
  - [ ] Execution Details View
  - [ ] Export Buttons

**Dependencies:** Keine

---

### 7. Workflow Activation ▶️⏸️
**Priorität:** 🟡 **WICHTIG**  
**Geschätzte Zeit:** 3-5 Tage

#### Implementierungsschritte:
- [ ] **Backend: IsActive Flag**
  - [ ] Workflow Model erweitern
  - [ ] Activation/Deactivation Logic
  
- [ ] **Frontend: Activation Toggle**
  - [ ] Toggle in WorkflowSettingsPanel
  - [ ] Status Badge
  - [ ] Confirmation Dialog

**Dependencies:** Scheduling (Phase 1)

---

## 🟢 Phase 3: Nice-to-have Features (Später)

### 8. API Keys 🔐
**Priorität:** 🟢 **NICE-TO-HAVE**  
**Geschätzte Zeit:** 1-2 Wochen

#### Implementierungsschritte:
- [ ] **Backend: API Key Model**
  - [ ] APIKey Entity
  - [ ] Key Generation (Secure)
  - [ ] Key Hashing
  
- [ ] **Backend: API Key Service**
  - [ ] Key Generation
  - [ ] Key Rotation
  - [ ] Key Permissions
  
- [ ] **Backend: API Key Authentication**
  - [ ] Middleware für API Key Auth
  - [ ] Key Validation
  
- [ ] **Frontend: API Key Management**
  - [ ] API Key List
  - [ ] Create/Delete Keys
  - [ ] Key Permissions UI

**Dependencies:** Keine

---

### 9. Workflow Notifications 🔔
**Priorität:** 🟢 **NICE-TO-HAVE**  
**Geschätzte Zeit:** 2-3 Wochen

#### Implementierungsschritte:
- [ ] **Backend: Notification Service**
  - [ ] Notification Templates
  - [ ] Notification Channels (Email, Slack, Teams)
  
- [ ] **Backend: Notification Nodes**
  - [ ] Email Notification Node
  - [ ] Slack Notification Node
  - [ ] Teams Notification Node
  
- [ ] **Backend: Workflow Notification Settings**
  - [ ] Notification on Success
  - [ ] Notification on Failure
  - [ ] Notification Recipients
  
- [ ] **Frontend: Notification Settings UI**
  - [ ] Settings im WorkflowSettingsPanel
  - [ ] Notification Channel Configuration

**Dependencies:** Communication Nodes (Phase 1.3)

---

### 10. Workflow Analytics 📊
**Priorität:** 🟢 **NICE-TO-HAVE**  
**Geschätzte Zeit:** 2-3 Wochen

#### Implementierungsschritte:
- [ ] **Backend: Analytics Service**
  - [ ] Execution Statistics
  - [ ] Success/Failure Rates
  - [ ] Execution Time Metrics
  - [ ] Node Performance Metrics
  
- [ ] **Backend: Analytics Endpoints**
  - [ ] GET /api/analytics/workflow/:id
  - [ ] GET /api/analytics/overview
  
- [ ] **Frontend: Analytics Dashboard**
  - [ ] Charts (Success Rate, Execution Time)
  - [ ] Node Performance View
  - [ ] Time-based Analytics

**Dependencies:** Execution History (Phase 2)

---

### 11. SSO (Single Sign-On) 🔑
**Priorität:** 🟢 **NICE-TO-HAVE**  
**Geschätzte Zeit:** 2-3 Wochen

#### Implementierungsschritte:
- [ ] **Backend: SSO Provider Integration**
  - [ ] SAML Support
  - [ ] OAuth2 Support
  - [ ] LDAP/Active Directory
  
- [ ] **Backend: SSO Configuration**
  - [ ] SSO Settings Model
  - [ ] SSO Service
  
- [ ] **Frontend: SSO Login**
  - [ ] SSO Login Button
  - [ ] SSO Configuration UI (Admin)

**Dependencies:** Keine (Enterprise Feature)

---

### 12. Workflow Sharing 🔗
**Priorität:** 🟢 **NICE-TO-HAVE**  
**Geschätzte Zeit:** 1-2 Wochen

#### Implementierungsschritte:
- [ ] **Backend: Workflow Sharing**
  - [ ] Share Links (Public/Private)
  - [ ] Share Permissions
  - [ ] Workflow Import/Export
  
- [ ] **Frontend: Share UI**
  - [ ] Share Button
  - [ ] Share Link Generation
  - [ ] Import/Export Buttons

**Dependencies:** Templates (Phase 1)

---

## 📅 Implementierungs-Timeline

### Q1 (Wochen 1-12)
- ✅ **Woche 1-3:** Workflow Scheduling
- ✅ **Woche 4-6:** Workflow Templates
- ✅ **Woche 7-12:** Mehr Nodes (Phase 1-3)

### Q2 (Wochen 13-24)
- ✅ **Woche 13-14:** Error Workflows
- ✅ **Woche 15-16:** Workflow Versioning
- ✅ **Woche 17-18:** Execution History
- ✅ **Woche 19:** Workflow Activation
- ✅ **Woche 20-24:** Mehr Nodes (Phase 4-6)

### Q3 (Wochen 25-36)
- ✅ **Woche 25-26:** API Keys
- ✅ **Woche 27-29:** Workflow Notifications
- ✅ **Woche 30-32:** Workflow Analytics
- ✅ **Woche 33-35:** SSO (optional)
- ✅ **Woche 36:** Workflow Sharing

---

## 🎯 Quick Wins (Schnell umsetzbar)

Diese Features können schnell implementiert werden und haben hohen Impact:

1. **Workflow Activation Toggle** (3-5 Tage)
   - Einfach zu implementieren
   - Sofortiger Nutzen für Production

2. **Workflow Tags** (2-3 Tage)
   - Einfaches Feature
   - Bessere Organisation

3. **Execution Export** (2-3 Tage)
   - Einfache Implementierung
   - Hoher Nutzen für Debugging

4. **Template Import/Export** (3-5 Tage)
   - Basis für Templates
   - Ermöglicht Template-Sharing

---

## 📊 Feature Impact Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Scheduling | 🔴 Hoch | 🟡 Mittel | 1 |
| Templates | 🔴 Hoch | 🟡 Mittel | 2 |
| Mehr Nodes | 🔴 Hoch | 🔴 Hoch | 3 |
| Error Workflows | 🟡 Mittel | 🟢 Niedrig | 4 |
| Versioning | 🟡 Mittel | 🟡 Mittel | 5 |
| Execution History | 🟡 Mittel | 🟢 Niedrig | 6 |
| Activation | 🟡 Mittel | 🟢 Niedrig | 7 |
| API Keys | 🟢 Niedrig | 🟡 Mittel | 8 |
| Notifications | 🟡 Mittel | 🟡 Mittel | 9 |
| Analytics | 🟢 Niedrig | 🔴 Hoch | 10 |

---

## 🚀 Nächste Schritte

1. **Sofort starten:** Workflow Scheduling (Phase 1.1)
2. **Parallel:** Workflow Templates (Phase 1.2)
3. **Danach:** Code Execution Nodes (Phase 1.3.1)

**Empfehlung:** Mit Scheduling beginnen, da es kritisch ist und relativ schnell implementiert werden kann.

