# API Integrations Reference

Diese Datei enthält alle Informationen über APIs, Ressourcen und Operationen, die in Monshy implementiert werden können.

## Übersicht

Diese Datei dient als Referenz für die Implementierung von API-Integrationen in `shared/registry.json`. Jede API ist mit ihren Ressourcen, Operationen, Authentifizierungsmethoden und Endpoint-Details dokumentiert.

---

## 🎨 Node-Farben Status

API-Integrationen können benutzerdefinierte Farben für die visuelle Darstellung der Nodes im Workflow Builder haben. Die Farben werden in der `color`-Eigenschaft jeder API-Integration definiert.

### ✅ API-Integrationen mit Farben (17 von 216)

| API | Farbe | Gradient |
|-----|-------|----------|
| **Pipedrive** | Teal-Emerald | `from-teal-100 to-emerald-100` |
| **Slack** | Purple-Pink | `from-purple-100 to-pink-100` |
| **Shopify** | Emerald-Green | `from-emerald-100 to-green-100` |
| **Salesforce** | Cyan-Blue | `from-cyan-100 to-blue-100` |
| **HubSpot** | Orange-Amber | `from-orange-100 to-amber-100` |
| **Stripe** | Indigo-Violet | `from-indigo-100 to-violet-100` |
| **Google Sheets** | Green-Emerald | `from-green-100 to-emerald-100` |
| **Jira** | Blue-Sky | `from-blue-100 to-sky-100` |
| **Airtable** | Cyan-Sky | `from-cyan-100 to-sky-100` |
| **Notion** | Stone-Neutral | `from-stone-100 to-neutral-100` |
| **Zendesk** | Lime-Green | `from-lime-100 to-green-100` |
| **Twilio** | Red-Rose | `from-red-100 to-rose-100` |
| **GitHub** | Slate-Gray | `from-slate-100 to-gray-100` |
| **Trello** | Sky-Blue | `from-sky-100 to-blue-100` |
| **Asana** | Pink-Rose | `from-pink-100 to-rose-100` |
| **Mailchimp** | Yellow-Amber | `from-yellow-100 to-amber-100` |
| **Zoom** | Blue-Indigo | `from-blue-100 to-indigo-100` |

### ❌ API-Integrationen ohne Farben (199 noch zu aktualisieren)

Die folgenden API-Integrationen haben noch keine benutzerdefinierten Farben und verwenden die Standard-Kategorie-Farbe (`integration` = Green):

- ClickUp, Monday, Intercom, SendGrid, Discord, Telegram, WooCommerce, PayPal, Linear, MongoDB, PostgreSQL, MySQL, Twitter, LinkedIn, Microsoft Teams, Microsoft Outlook, Microsoft OneDrive, Microsoft SharePoint, WhatsApp, MessageBird, Vonage, Mattermost, Copper, Freshworks CRM, ActiveCampaign, Salesmate, Keap, Mailgun, Postmark, Supabase, QuickBooks Online, Xero, HelpScout, ServiceNow, Todoist, Harvest, Clockify, Toggl, Gumroad, Magento2, Paddle, Chargebee, Brevo, ConvertKit, Freshdesk, Freshservice, GitLab, Bitbucket, Typeform, Jotform, Calendly, AWS S3, Google Drive, Dropbox, Box, Google Analytics, PostHog, Segment, Contentful, Storyblok, Strapi, Ghost, WordPress, Webflow, OpenAI, Mistral AI, DeepL, Zoho CRM, Okta, Odoo, Coda, Bannerbear, Mindee, Baserow, Microsoft Excel, Microsoft Todo, Microsoft Entra, Microsoft Dynamics CRM, Azure Cosmos DB, Azure Storage, Jenkins, Netlify, Google Calendar, Grafana, Sentry, Facebook Graph, Facebook Lead Ads, CircleCI, TravisCI, UptimeRobot, SecurityScorecard, Wise, Invoice Ninja, RocketChat, Line Notify, Reddit, Medium, Hacker News, Metabase, Mandrill, Mailjet, Nextcloud, Grist, Seatable, NocoDB, Stackby, Taiga, Wekan, Orbit, ProfitWell, Tapfiliate, Formstack, Formio, Wufoo, SurveyMonkey, Kobotoolbox, Acuity Scheduling, GoToWebinar, Eventbrite, Zammad, Gong, ERPNext, QuickBase, FileMaker, Perplexity, Jina AI, Humantic AI, Rundeck, Unleashed Software, SMS77, Mocean, Spontit, Pushbullet, Pushover, Gotify, Matrix, Cal, Microsoft Graph Security, Affinity, Agile CRM, Autopilot, Egoi, GetResponse, Lemlist, MailerLite, Sendy, Mautic, TheHive, Cortex, Elastic Security, Cisco WebEx, One Simple API, TheHive5, Cockpit, Adalo, Bubble, Customer.io, Google Docs, Google Translate, Airtop, Flow, Bitwarden, Zulip, Beeminder, Onfleet, Google Chat, Google BigQuery, Google G Suite Admin, Google YouTube, Figma, Spotify, PagerDuty, Strava, Splunk, Workable, BambooHR, Iterable, Drift, Discourse, Disqus, HighLevel, Hunter, Clearbit, Brandfetch, Dropcontact, Uplead, CrateDB, QuestDB, TimescaleDB, Snowflake, MISP, Uproc, Kitemaker, Emelia

**Hinweis:** Um eine Farbe hinzuzufügen, füge die `color`-Eigenschaft in der entsprechenden JSON-Datei in `shared/apiIntegrations/` hinzu:

```json
{
  "id": "api-name",
  "name": "API Name",
  "baseUrl": "...",
  "color": {
    "bg": "from-{color}-100 to-{color}-100",
    "border": "border-{color}-500",
    "icon": "text-{color}-700",
    "handle": "bg-{color}-600"
  },
  "authentication": { ... }
}
```

Verwende eindeutige Farbkombinationen, um Verwechslungen zu vermeiden.

---

## 1. Pipedrive ✅ Implementiert

**Base URL:** `https://api.pipedrive.com/v1`  
**Authentication:** API Token (Query Parameter: api_token) oder OAuth2  
**Secret Key:** `PIPEDRIVE_API_KEY`  
**Hinweis:** Pipedrive verwendet Query-Parameter-Authentifizierung. Der API-Token wird als `?api_token={token}` in der URL übergeben.

### Ressourcen und Operationen

#### Activity
- **Create** - `POST /activities`
- **Delete** - `DELETE /activities/{id}`
- **Get** - `GET /activities/{id}`
- **Get All** - `GET /activities`
- **Update** - `PUT /activities/{id}`

#### Deal
- **Create** - `POST /deals`
- **Delete** - `DELETE /deals/{id}`
- **Duplicate** - `POST /deals/{id}/duplicate`
- **Get** - `GET /deals/{id}`
- **Get All** - `GET /deals`
- **Search** - `GET /deals/search`
- **Update** - `PUT /deals/{id}`

#### Deal Activity
- **Get All** - `GET /deals/{id}/activities`

#### Deal Product
- **Add** - `POST /deals/{id}/products`
- **Get All** - `GET /deals/{id}/products`
- **Remove** - `DELETE /deals/{id}/products/{productId}`

#### File
- **Upload** - `POST /files`
- **Get** - `GET /files/{id}`
- **Get All** - `GET /files`
- **Delete** - `DELETE /files/{id}`

#### Lead
- **Create** - `POST /leads`
- **Get** - `GET /leads/{id}`
- **Get All** - `GET /leads`

#### Note
- **Create** - `POST /notes`
- **Get All** - `GET /notes`

#### Organization
- **Create** - `POST /organizations`
- **Get** - `GET /organizations/{id}`
- **Get All** - `GET /organizations`
- **Search** - `GET /organizations/search`
- **Update** - `PUT /organizations/{id}`

#### Person
- **Create** - `POST /persons`
- **Get** - `GET /persons/{id}`
- **Get All** - `GET /persons`
- **Search** - `GET /persons/search`
- **Update** - `PUT /persons/{id}`

#### Product
- **Get All** - `GET /products`

---

## 2. Salesforce ✅ Implementiert

**Base URL:** `https://{instance}.salesforce.com/services/data/v{version}` (z.B. v57.0)  
**Authentication:** OAuth2 oder OAuth2 JWT  
**Secret Key:** `SALESFORCE_ACCESS_TOKEN` (für OAuth2)

### Ressourcen und Operationen

#### Account
- **Create** - `POST /sobjects/Account`
- **Get** - `GET /sobjects/Account/{id}`
- **Get All** - `GET /query?q=SELECT ... FROM Account`
- **Update** - `PATCH /sobjects/Account/{id}`

#### Attachment
- **Get All** - `GET /query?q=SELECT ... FROM Attachment`

#### Case
- **Create** - `POST /sobjects/Case`
- **Get** - `GET /sobjects/Case/{id}`
- **Get All** - `GET /query?q=SELECT ... FROM Case`
- **Update** - `PATCH /sobjects/Case/{id}`

#### Contact
- **Create** - `POST /sobjects/Contact`
- **Delete** - `DELETE /sobjects/Contact/{id}`
- **Get** - `GET /sobjects/Contact/{id}`
- **Get All** - `GET /query?q=SELECT ... FROM Contact`
- **Update** - `PATCH /sobjects/Contact/{id}`
- **Upsert** - `PATCH /sobjects/Contact/{id}` (mit external ID)
- **Add to Campaign** - `POST /sobjects/CampaignMember`

#### Custom Object
- **Create** - `POST /sobjects/{CustomObject}`
- **Delete** - `DELETE /sobjects/{CustomObject}/{id}`
- **Get** - `GET /sobjects/{CustomObject}/{id}`
- **Get All** - `GET /query?q=SELECT ... FROM {CustomObject}`
- **Update** - `PATCH /sobjects/{CustomObject}/{id}`
- **Upsert** - `PATCH /sobjects/{CustomObject}/{id}` (mit external ID)

#### Document
- **Upload** - `POST /sobjects/ContentVersion`

#### Flow
- **Invoke** - `POST /actions/custom/flow/{flowApiName}`

#### Lead
- **Create** - `POST /sobjects/Lead`
- **Get** - `GET /sobjects/Lead/{id}`
- **Get All** - `GET /query?q=SELECT ... FROM Lead`
- **Update** - `PATCH /sobjects/Lead/{id}`
- **Upsert** - `PATCH /sobjects/Lead/{id}` (mit external ID)
- **Add Note** - `POST /sobjects/Note`
- **Add to Campaign** - `POST /sobjects/CampaignMember`

#### Opportunity
- **Create** - `POST /sobjects/Opportunity`
- **Get** - `GET /sobjects/Opportunity/{id}`
- **Get All** - `GET /query?q=SELECT ... FROM Opportunity`
- **Get Summary** - `GET /sobjects/Opportunity/{id}?fields=...`
- **Update** - `PATCH /sobjects/Opportunity/{id}`

#### Search
- **Query** - `GET /query?q={SOQL}`

#### Task
- **Create** - `POST /sobjects/Task`
- **Get** - `GET /sobjects/Task/{id}`
- **Get All** - `GET /query?q=SELECT ... FROM Task`
- **Update** - `PATCH /sobjects/Task/{id}`

#### User
- **Get All** - `GET /query?q=SELECT ... FROM User`

---

## 3. Slack ✅ Implementiert

**Base URL:** `https://slack.com/api`  
**Authentication:** Access Token (Bearer) oder OAuth2  
**Secret Key:** `SLACK_BOT_TOKEN` (für Access Token)

### Ressourcen und Operationen (V2.3)

#### Channel
- **Create** - `POST /conversations.create`
- **Get** - `GET /conversations.info`
- **Get All** - `GET /conversations.list`
- **History** - `GET /conversations.history`
- **Invite** - `POST /conversations.invite`
- **Join** - `POST /conversations.join`
- **Member** - `GET /conversations.members`
- **Open** - `POST /conversations.open`
- **Replies** - `GET /conversations.replies`
- **Set Topic** - `POST /conversations.setTopic`

#### File
- **Get** - `GET /files.info`
- **Get All** - `GET /files.list`
- **Upload** - `POST /files.upload`

#### Message
- **Delete** - `POST /chat.delete`
- **Get Permalink** - `GET /chat.getPermalink`
- **Post** - `POST /chat.postMessage`
- **Search** - `GET /search.messages`
- **Send and Wait** - `POST /chat.postMessage` (mit Webhook)
- **Update** - `POST /chat.update`

#### Reaction
- **Add** - `POST /reactions.add`
- **Get** - `GET /reactions.get`
- **Remove** - `POST /reactions.remove`

#### Star
- (Weitere Operationen verfügbar)

#### User
- **Get All** - `GET /users.list`
- **Get Presence** - `GET /users.getPresence`
- **Get Profile** - `GET /users.profile.get`
- **Info** - `GET /users.info`
- **Update Profile** - `POST /users.profile.set`

#### User Group
- **Create** - `POST /usergroups.create`
- **Disable** - `POST /usergroups.disable`
- **Enable** - `POST /usergroups.enable`
- **Get All** - `GET /usergroups.list`
- **Update** - `POST /usergroups.update`

---

## 4. HubSpot ✅ Implementiert

**Base URL:** `https://api.hubapi.com`  
**Authentication:** API Key, APP Token oder OAuth2  
**Secret Key:** `HUBSPOT_API_KEY` (für API Key)

### Ressourcen und Operationen (V2.2)

#### Company
- **Create** - `POST /crm/v3/objects/companies`
- **Get All** - `GET /crm/v3/objects/companies`
- **Search by Domain** - `GET /crm/v3/objects/companies/search`
- **Update** - `PATCH /crm/v3/objects/companies/{id}`

#### Contact
- **Get** - `GET /crm/v3/objects/contacts/{id}`
- **Get All** - `GET /crm/v3/objects/contacts`
- **Get Recently Created/Updated** - `GET /crm/v3/objects/contacts/recent`
- **Search** - `POST /crm/v3/objects/contacts/search`
- **Upsert** - `POST /crm/v3/objects/contacts/batch/upsert`

#### Contact List
- **Add** - `PUT /contacts/v1/lists/{listId}/add`

#### Deal
- **Get All** - `GET /crm/v3/objects/deals`
- **Search** - `POST /crm/v3/objects/deals/search`

#### Engagement
- **Create** - `POST /engagements/v1/engagements`
- **Get** - `GET /engagements/v1/engagements/{id}`
- **Get All** - `GET /engagements/v1/engagements`

#### Ticket
- **Delete** - `DELETE /crm/v3/objects/tickets/{id}`
- **Get** - `GET /crm/v3/objects/tickets/{id}`
- **Get All** - `GET /crm/v3/objects/tickets`

---

## 5. Shopify ✅ Implementiert

**Base URL:** `https://{shop}.myshopify.com/admin/api/{version}` (z.B. 2024-01)  
**Authentication:** API Key, Access Token oder OAuth2  
**Secret Key:** `SHOPIFY_ACCESS_TOKEN` (für Access Token)

### Ressourcen und Operationen

#### Order
- **Get** - `GET /orders/{id}.json`
- **Get All** - `GET /orders.json`

#### Product
- **Create** - `POST /products.json`
- **Get** - `GET /products/{id}.json`
- **Get All** - `GET /products.json`
- **Update** - `PUT /products/{id}.json`

---

## 6. Stripe ✅ Implementiert

**Base URL:** `https://api.stripe.com/v1`  
**Authentication:** API Key (Bearer)  
**Secret Key:** `STRIPE_SECRET_KEY`

### Ressourcen und Operationen

#### Balance
- **Get** - `GET /balance`

#### Charge
- **Get** - `GET /charges/{id}`
- **Get All** - `GET /charges`

#### Coupon
- (Weitere Operationen verfügbar)

#### Customer
- **Create** - `POST /customers`
- **Get** - `GET /customers/{id}`
- **Get All** - `GET /customers`
- **Update** - `POST /customers/{id}`

#### Customer Card
- **Add** - `POST /customers/{customerId}/sources`
- **Remove** - `DELETE /customers/{customerId}/sources/{cardId}`
- **Get** - `GET /customers/{customerId}/sources/{sourceId}`

#### Source
- (Weitere Operationen verfügbar)

#### Token
- (Weitere Operationen verfügbar)

---

## 7. Google Sheets ✅ Implementiert

**Base URL:** `https://sheets.googleapis.com/v4/spreadsheets`  
**Authentication:** Service Account oder OAuth2  
**Secret Key:** `GOOGLE_SHEETS_ACCESS_TOKEN` (für OAuth2)

### Ressourcen und Operationen (V4.7)

#### Spreadsheet
- **Create** - `POST /spreadsheets`
- **Get** - `GET /{spreadsheetId}`
- **Get All** - (über Drive API)

#### Sheet
- **Append** - `POST /{spreadsheetId}/values/{range}:append`
- **Clear** - `POST /{spreadsheetId}/values/{range}:clear`
- **Delete** - `DELETE /{spreadsheetId}/sheets/{sheetId}`
- **Get** - `GET /{spreadsheetId}/values/{range}`
- **Get All** - `GET /{spreadsheetId}/values/{range}`
- **Update** - `PUT /{spreadsheetId}/values/{range}`
- **Batch Update** - `POST /{spreadsheetId}/values:batchUpdate`

---

## 8. Jira ✅ Implementiert

**Base URL:** `https://{domain}.atlassian.net/rest/api/3` (für Cloud)  
**Authentication:** Basic Auth (email:apiToken) oder OAuth2  
**Secret Key:** `JIRA_API_TOKEN`  
**Email Secret Key:** `JIRA_EMAIL` (für Basic Auth)

### Ressourcen und Operationen

#### Issue
- **Create** - `POST /issue`
- **Get** - `GET /issue/{issueIdOrKey}`
- **Get All** - `GET /search?jql=...`
- **Update** - `PUT /issue/{issueIdOrKey}`
- **Changelog** - `GET /issue/{issueIdOrKey}/changelog`
- **Transitions** - `GET /issue/{issueIdOrKey}/transitions`

#### Issue Attachment
- **Add** - `POST /issue/{issueIdOrKey}/attachments`
- **Get** - `GET /attachment/{id}`
- **Get All** - `GET /issue/{issueIdOrKey}/attachments`

#### Issue Comment
- **Add** - `POST /issue/{issueIdOrKey}/comment`
- **Get All** - `GET /issue/{issueIdOrKey}/comment`

#### User
- **Get** - `GET /user?accountId={accountId}`

---

## Implementierungsnotizen

### Gemeinsame Patterns

1. **Authentication:**
   - API Key (Header): `Bearer {apiKey}` im Authorization Header
   - API Key (Query Parameter): `?api_token={token}` oder `?api_key={key}` in der URL
   - OAuth2: `Bearer {accessToken}` im Authorization Header
   - Basic Auth: `Basic {base64(email:apiToken)}` im Authorization Header
   
   **Hinweis:** Einige APIs verwenden Query-Parameter-Authentifizierung statt Header:
   - Pipedrive: `?api_token={token}`
   - Hunter.io: `?api_key={key}`
   - PostHog: `?api_key={key}`
   - Storyblok (Content API): `?token={token}`
   - Pushover: `?token={token}&user={userKey}`
   - One Simple API: `?token={token}`
   - Humantic AI: `?apikey={key}`

2. **URL Templates:**
   - Verwende Platzhalter wie `{id}`, `{domain}`, `{shop}` für dynamische Werte
   - Beispiel: `https://api.pipedrive.com/v1/deals/{dealId}`

3. **Body Schemas:**
   - Definiere `bodySchema` für POST/PUT/PATCH Requests
   - Markiere `required` Felder
   - Verwende `description` für jedes Feld

4. **Query Parameters:**
   - Definiere `queryParams` für GET Requests
   - Verwende Platzhalter wie `{searchTerm}` für dynamische Werte

5. **Headers:**
   - Standard: `Content-Type: application/json`
   - Bei Bedarf: `Content-Type: application/x-www-form-urlencoded` (z.B. Stripe)

6. **Expression Resolution und Array-Zugriff:**
   - API-Responses werden automatisch als JSON geparst und in `json`-Feld verfügbar gemacht
   - **Array-Zugriff:** Wenn eine API ein Array zurückgibt (z.B. `{"data": [...]}`), kann direkt darauf zugegriffen werden:
     - `{{steps.http-request-1.json.data.field}}` → automatisch erstes Element (`data[0].field`)
     - `{{steps.http-request-1.json.data[0].field}}` → expliziter Index
     - `{{steps.http-request-1.json.data.length}}` → Array-Länge
   - **Beispiel (Pipedrive):** `{{steps.pipedrive-request.json.data.user_id}}` greift auf `data[0].user_id` zu
   - **Verschachtelte Arrays:** `{{steps.node.json.data[0].items[1].name}}` wird unterstützt
   
   **Hinweis:** Die automatische Array-Auflösung macht die Expression-Syntax benutzerfreundlicher. Wenn `data` ein Array ist, funktioniert `data.field` automatisch und greift auf das erste Element zu.

### Nächste Schritte

1. Für jede API:
   - Erstelle Eintrag in `apiIntegrations` Array in `registry.json`
   - Definiere `baseUrl`, `authentication`, `logoUrl`
   - Füge alle `endpoints` mit vollständigen Details hinzu

2. Priorisierung:
   - Beginne mit den wichtigsten Endpoints pro API
   - Erweitere schrittweise um weitere Operationen

3. Testing:
   - Teste jeden Endpoint nach Implementierung
   - Validiere Request/Response Strukturen

---

---

## 9. Airtable ✅ Implementiert

**Base URL:** `https://api.airtable.com/v0/{baseId}`  
**Authentication:** Personal Access Token (Bearer)  
**Secret Key:** `AIRTABLE_PERSONAL_ACCESS_TOKEN`

### Ressourcen und Operationen (V2.1)

#### Table
- **Create Record** - `POST /{tableId}`
- **Get Record** - `GET /{tableId}/{recordId}`
- **Get All Records** - `GET /{tableId}`
- **Update Record** - `PATCH /{tableId}/{recordId}`
- **Delete Record** - `DELETE /{tableId}/{recordId}`
- **Search Records** - `GET /{tableId}?filterByFormula=...`

---

## 10. Notion ✅ Implementiert

**Base URL:** `https://api.notion.com/v1`  
**Authentication:** OAuth2 (Bearer)  
**Secret Key:** `NOTION_ACCESS_TOKEN`

### Ressourcen und Operationen (V2.2)

#### Block
- **Append** - `PATCH /blocks/{blockId}/children`
- **Get All** - `GET /blocks/{blockId}/children`
- **Get** - `GET /blocks/{blockId}`
- **Update** - `PATCH /blocks/{blockId}`

#### Database
- **Create** - `POST /databases`
- **Get** - `GET /databases/{databaseId}`
- **Query** - `POST /databases/{databaseId}/query`
- **Update** - `PATCH /databases/{databaseId}`

#### Page
- **Create** - `POST /pages`
- **Get** - `GET /pages/{pageId}`
- **Update** - `PATCH /pages/{pageId}`

#### User
- **Get** - `GET /users/{userId}`
- **Get All** - `GET /users`

---

## 11. Zendesk ✅ Implementiert

**Base URL:** `https://{subdomain}.zendesk.com/api/v2`  
**Authentication:** API Token (Basic Auth) oder OAuth2  
**Secret Key:** `ZENDESK_API_TOKEN`  
**Email Secret Key:** `ZENDESK_EMAIL` (für Basic Auth)

### Ressourcen und Operationen

#### Ticket
- **Create** - `POST /tickets.json`
- **Delete** - `DELETE /tickets/{id}.json`
- **Get** - `GET /tickets/{id}.json`
- **Get All** - `GET /tickets.json`
- **Update** - `PUT /tickets/{id}.json`

#### Ticket Field
- **Get All** - `GET /ticket_fields.json`

#### User
- **Create** - `POST /users.json`
- **Delete** - `DELETE /users/{id}.json`
- **Get** - `GET /users/{id}.json`
- **Get All** - `GET /users.json`
- **Search** - `GET /users/search.json`
- **Update** - `PUT /users/{id}.json`

#### Organization
- **Create** - `POST /organizations.json`
- **Delete** - `DELETE /organizations/{id}.json`
- **Get** - `GET /organizations/{id}.json`
- **Get All** - `GET /organizations.json`
- **Search** - `GET /organizations/search.json`
- **Update** - `PUT /organizations/{id}.json`

---

## 12. Twilio ✅ Implementiert

**Base URL:** `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}`  
**Authentication:** Basic Auth (AccountSid:AuthToken)  
**Secret Key:** `TWILIO_AUTH_TOKEN`  
**Account SID Secret Key:** `TWILIO_ACCOUNT_SID`

### Ressourcen und Operationen

#### SMS
- **Send** - `POST /Messages.json`

#### Call
- **Make** - `POST /Calls.json`

---

## 13. GitHub ✅ Implementiert

**Base URL:** `https://api.github.com`  
**Authentication:** Access Token (Bearer) oder OAuth2  
**Secret Key:** `GITHUB_ACCESS_TOKEN`

### Ressourcen und Operationen

#### File
- **Create** - `PUT /repos/{owner}/{repo}/contents/{path}`
- **Get** - `GET /repos/{owner}/{repo}/contents/{path}`
- **Delete** - `DELETE /repos/{owner}/{repo}/contents/{path}`

#### Issue
- **Create** - `POST /repos/{owner}/{repo}/issues`
- **Get** - `GET /repos/{owner}/{repo}/issues/{issueNumber}`
- **Get All** - `GET /repos/{owner}/{repo}/issues`
- **Update** - `PATCH /repos/{owner}/{repo}/issues/{issueNumber}`

#### Organization
- **Get** - `GET /orgs/{org}`
- **Get All** - `GET /user/orgs`

#### Release
- **Create** - `POST /repos/{owner}/{repo}/releases`
- **Get** - `GET /repos/{owner}/{repo}/releases/{id}`
- **Get All** - `GET /repos/{owner}/{repo}/releases`
- **Update** - `PATCH /repos/{owner}/{repo}/releases/{id}`

#### Repository
- **Create** - `POST /user/repos` oder `POST /orgs/{org}/repos`
- **Get** - `GET /repos/{owner}/{repo}`
- **Get All** - `GET /user/repos` oder `GET /orgs/{org}/repos`
- **Update** - `PATCH /repos/{owner}/{repo}`

#### Review
- **Create** - `POST /repos/{owner}/{repo}/pulls/{pullNumber}/reviews`
- **Get All** - `GET /repos/{owner}/{repo}/pulls/{pullNumber}/reviews`

#### User
- **Get** - `GET /users/{username}`
- **Get Authenticated User** - `GET /user`

#### Workflow
- **Dispatch** - `POST /repos/{owner}/{repo}/actions/workflows/{workflowId}/dispatches`
- **Get** - `GET /repos/{owner}/{repo}/actions/workflows/{workflowId}`
- **Get All** - `GET /repos/{owner}/{repo}/actions/workflows`

---

## 14. Trello ✅ Implementiert

**Base URL:** `https://api.trello.com/1`  
**Authentication:** API Key + Token  
**Secret Key:** `TRELLO_API_TOKEN`  
**API Key Secret Key:** `TRELLO_API_KEY`

### Ressourcen und Operationen

#### Attachment
- **Add** - `POST /cards/{id}/attachments`
- **Delete** - `DELETE /cards/{id}/attachments/{idAttachment}`
- **Get** - `GET /cards/{id}/attachments/{idAttachment}`
- **Get All** - `GET /cards/{id}/attachments`

#### Board
- **Create** - `POST /boards`
- **Delete** - `DELETE /boards/{id}`
- **Get** - `GET /boards/{id}`
- **Get All** - `GET /members/me/boards`
- **Update** - `PUT /boards/{id}`

#### Board Member
- **Add** - `PUT /boards/{id}/members/{idMember}`
- **Get All** - `GET /boards/{id}/members`
- **Remove** - `DELETE /boards/{id}/members/{idMember}`

#### Card
- **Create** - `POST /cards`
- **Delete** - `DELETE /cards/{id}`
- **Get** - `GET /cards/{id}`
- **Get All** - `GET /boards/{id}/cards` oder `GET /lists/{id}/cards`
- **Update** - `PUT /cards/{id}`

#### Card Comment
- **Add** - `POST /cards/{id}/actions/comments`
- **Delete** - `DELETE /actions/{id}`
- **Get All** - `GET /cards/{id}/actions?filter=commentCard`

#### Checklist
- **Add** - `POST /cards/{id}/checklists`
- **Delete** - `DELETE /checklists/{id}`
- **Get** - `GET /checklists/{id}`
- **Get All** - `GET /cards/{id}/checklists`
- **Update** - `PUT /checklists/{id}`

#### Label
- **Add** - `POST /boards/{id}/labels`
- **Delete** - `DELETE /labels/{id}`
- **Get All** - `GET /boards/{id}/labels`
- **Update** - `PUT /labels/{id}`

#### List
- **Archive** - `PUT /lists/{id}/closed`
- **Create** - `POST /lists`
- **Get** - `GET /lists/{id}`
- **Get All** - `GET /boards/{id}/lists`
- **Update** - `PUT /lists/{id}`

---

## 15. Asana ✅ Implementiert

**Base URL:** `https://app.asana.com/api/1.0`  
**Authentication:** Access Token (Bearer) oder OAuth2  
**Secret Key:** `ASANA_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Project
- **Create** - `POST /projects`
- **Get** - `GET /projects/{projectGid}`
- **Get All** - `GET /projects`
- **Update** - `PUT /projects/{projectGid}`

#### Subtask
- **Create** - `POST /tasks/{taskGid}/subtasks`
- **Get All** - `GET /tasks/{taskGid}/subtasks`

#### Task
- **Create** - `POST /tasks`
- **Delete** - `DELETE /tasks/{taskGid}`
- **Get** - `GET /tasks/{taskGid}`
- **Get All** - `GET /tasks`
- **Update** - `PUT /tasks/{taskGid}`

#### Task Comment
- **Create** - `POST /tasks/{taskGid}/stories`
- **Get All** - `GET /tasks/{taskGid}/stories`

#### Task Project
- **Add** - `POST /tasks/{taskGid}/addProject`
- **Remove** - `POST /tasks/{taskGid}/removeProject`

#### Task Tag
- **Add** - `POST /tasks/{taskGid}/addTag`
- **Remove** - `POST /tasks/{taskGid}/removeTag`

#### User
- **Get** - `GET /users/{userGid}`
- **Get All** - `GET /users`

---

## 16. Mailchimp ✅ Implementiert

**Base URL:** `https://{dc}.api.mailchimp.com/3.0` (dc = data center, z.B. us1)  
**Authentication:** API Key oder OAuth2  
**Secret Key:** `MAILCHIMP_API_KEY`

### Ressourcen und Operationen

#### Campaign
- **Create** - `POST /campaigns`
- **Get** - `GET /campaigns/{campaignId}`
- **Get All** - `GET /campaigns`
- **Send** - `POST /campaigns/{campaignId}/actions/send`
- **Update** - `PATCH /campaigns/{campaignId}`

#### List Group
- **Create** - `POST /lists/{listId}/interest-categories/{interestCategoryId}/interests`
- **Get All** - `GET /lists/{listId}/interest-categories/{interestCategoryId}/interests`

#### Member
- **Create** - `POST /lists/{listId}/members`
- **Delete** - `DELETE /lists/{listId}/members/{subscriberHash}`
- **Get** - `GET /lists/{listId}/members/{subscriberHash}`
- **Get All** - `GET /lists/{listId}/members`
- **Update** - `PATCH /lists/{listId}/members/{subscriberHash}`

#### Member Tag
- **Add** - `POST /lists/{listId}/segments/{segmentId}/members`
- **Remove** - `DELETE /lists/{listId}/segments/{segmentId}/members/{subscriberHash}`

---

## 17. Zoom ✅ Implementiert

**Base URL:** `https://api.zoom.us/v2`  
**Authentication:** Access Token (JWT) oder OAuth2  
**Secret Key:** `ZOOM_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Meeting
- **Create** - `POST /users/{userId}/meetings`
- **Delete** - `DELETE /meetings/{meetingId}`
- **Get** - `GET /meetings/{meetingId}`
- **Get All** - `GET /users/{userId}/meetings`
- **Update** - `PATCH /meetings/{meetingId}`

---

## 18. ClickUp ✅ Implementiert

**Base URL:** `https://api.clickup.com/api/v2`  
**Authentication:** Access Token (Bearer) oder OAuth2  
**Secret Key:** `CLICKUP_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Checklist
- **Create** - `POST /checklist/{checklistId}/checklist_item`
- **Delete** - `DELETE /checklist/checklist_item/{checklistItemId}`
- **Get** - `GET /checklist/{checklistId}`
- **Update** - `PUT /checklist/checklist_item/{checklistItemId}`

#### Checklist Item
- **Create** - `POST /checklist/{checklistId}/checklist_item`
- **Delete** - `DELETE /checklist/checklist_item/{checklistItemId}`
- **Update** - `PUT /checklist/checklist_item/{checklistItemId}`

#### Comment
- **Create** - `POST /task/{taskId}/comment`
- **Delete** - `DELETE /comment/{commentId}`
- **Get** - `GET /comment/{commentId}`
- **Get All** - `GET /task/{taskId}/comment`
- **Update** - `PUT /comment/{commentId}`

#### Folder
- **Create** - `POST /space/{spaceId}/folder`
- **Delete** - `DELETE /folder/{folderId}`
- **Get** - `GET /folder/{folderId}`
- **Get All** - `GET /space/{spaceId}/folder`
- **Update** - `PUT /folder/{folderId}`

#### Goal
- **Create** - `POST /team/{teamId}/goal`
- **Delete** - `DELETE /goal/{goalId}`
- **Get** - `GET /goal/{goalId}`
- **Get All** - `GET /team/{teamId}/goal`
- **Update** - `PUT /goal/{goalId}`

#### Goal Key Result
- **Create** - `POST /goal/{goalId}/key_result`
- **Delete** - `DELETE /key_result/{keyResultId}`
- **Get** - `GET /key_result/{keyResultId}`
- **Get All** - `GET /goal/{goalId}/key_result`
- **Update** - `PUT /key_result/{keyResultId}`

#### List
- **Create** - `POST /folder/{folderId}/list`
- **Delete** - `DELETE /list/{listId}`
- **Get** - `GET /list/{listId}`
- **Get All** - `GET /folder/{folderId}/list`
- **Update** - `PUT /list/{listId}`

#### Space Tag
- **Create** - `POST /space/{spaceId}/tag`
- **Delete** - `DELETE /tag/{tagId}`
- **Get All** - `GET /space/{spaceId}/tag`
- **Update** - `PUT /tag/{tagId}`

#### Task
- **Create** - `POST /list/{listId}/task`
- **Delete** - `DELETE /task/{taskId}`
- **Get** - `GET /task/{taskId}`
- **Get All** - `GET /list/{listId}/task`
- **Update** - `PUT /task/{taskId}`

#### Task Dependency
- **Create** - `POST /task/{taskId}/dependency`
- **Delete** - `DELETE /task/{taskId}/dependency/{dependsOn}`
- **Get All** - `GET /task/{taskId}/dependency`

#### Task List
- **Get All** - `GET /task/{taskId}/list`

#### Task Tag
- **Add** - `POST /task/{taskId}/tag/{tagId}`
- **Remove** - `DELETE /task/{taskId}/tag/{tagId}`

#### Time Entry
- **Create** - `POST /team/{teamId}/time_entries`
- **Delete** - `DELETE /time_entries/{timerId}`
- **Get** - `GET /time_entries/{timerId}`
- **Get All** - `GET /team/{teamId}/time_entries`
- **Update** - `PUT /time_entries/{timerId}`

#### Time Entry Tag
- **Create** - `POST /time_entries/{timerId}/tags`
- **Delete** - `DELETE /time_entries/{timerId}/tags/{tagId}`

---

## 19. Monday.com ✅ Implementiert

**Base URL:** `https://api.monday.com/v2` (GraphQL)  
**Authentication:** Access Token (Bearer) oder OAuth2  
**Secret Key:** `MONDAY_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Board
- **Create** - GraphQL Mutation
- **Delete** - GraphQL Mutation
- **Get** - GraphQL Query
- **Get All** - GraphQL Query
- **Update** - GraphQL Mutation

#### Board Column
- **Create** - GraphQL Mutation
- **Delete** - GraphQL Mutation
- **Get** - GraphQL Query
- **Get All** - GraphQL Query
- **Update** - GraphQL Mutation

#### Board Group
- **Create** - GraphQL Mutation
- **Delete** - GraphQL Mutation
- **Get** - GraphQL Query
- **Get All** - GraphQL Query
- **Update** - GraphQL Mutation

#### Board Item
- **Create** - GraphQL Mutation
- **Delete** - GraphQL Mutation
- **Get** - GraphQL Query
- **Get All** - GraphQL Query
- **Update** - GraphQL Mutation

---

## 20. Intercom ✅ Implementiert

**Base URL:** `https://api.intercom.io`  
**Authentication:** Access Token (Bearer)  
**Secret Key:** `INTERCOM_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Company
- **Create** - `POST /companies`
- **Get** - `GET /companies/{id}`
- **Get All** - `GET /companies`
- **Update** - `PUT /companies/{id}`

#### Lead
- **Create** - `POST /contacts`
- **Get** - `GET /contacts/{id}`
- **Get All** - `GET /contacts`
- **Update** - `PUT /contacts/{id}`

#### User
- **Create** - `POST /users`
- **Get** - `GET /users/{id}`
- **Get All** - `GET /users`
- **Update** - `PUT /users/{id}`

---

## 21. SendGrid ✅ Implementiert

**Base URL:** `https://api.sendgrid.com/v3`  
**Authentication:** API Key (Bearer)  
**Secret Key:** `SENDGRID_API_KEY`

### Ressourcen und Operationen

#### Contact
- **Create** - `PUT /marketing/contacts`
- **Delete** - `DELETE /marketing/contacts`
- **Get** - `GET /marketing/contacts/{contactId}`
- **Get All** - `GET /marketing/contacts`
- **Update** - `PATCH /marketing/contacts`

#### List
- **Create** - `POST /marketing/lists`
- **Delete** - `DELETE /marketing/lists/{listId}`
- **Get** - `GET /marketing/lists/{listId}`
- **Get All** - `GET /marketing/lists`
- **Update** - `PATCH /marketing/lists/{listId}`

#### Mail
- **Send** - `POST /mail/send`

---

## 22. Discord ✅ Implementiert

**Base URL:** `https://discord.com/api/v10`  
**Authentication:** Bot Token (Bearer)  
**Secret Key:** `DISCORD_BOT_TOKEN`

### Ressourcen und Operationen (V2)

#### Channel
- **Create** - `POST /channels`
- **Delete** - `DELETE /channels/{channelId}`
- **Get** - `GET /channels/{channelId}`
- **Get All** - `GET /guilds/{guildId}/channels`
- **Update** - `PATCH /channels/{channelId}`

#### Message
- **Create** - `POST /channels/{channelId}/messages`
- **Delete** - `DELETE /channels/{channelId}/messages/{messageId}`
- **Get** - `GET /channels/{channelId}/messages/{messageId}`
- **Get All** - `GET /channels/{channelId}/messages`
- **Update** - `PATCH /channels/{channelId}/messages/{messageId}`

#### Member
- **Add** - `PUT /guilds/{guildId}/members/{userId}`
- **Get** - `GET /guilds/{guildId}/members/{userId}`
- **Get All** - `GET /guilds/{guildId}/members`
- **Remove** - `DELETE /guilds/{guildId}/members/{userId}`
- **Update** - `PATCH /guilds/{guildId}/members/{userId}`

---

## 23. Telegram ✅ Implementiert

**Base URL:** `https://api.telegram.org/bot{token}`  
**Authentication:** Bot Token  
**Secret Key:** `TELEGRAM_BOT_TOKEN`

### Ressourcen und Operationen

#### Chat
- **Get** - `GET /getChat`
- **Get All** - `GET /getUpdates`

#### Callback
- **Answer** - `POST /answerCallbackQuery`

#### File
- **Get** - `GET /getFile`

#### Message
- **Send** - `POST /sendMessage`
- **Send and Wait** - `POST /sendMessage` (mit Webhook)
- **Edit** - `POST /editMessageText`
- **Delete** - `POST /deleteMessage`

---

## 24. WooCommerce ✅ Implementiert

**Base URL:** `https://{domain}/wp-json/wc/v3`  
**Authentication:** Consumer Key + Consumer Secret (Basic Auth)  
**Secret Key:** `WOocommerce_CONSUMER_SECRET`  
**Consumer Key Secret Key:** `WOocommerce_CONSUMER_KEY`

### Ressourcen und Operationen

#### Customer
- **Create** - `POST /customers`
- **Get** - `GET /customers/{id}`
- **Get All** - `GET /customers`
- **Update** - `PUT /customers/{id}`

#### Order
- **Create** - `POST /orders`
- **Get** - `GET /orders/{id}`
- **Get All** - `GET /orders`
- **Update** - `PUT /orders/{id}`

#### Product
- **Create** - `POST /products`
- **Get** - `GET /products/{id}`
- **Get All** - `GET /products`
- **Update** - `PUT /products/{id}`

---

## 25. PayPal ✅ Implementiert

**Base URL:** `https://api-m.paypal.com` (Live) oder `https://api-m.sandbox.paypal.com` (Sandbox)  
**Authentication:** OAuth2 (Client ID + Secret)  
**Secret Key:** `PAYPAL_CLIENT_SECRET`  
**Client ID Secret Key:** `PAYPAL_CLIENT_ID`

### Ressourcen und Operationen

#### Payout
- **Create** - `POST /v1/payments/payouts`

#### Payout Item
- (Weitere Operationen verfügbar)

---

## 26. Linear ✅ Implementiert

**Base URL:** `https://api.linear.app/graphql` (GraphQL)  
**Authentication:** API Token (Bearer) oder OAuth2  
**Secret Key:** `LINEAR_API_TOKEN`

### Ressourcen und Operationen

#### Comment
- **Create** - GraphQL Mutation
- **Get** - GraphQL Query
- **Get All** - GraphQL Query
- **Update** - GraphQL Mutation

#### Issue
- **Create** - GraphQL Mutation
- **Get** - GraphQL Query
- **Get All** - GraphQL Query
- **Update** - GraphQL Mutation

---

## 27. MongoDB ✅ Implementiert

**Base URL:** Connection String (z.B. `mongodb://host:port`)  
**Authentication:** Username + Password (in Connection String)  
**Secret Key:** `MONGODB_PASSWORD`  
**Username Secret Key:** `MONGODB_USERNAME`

### Ressourcen und Operationen

#### Collection
- **Aggregate** - Aggregation Pipeline
- **Delete** - `deleteMany`, `deleteOne`
- **Find** - `find`, `findOne`
- **Insert** - `insertMany`, `insertOne`
- **Update** - `updateMany`, `updateOne`, `findOneAndUpdate`, `findOneAndReplace`

---

## 28. PostgreSQL ✅ Implementiert

**Base URL:** Connection String (z.B. `postgresql://host:port/database`)  
**Authentication:** Username + Password (in Connection String)  
**Secret Key:** `POSTGRES_PASSWORD`  
**Username Secret Key:** `POSTGRES_USERNAME`

### Ressourcen und Operationen (V2.6)

#### Table
- **Execute Query** - Custom SQL Query
- **Insert** - `INSERT INTO ...`
- **Update** - `UPDATE ... SET ...`
- **Delete** - `DELETE FROM ...`
- **Select** - `SELECT ... FROM ...`

---

## 29. MySQL ✅ Implementiert

**Base URL:** Connection String (z.B. `mysql://host:port/database`)  
**Authentication:** Username + Password (in Connection String)  
**Secret Key:** `MYSQL_PASSWORD`  
**Username Secret Key:** `MYSQL_USERNAME`

### Ressourcen und Operationen (V2.5)

#### Table
- **Execute Query** - Custom SQL Query
- **Insert** - `INSERT INTO ...`
- **Update** - `UPDATE ... SET ...`
- **Delete** - `DELETE FROM ...`
- **Select** - `SELECT ... FROM ...`

---

## 30. Twitter (X) ✅ Implementiert

**Base URL:** `https://api.twitter.com/2`  
**Authentication:** OAuth 1.0a oder OAuth2  
**Secret Key:** `TWITTER_ACCESS_TOKEN_SECRET` (für OAuth 1.0a)  
**Access Token Secret Key:** `TWITTER_ACCESS_TOKEN` (für OAuth 1.0a)

### Ressourcen und Operationen (V2)

#### Tweet
- **Create** - `POST /2/tweets`
- **Delete** - `DELETE /2/tweets/{id}`
- **Get** - `GET /2/tweets/{id}`
- **Search** - `GET /2/tweets/search/recent`

#### User
- **Get** - `GET /2/users/by/username/{username}`
- **Get Me** - `GET /2/users/me`

#### List
- **Create** - `POST /2/lists`
- **Get** - `GET /2/lists/{id}`
- **Get All** - `GET /2/users/{id}/owned_lists`
- **Update** - `PUT /2/lists/{id}`

---

## 31. LinkedIn ✅ Implementiert

**Base URL:** `https://api.linkedin.com/v2`  
**Authentication:** OAuth2  
**Secret Key:** `LINKEDIN_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Post
- **Create** - `POST /ugcPosts`
- **Get** - `GET /ugcPosts/{id}`

---

## 32. Microsoft Teams ✅ Implementiert

**Base URL:** `https://graph.microsoft.com/v1.0`  
**Authentication:** OAuth2  
**Secret Key:** `MICROSOFT_TEAMS_ACCESS_TOKEN`

### Ressourcen und Operationen (V2)

#### Channel
- **Create** - `POST /teams/{teamId}/channels`
- **Delete** - `DELETE /teams/{teamId}/channels/{channelId}`
- **Get** - `GET /teams/{teamId}/channels/{channelId}`
- **Get All** - `GET /teams/{teamId}/channels`
- **Update** - `PATCH /teams/{teamId}/channels/{channelId}`

#### Channel Message
- **Create** - `POST /teams/{teamId}/channels/{channelId}/messages`
- **Get** - `GET /teams/{teamId}/channels/{channelId}/messages/{messageId}`
- **Get All** - `GET /teams/{teamId}/channels/{channelId}/messages`
- **Update** - `PATCH /teams/{teamId}/channels/{channelId}/messages/{messageId}`

#### Member
- **Add** - `POST /teams/{teamId}/members`
- **Get** - `GET /teams/{teamId}/members/{memberId}`
- **Get All** - `GET /teams/{teamId}/members`
- **Remove** - `DELETE /teams/{teamId}/members/{memberId}`

#### Team
- **Create** - `POST /teams`
- **Get** - `GET /teams/{teamId}`
- **Get All** - `GET /teams`
- **Update** - `PATCH /teams/{teamId}`

---

## 33. Microsoft Outlook ✅ Implementiert

**Base URL:** `https://graph.microsoft.com/v1.0`  
**Authentication:** OAuth2  
**Secret Key:** `MICROSOFT_OUTLOOK_ACCESS_TOKEN`

### Ressourcen und Operationen (V2)

#### Message
- **Create** - `POST /me/messages`
- **Delete** - `DELETE /me/messages/{messageId}`
- **Get** - `GET /me/messages/{messageId}`
- **Get All** - `GET /me/messages`
- **Reply** - `POST /me/messages/{messageId}/reply`
- **Send** - `POST /me/sendMail`
- **Update** - `PATCH /me/messages/{messageId}`

#### Mailbox
- **Get** - `GET /me/mailboxSettings`

---

## 34. Microsoft OneDrive ✅ Implementiert

**Base URL:** `https://graph.microsoft.com/v1.0/me`  
**Authentication:** OAuth2  
**Secret Key:** `MICROSOFT_ONEDRIVE_ACCESS_TOKEN`

### Ressourcen und Operationen

#### File
- **Copy** - `POST /drive/items/{fileId}/copy`
- **Delete** - `DELETE /drive/items/{fileId}`
- **Download** - `GET /drive/items/{fileId}/content`
- **Get** - `GET /drive/items/{fileId}`
- **Get All** - `GET /drive/items`
- **Upload** - `PUT /drive/items/{parentItemId}:/{fileName}:/content`

#### Folder
- **Create** - `POST /drive/items/{parentItemId}/children`
- **Get** - `GET /drive/items/{folderId}`
- **Get All** - `GET /drive/items/{folderId}/children`

---

## 35. Microsoft SharePoint ✅ Implementiert

**Base URL:** `https://{subdomain}.sharepoint.com/_api/v2.0`  
**Authentication:** OAuth2  
**Secret Key:** `MICROSOFT_SHAREPOINT_ACCESS_TOKEN`

### Ressourcen und Operationen

#### File
- **Delete** - `DELETE /sites/{siteId}/drive/items/{fileId}`
- **Download** - `GET /sites/{siteId}/drive/items/{fileId}/content`
- **Get** - `GET /sites/{siteId}/drive/items/{fileId}`
- **Get All** - `GET /sites/{siteId}/drive/items`
- **Upload** - `PUT /sites/{siteId}/drive/items/{parentItemId}:/{fileName}:/content`

#### Item
- **Create** - `POST /sites/{siteId}/lists/{listId}/items`
- **Delete** - `DELETE /sites/{siteId}/lists/{listId}/items/{itemId}`
- **Get** - `GET /sites/{siteId}/lists/{listId}/items/{itemId}`
- **Get All** - `GET /sites/{siteId}/lists/{listId}/items`
- **Update** - `PATCH /sites/{siteId}/lists/{listId}/items/{itemId}`

#### List
- **Create** - `POST /sites/{siteId}/lists`
- **Get** - `GET /sites/{siteId}/lists/{listId}`
- **Get All** - `GET /sites/{siteId}/lists`
- **Update** - `PATCH /sites/{siteId}/lists/{listId}`

---

## 36. WhatsApp ✅ Implementiert

**Base URL:** `https://graph.facebook.com/v13.0`  
**Authentication:** Access Token (Bearer)  
**Secret Key:** `WHATSAPP_ACCESS_TOKEN`

### Ressourcen und Operationen (V1.1)

#### Message
- **Send** - `POST /{phoneNumberId}/messages`
- **Send and Wait** - `POST /{phoneNumberId}/messages` (mit Webhook)

#### Media
- **Upload** - `POST /{phoneNumberId}/media`

---

## 37. MessageBird ✅ Implementiert

**Base URL:** `https://rest.messagebird.com`  
**Authentication:** Access Key (Bearer)  
**Secret Key:** `MESSAGEBIRD_ACCESS_KEY`

### Ressourcen und Operationen

#### SMS
- **Send** - `POST /messages`

#### Balance
- **Get** - `GET /balance`

---

## 38. Vonage (Nexmo) ✅ Implementiert

**Base URL:** `https://rest.nexmo.com`  
**Authentication:** API Key + API Secret (Form Data)  
**Secret Key:** `VONAGE_API_SECRET`  
**API Key Secret Key:** `VONAGE_API_KEY`

### Ressourcen und Operationen

#### SMS
- **Send** - `POST /sms/json`

---

## 39. Mattermost ✅ Implementiert

**Base URL:** `https://{domain}/api/v4`  
**Authentication:** Personal Access Token (Bearer)  
**Secret Key:** `MATTERMOST_ACCESS_TOKEN`

### Ressourcen und Operationen (V1)

#### Channel
- **Create** - `POST /channels`
- **Get** - `GET /channels/{channelId}`
- **Get All** - `GET /channels`
- **Update** - `PUT /channels/{channelId}`

#### Message
- **Create** - `POST /posts`
- **Delete** - `DELETE /posts/{postId}`
- **Get** - `GET /posts/{postId}`
- **Get All** - `GET /channels/{channelId}/posts`
- **Update** - `PUT /posts/{postId}`

#### User
- **Get** - `GET /users/{userId}`
- **Get All** - `GET /users`

---

## 40. Copper ✅ Implementiert

**Base URL:** `https://api.copper.com/developer_api/v1`  
**Authentication:** API Key (Bearer)  
**Secret Key:** `COPPER_API_KEY`

### Ressourcen und Operationen

#### Company
- **Create** - `POST /companies`
- **Get** - `GET /companies/{id}`
- **Get All** - `GET /companies`
- **Update** - `PUT /companies/{id}`

#### Customer Source
- **Get All** - `GET /customer_sources`

#### Lead
- **Create** - `POST /leads`
- **Get** - `GET /leads/{id}`
- **Get All** - `GET /leads`
- **Update** - `PUT /leads/{id}`

#### Opportunity
- **Create** - `POST /opportunities`
- **Get** - `GET /opportunities/{id}`
- **Get All** - `GET /opportunities`
- **Update** - `PUT /opportunities/{id}`

#### Person
- **Create** - `POST /people`
- **Get** - `GET /people/{id}`
- **Get All** - `GET /people`
- **Update** - `PUT /people/{id}`

#### Project
- **Create** - `POST /projects`
- **Get** - `GET /projects/{id}`
- **Get All** - `GET /projects`
- **Update** - `PUT /projects/{id}`

#### Task
- **Create** - `POST /tasks`
- **Get** - `GET /tasks/{id}`
- **Get All** - `GET /tasks`
- **Update** - `PUT /tasks/{id}`

#### User
- **Get** - `GET /users/{id}`
- **Get All** - `GET /users`

---

## 41. Freshworks CRM ✅ Implementiert

**Base URL:** `https://{domain}.myfreshworks.com/crm/sales/api`  
**Authentication:** API Key (Bearer)  
**Secret Key:** `FRESHWORKS_CRM_API_KEY`

### Ressourcen und Operationen

#### Account
- **Create** - `POST /sales_accounts`
- **Get** - `GET /sales_accounts/{id}`
- **Get All** - `GET /sales_accounts`
- **Update** - `PUT /sales_accounts/{id}`

#### Appointment
- **Create** - `POST /appointments`
- **Get** - `GET /appointments/{id}`
- **Get All** - `GET /appointments`
- **Update** - `PUT /appointments/{id}`

#### Contact
- **Create** - `POST /contacts`
- **Get** - `GET /contacts/{id}`
- **Get All** - `GET /contacts`
- **Update** - `PUT /contacts/{id}`

#### Deal
- **Create** - `POST /deals`
- **Get** - `GET /deals/{id}`
- **Get All** - `GET /deals`
- **Update** - `PUT /deals/{id}`

#### Note
- **Create** - `POST /notes`
- **Get** - `GET /notes/{id}`
- **Get All** - `GET /notes`
- **Update** - `PUT /notes/{id}`

#### Sales Activity
- **Create** - `POST /sales_activities`
- **Get** - `GET /sales_activities/{id}`
- **Get All** - `GET /sales_activities`
- **Update** - `PUT /sales_activities/{id}`

#### Search
- **Search** - `POST /search`

#### Task
- **Create** - `POST /tasks`
- **Get** - `GET /tasks/{id}`
- **Get All** - `GET /tasks`
- **Update** - `PUT /tasks/{id}`

---

## 42. ActiveCampaign ✅ Implementiert

**Base URL:** `{apiUrl}` (aus Credentials, z.B. `https://{account}.api-us1.com/api/3`)  
**Authentication:** API Key (Bearer)  
**Secret Key:** `ACTIVECAMPAIGN_API_KEY`

### Ressourcen und Operationen

#### Account
- **Create** - `POST /accounts`
- **Get** - `GET /accounts/{id}`
- **Get All** - `GET /accounts`
- **Update** - `PUT /accounts/{id}`

#### Account Contact
- **Create** - `POST /accountContacts`
- **Delete** - `DELETE /accountContacts/{id}`
- **Get** - `GET /accountContacts/{id}`
- **Get All** - `GET /accountContacts`

#### Connection
- **Create** - `POST /connections`
- **Get** - `GET /connections/{id}`
- **Get All** - `GET /connections`
- **Update** - `PUT /connections/{id}`

#### Contact
- **Create** - `POST /contacts`
- **Delete** - `DELETE /contacts/{id}`
- **Get** - `GET /contacts/{id}`
- **Get All** - `GET /contacts`
- **Update** - `PUT /contacts/{id}`

#### Contact List
- **Add** - `POST /contactLists`
- **Remove** - `DELETE /contactLists/{id}`

#### Contact Tag
- **Add** - `POST /contactTags`
- **Remove** - `DELETE /contactTags/{id}`

#### Deal
- **Create** - `POST /deals`
- **Get** - `GET /deals/{id}`
- **Get All** - `GET /deals`
- **Update** - `PUT /deals/{id}`

#### E-Commerce Customer
- **Create** - `POST /ecomCustomers`
- **Get** - `GET /ecomCustomers/{id}`
- **Get All** - `GET /ecomCustomers`
- **Update** - `PUT /ecomCustomers/{id}`

#### E-Commerce Order
- **Create** - `POST /ecomOrders`
- **Get** - `GET /ecomOrders/{id}`
- **Get All** - `GET /ecomOrders`
- **Update** - `PUT /ecomOrders/{id}`

#### E-Commerce Order Product
- **Add** - `POST /ecomOrderProducts`
- **Remove** - `DELETE /ecomOrderProducts/{id}`

#### List
- **Create** - `POST /lists`
- **Get** - `GET /lists/{id}`
- **Get All** - `GET /lists`
- **Update** - `PUT /lists/{id}`

#### Tag
- **Create** - `POST /tags`
- **Get** - `GET /tags/{id}`
- **Get All** - `GET /tags`
- **Update** - `PUT /tags/{id}`

---

## 43. Salesmate ✅ Implementiert

**Base URL:** `https://apis.salesmate.io`  
**Authentication:** Session Token + Link Name (Custom Headers)  
**Secret Key:** `SALESMATE_SESSION_TOKEN`  
**Link Name Secret Key:** `SALESMATE_LINK_NAME`

### Ressourcen und Operationen

#### Activity
- **Create** - `POST /v1/activities`
- **Get** - `GET /v1/activities/{id}`
- **Get All** - `GET /v1/activities`
- **Update** - `PUT /v1/activities/{id}`

#### Company
- **Create** - `POST /v1/companies`
- **Get** - `GET /v1/companies/{id}`
- **Get All** - `GET /v1/companies`
- **Update** - `PUT /v1/companies/{id}`

#### Deal
- **Create** - `POST /v1/deals`
- **Get** - `GET /v1/deals/{id}`
- **Get All** - `GET /v1/deals`
- **Update** - `PUT /v1/deals/{id}`

---

## 44. Keap (Infusionsoft) ✅ Implementiert

**Base URL:** `https://api.infusionsoft.com/crm/rest/v1`  
**Authentication:** OAuth2  
**Secret Key:** `KEAP_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Company
- **Create** - `POST /companies`
- **Get** - `GET /companies/{id}`
- **Get All** - `GET /companies`
- **Update** - `PATCH /companies/{id}`

#### Contact
- **Create** - `POST /contacts`
- **Get** - `GET /contacts/{id}`
- **Get All** - `GET /contacts`
- **Update** - `PATCH /contacts/{id}`

#### Contact Note
- **Create** - `POST /contacts/{contactId}/notes`
- **Get** - `GET /contacts/{contactId}/notes/{noteId}`
- **Get All** - `GET /contacts/{contactId}/notes`
- **Update** - `PATCH /contacts/{contactId}/notes/{noteId}`

#### Contact Tag
- **Add** - `POST /contacts/{contactId}/tags/{tagId}`
- **Remove** - `DELETE /contacts/{contactId}/tags/{tagId}`

#### Ecommerce Order
- **Create** - `POST /orders`
- **Get** - `GET /orders/{id}`
- **Get All** - `GET /orders`
- **Update** - `PATCH /orders/{id}`

#### Ecommerce Product
- **Create** - `POST /products`
- **Get** - `GET /products/{id}`
- **Get All** - `GET /products`
- **Update** - `PATCH /products/{id}`

#### Email
- **Send** - `POST /emails`

#### File
- **Upload** - `POST /files`

---

## 45. Mailgun ✅ Implementiert

**Base URL:** `https://{apiDomain}/v3/{emailDomain}`  
**Authentication:** API Key (Basic Auth)  
**Secret Key:** `MAILGUN_API_KEY`

### Ressourcen und Operationen

#### Message
- **Send** - `POST /messages`

---

## 46. Postmark ✅ Implementiert

**Base URL:** `https://api.postmarkapp.com`  
**Authentication:** API Token (X-Postmark-Server-Token Header)  
**Secret Key:** `POSTMARK_API_TOKEN`

### Ressourcen und Operationen

#### Email
- **Send** - `POST /email`
- **Send Batch** - `POST /email/batch`

#### Bounce
- **Get** - `GET /bounces/{id}`
- **Get All** - `GET /bounces`

#### Template
- **Get** - `GET /templates/{id}`
- **Get All** - `GET /templates`

---

## 47. Supabase ✅ Implementiert

**Base URL:** `https://{projectId}.supabase.co/rest/v1`  
**Authentication:** Service Role Key (Bearer) oder Anon Key  
**Secret Key:** `SUPABASE_SERVICE_ROLE_KEY`

### Ressourcen und Operationen

#### Row
- **Create** - `POST /{tableName}`
- **Delete** - `DELETE /{tableName}?{filters}`
- **Get** - `GET /{tableName}?{filters}`
- **Get All** - `GET /{tableName}`
- **Update** - `PATCH /{tableName}?{filters}`

---

## 48. QuickBooks Online ✅ Implementiert

**Base URL:** `https://quickbooks.api.intuit.com` (Production) oder `https://sandbox-quickbooks.api.intuit.com` (Sandbox)  
**Authentication:** OAuth2  
**Secret Key:** `QUICKBOOKS_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Bill
- **Create** - `POST /v3/company/{companyId}/bill`
- **Get** - `GET /v3/company/{companyId}/bill/{billId}`
- **Get All** - `GET /v3/company/{companyId}/query?query=SELECT * FROM Bill`
- **Update** - `POST /v3/company/{companyId}/bill`

#### Customer
- **Create** - `POST /v3/company/{companyId}/customer`
- **Get** - `GET /v3/company/{companyId}/customer/{customerId}`
- **Get All** - `GET /v3/company/{companyId}/query?query=SELECT * FROM Customer`
- **Update** - `POST /v3/company/{companyId}/customer`

#### Employee
- **Get** - `GET /v3/company/{companyId}/employee/{employeeId}`
- **Get All** - `GET /v3/company/{companyId}/query?query=SELECT * FROM Employee`

#### Estimate
- **Create** - `POST /v3/company/{companyId}/estimate`
- **Get** - `GET /v3/company/{companyId}/estimate/{estimateId}`
- **Get All** - `GET /v3/company/{companyId}/query?query=SELECT * FROM Estimate`
- **Update** - `POST /v3/company/{companyId}/estimate`

#### Invoice
- **Create** - `POST /v3/company/{companyId}/invoice`
- **Get** - `GET /v3/company/{companyId}/invoice/{invoiceId}`
- **Get All** - `GET /v3/company/{companyId}/query?query=SELECT * FROM Invoice`
- **Update** - `POST /v3/company/{companyId}/invoice`

#### Item
- **Create** - `POST /v3/company/{companyId}/item`
- **Get** - `GET /v3/company/{companyId}/item/{itemId}`
- **Get All** - `GET /v3/company/{companyId}/query?query=SELECT * FROM Item`
- **Update** - `POST /v3/company/{companyId}/item`

#### Payment
- **Create** - `POST /v3/company/{companyId}/payment`
- **Get** - `GET /v3/company/{companyId}/payment/{paymentId}`
- **Get All** - `GET /v3/company/{companyId}/query?query=SELECT * FROM Payment`
- **Update** - `POST /v3/company/{companyId}/payment`

#### Purchase
- **Create** - `POST /v3/company/{companyId}/purchase`
- **Get** - `GET /v3/company/{companyId}/purchase/{purchaseId}`
- **Get All** - `GET /v3/company/{companyId}/query?query=SELECT * FROM Purchase`
- **Update** - `POST /v3/company/{companyId}/purchase`

#### Transaction
- **Get All** - `GET /v3/company/{companyId}/reports/TransactionList`

#### Vendor
- **Create** - `POST /v3/company/{companyId}/vendor`
- **Get** - `GET /v3/company/{companyId}/vendor/{vendorId}`
- **Get All** - `GET /v3/company/{companyId}/query?query=SELECT * FROM Vendor`
- **Update** - `POST /v3/company/{companyId}/vendor`

---

## 49. Xero ✅ Implementiert

**Base URL:** `https://api.xero.com/api.xro/2.0`  
**Authentication:** OAuth2  
**Secret Key:** `XERO_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Contact
- **Create** - `POST /Contacts`
- **Get** - `GET /Contacts/{contactId}`
- **Get All** - `GET /Contacts`
- **Update** - `POST /Contacts/{contactId}`

#### Invoice
- **Create** - `POST /Invoices`
- **Get** - `GET /Invoices/{invoiceId}`
- **Get All** - `GET /Invoices`
- **Update** - `POST /Invoices/{invoiceId}`

---

## 50. HelpScout ✅ Implementiert

**Base URL:** `https://api.helpscout.net`  
**Authentication:** OAuth2  
**Secret Key:** `HELPSCOUT_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Conversation
- **Create** - `POST /v2/conversations`
- **Delete** - `DELETE /v2/conversations/{conversationId}`
- **Get** - `GET /v2/conversations/{conversationId}`
- **Get All** - `GET /v2/conversations`
- **Update** - `PATCH /v2/conversations/{conversationId}`

#### Customer
- **Create** - `POST /v2/customers`
- **Get** - `GET /v2/customers/{customerId}`
- **Get All** - `GET /v2/customers`
- **Update** - `PUT /v2/customers/{customerId}`

#### Mailbox
- **Get** - `GET /v2/mailboxes/{mailboxId}`
- **Get All** - `GET /v2/mailboxes`

#### Thread
- **Create** - `POST /v2/conversations/{conversationId}/threads`
- **Get All** - `GET /v2/conversations/{conversationId}/threads`

---

## 51. ServiceNow ✅ Implementiert

**Base URL:** `https://{subdomain}.service-now.com/api`  
**Authentication:** OAuth2 oder Basic Auth (username:password)  
**Secret Key:** `SERVICENOW_ACCESS_TOKEN` (für OAuth2)  
**Username Secret Key:** `SERVICENOW_USERNAME` (für Basic Auth)  
**Password Secret Key:** `SERVICENOW_PASSWORD` (für Basic Auth)

### Ressourcen und Operationen

#### Attachment
- **Upload** - `POST /now/attachment/file`
- **Get** - `GET /now/attachment/{id}/file`
- **Get All** - `GET /now/attachment`

#### Business Service
- **Get** - `GET /now/table/cmdb_service/{id}`
- **Get All** - `GET /now/table/cmdb_service`

#### Configuration Item
- **Get** - `GET /now/table/cmdb_ci/{id}`
- **Get All** - `GET /now/table/cmdb_ci`

#### Department
- **Get** - `GET /now/table/cmdb_department/{id}`
- **Get All** - `GET /now/table/cmdb_department`

#### Dictionary
- **Get** - `GET /now/table/sys_dictionary/{id}`
- **Get All** - `GET /now/table/sys_dictionary`

#### Incident
- **Create** - `POST /now/table/incident`
- **Delete** - `DELETE /now/table/incident/{id}`
- **Get** - `GET /now/table/incident/{id}`
- **Get All** - `GET /now/table/incident`
- **Update** - `PATCH /now/table/incident/{id}`

#### Table Record
- **Create** - `POST /now/table/{tableName}`
- **Delete** - `DELETE /now/table/{tableName}/{id}`
- **Get** - `GET /now/table/{tableName}/{id}`
- **Get All** - `GET /now/table/{tableName}`
- **Update** - `PATCH /now/table/{tableName}/{id}`

#### User
- **Create** - `POST /now/table/sys_user`
- **Delete** - `DELETE /now/table/sys_user/{id}`
- **Get** - `GET /now/table/sys_user/{id}`
- **Get All** - `GET /now/table/sys_user`
- **Update** - `PATCH /now/table/sys_user/{id}`

#### User Group
- **Get** - `GET /now/table/sys_user_group/{id}`
- **Get All** - `GET /now/table/sys_user_group`

#### User Role
- **Get** - `GET /now/table/sys_user_role/{id}`
- **Get All** - `GET /now/table/sys_user_role`

---

## 52. Todoist ✅ Implementiert

**Base URL:** `https://api.todoist.com/rest/v2` (REST API) oder `https://api.todoist.com/sync/v9` (Sync API)  
**Authentication:** API Key (Bearer) oder OAuth2  
**Secret Key:** `TODOIST_API_KEY` (für API Key)

### Ressourcen und Operationen (V2.1)

#### Project
- **Create** - `POST /projects`
- **Delete** - `DELETE /projects/{id}`
- **Get** - `GET /projects/{id}`
- **Get All** - `GET /projects`
- **Update** - `POST /projects/{id}`

#### Section
- **Create** - `POST /sections`
- **Delete** - `DELETE /sections/{id}`
- **Get** - `GET /sections/{id}`
- **Get All** - `GET /sections`
- **Update** - `POST /sections/{id}`

#### Task
- **Close** - `POST /tasks/{id}/close`
- **Create** - `POST /tasks`
- **Delete** - `DELETE /tasks/{id}`
- **Get** - `GET /tasks/{id}`
- **Get All** - `GET /tasks`
- **Reopen** - `POST /tasks/{id}/reopen`
- **Update** - `POST /tasks/{id}`

#### Label
- **Create** - `POST /labels`
- **Delete** - `DELETE /labels/{id}`
- **Get** - `GET /labels/{id}`
- **Get All** - `GET /labels`
- **Update** - `POST /labels/{id}`

#### Comment
- **Create** - `POST /comments`
- **Delete** - `DELETE /comments/{id}`
- **Get** - `GET /comments/{id}`
- **Get All** - `GET /comments`

---

## 53. Harvest ✅ Implementiert

**Base URL:** `https://api.harvestapp.com/v2`  
**Authentication:** Access Token (Bearer) oder OAuth2  
**Secret Key:** `HARVEST_ACCESS_TOKEN` (für Access Token)  
**Account ID Secret Key:** `HARVEST_ACCOUNT_ID`

### Ressourcen und Operationen

#### Client
- **Create** - `POST /clients`
- **Get** - `GET /clients/{id}`
- **Get All** - `GET /clients`
- **Update** - `PATCH /clients/{id}`

#### Company
- **Get** - `GET /company`

#### Contact
- **Create** - `POST /contacts`
- **Get** - `GET /contacts/{id}`
- **Get All** - `GET /contacts`
- **Update** - `PATCH /contacts/{id}`

#### Estimate
- **Create** - `POST /estimates`
- **Get** - `GET /estimates/{id}`
- **Get All** - `GET /estimates`
- **Update** - `PATCH /estimates/{id}`

#### Expense
- **Create** - `POST /expenses`
- **Get** - `GET /expenses/{id}`
- **Get All** - `GET /expenses`
- **Update** - `PATCH /expenses/{id}`

#### Invoice
- **Create** - `POST /invoices`
- **Get** - `GET /invoices/{id}`
- **Get All** - `GET /invoices`
- **Update** - `PATCH /invoices/{id}`

#### Project
- **Create** - `POST /projects`
- **Get** - `GET /projects/{id}`
- **Get All** - `GET /projects`
- **Update** - `PATCH /projects/{id}`

#### Task
- **Create** - `POST /tasks`
- **Get** - `GET /tasks/{id}`
- **Get All** - `GET /tasks`
- **Update** - `PATCH /tasks/{id}`

#### Time Entry
- **Create** - `POST /time_entries`
- **Delete** - `DELETE /time_entries/{id}`
- **Get** - `GET /time_entries/{id}`
- **Get All** - `GET /time_entries`
- **Update** - `PATCH /time_entries/{id}`

#### User
- **Get** - `GET /users/{id}`
- **Get All** - `GET /users`

---

## 54. Clockify ✅ Implementiert

**Base URL:** `https://api.clockify.me/api/v1`  
**Authentication:** API Key (X-Api-Key Header)  
**Secret Key:** `CLOCKIFY_API_KEY`

### Ressourcen und Operationen

#### Client
- **Create** - `POST /workspaces/{workspaceId}/clients`
- **Delete** - `DELETE /workspaces/{workspaceId}/clients/{clientId}`
- **Get** - `GET /workspaces/{workspaceId}/clients/{clientId}`
- **Get All** - `GET /workspaces/{workspaceId}/clients`
- **Update** - `PUT /workspaces/{workspaceId}/clients/{clientId}`

#### Project
- **Create** - `POST /workspaces/{workspaceId}/projects`
- **Delete** - `DELETE /workspaces/{workspaceId}/projects/{projectId}`
- **Get** - `GET /workspaces/{workspaceId}/projects/{projectId}`
- **Get All** - `GET /workspaces/{workspaceId}/projects`
- **Update** - `PUT /workspaces/{workspaceId}/projects/{projectId}`

#### Tag
- **Create** - `POST /workspaces/{workspaceId}/tags`
- **Delete** - `DELETE /workspaces/{workspaceId}/tags/{tagId}`
- **Get** - `GET /workspaces/{workspaceId}/tags/{tagId}`
- **Get All** - `GET /workspaces/{workspaceId}/tags`
- **Update** - `PUT /workspaces/{workspaceId}/tags/{tagId}`

#### Task
- **Create** - `POST /workspaces/{workspaceId}/projects/{projectId}/tasks`
- **Delete** - `DELETE /workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}`
- **Get** - `GET /workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}`
- **Get All** - `GET /workspaces/{workspaceId}/projects/{projectId}/tasks`
- **Update** - `PUT /workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}`

#### Time Entry
- **Create** - `POST /workspaces/{workspaceId}/time-entries`
- **Delete** - `DELETE /workspaces/{workspaceId}/time-entries/{timeEntryId}`
- **Get** - `GET /workspaces/{workspaceId}/time-entries/{timeEntryId}`
- **Get All** - `GET /workspaces/{workspaceId}/time-entries`
- **Update** - `PUT /workspaces/{workspaceId}/time-entries/{timeEntryId}`

#### User
- **Get** - `GET /user`
- **Get All** - `GET /workspaces/{workspaceId}/users`

#### Workspace
- **Get** - `GET /workspaces/{workspaceId}`
- **Get All** - `GET /workspaces`

---

## 55. Toggl ✅ Implementiert

**Base URL:** `https://api.track.toggl.com/api/v9/me`  
**Authentication:** API Token (Basic Auth)  
**Secret Key:** `TOGGL_API_TOKEN`

### Ressourcen und Operationen

#### Time Entry
- **Create** - `POST /time_entries`
- **Delete** - `DELETE /time_entries/{id}`
- **Get** - `GET /time_entries/{id}`
- **Get All** - `GET /time_entries`
- **Update** - `PATCH /time_entries/{id}`

#### Project
- **Get** - `GET /projects/{id}`
- **Get All** - `GET /projects`

#### Workspace
- **Get** - `GET /workspaces/{id}`
- **Get All** - `GET /workspaces`

---

## 56. Magento 2 ✅ Implementiert

**Base URL:** `{host}` (aus Credentials, z.B. `https://{domain}/rest/default/V1`)  
**Authentication:** Access Token (Bearer)  
**Secret Key:** `MAGENTO2_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Customer
- **Create** - `POST /customers`
- **Get** - `GET /customers/{customerId}`
- **Get All** - `GET /customers/search`
- **Update** - `PUT /customers/{customerId}`

#### Invoice
- **Create** - `POST /order/{orderId}/invoice`

#### Order
- **Cancel** - `POST /order/{orderId}/cancel`
- **Get** - `GET /orders/{orderId}`
- **Get All** - `GET /orders`
- **Ship** - `POST /order/{orderId}/ship`

#### Product
- **Create** - `POST /products`
- **Delete** - `DELETE /products/{sku}`
- **Get** - `GET /products/{sku}`
- **Get All** - `GET /products`
- **Update** - `PUT /products/{sku}`

---

## 57. Gumroad ✅ Implementiert

**Base URL:** `https://api.gumroad.com/v2`  
**Authentication:** Access Token (Form Data)  
**Secret Key:** `GUMROAD_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Product
- **Get** - `GET /products/{productId}`
- **Get All** - `GET /products`

#### Sale
- **Get** - `GET /sales/{saleId}`
- **Get All** - `GET /sales`

---

## 58. Paddle ✅ Implementiert

**Base URL:** `https://vendors.paddle.com/api` (Production) oder `https://sandbox-vendors.paddle.com/api` (Sandbox)  
**Authentication:** Vendor ID + Vendor Auth Code (Form Data)  
**Secret Key:** `PADDLE_VENDOR_AUTH_CODE`  
**Vendor ID Secret Key:** `PADDLE_VENDOR_ID`

### Ressourcen und Operationen

#### Coupon
- **Create** - `POST /2.0/product/{productId}/coupons`
- **Get** - `GET /2.0/product/{productId}/coupons/{couponId}`
- **Get All** - `GET /2.0/product/{productId}/coupons`
- **Update** - `PUT /2.0/product/{productId}/coupons/{couponId}`

#### Payment
- **Get** - `GET /2.0/transaction/{transactionId}`
- **Get All** - `GET /2.0/transaction`

#### Plan
- **Create** - `POST /2.0/subscription/plans`
- **Get** - `GET /2.0/subscription/plans/{planId}`
- **Get All** - `GET /2.0/subscription/plans`
- **Update** - `PUT /2.0/subscription/plans/{planId}`

#### Product
- **Create** - `POST /2.0/product`
- **Get** - `GET /2.0/product/{productId}`
- **Get All** - `GET /2.0/product`
- **Update** - `PUT /2.0/product/{productId}`

#### User
- **Get** - `GET /2.0/user/{userId}`
- **Get All** - `GET /2.0/user`

---

## 59. Chargebee ✅ Implementiert

**Base URL:** `https://{accountName}.chargebee.com/api/v2`  
**Authentication:** API Key (Basic Auth)  
**Secret Key:** `CHARGEBEE_API_KEY`

### Ressourcen und Operationen

#### Customer
- **Create** - `POST /customers`

#### Invoice
- **Get** - `GET /invoices/{id}`
- **Get All** - `GET /invoices`

#### Subscription
- **Get** - `GET /subscriptions/{id}`
- **Get All** - `GET /subscriptions`

---

## 60. Brevo (Sendinblue) ✅ Implementiert

**Base URL:** `https://api.brevo.com/v3`  
**Authentication:** API Key (api-key Header)  
**Secret Key:** `BREVO_API_KEY`

### Ressourcen und Operationen

#### Contact
- **Create** - `POST /contacts`
- **Delete** - `DELETE /contacts/{identifier}`
- **Get** - `GET /contacts/{identifier}`
- **Get All** - `GET /contacts`
- **Update** - `PUT /contacts/{identifier}`

#### Contact Attribute
- **Create** - `POST /contacts/attributes/{attributeCategory}/{attributeName}`
- **Get** - `GET /contacts/attributes/{attributeCategory}/{attributeName}`
- **Get All** - `GET /contacts/attributes`

#### Email
- **Send** - `POST /smtp/email`
- **Send Template** - `POST /smtp/templates/{templateId}/send`

#### Sender
- **Create** - `POST /senders`
- **Get** - `GET /senders/{senderId}`
- **Get All** - `GET /senders`
- **Update** - `PUT /senders/{senderId}`

---

## 61. ConvertKit ✅ Implementiert

**Base URL:** `https://api.convertkit.com/v3`  
**Authentication:** API Secret (Form Data)  
**Secret Key:** `CONVERTKIT_API_SECRET`

### Ressourcen und Operationen

#### Custom Field
- **Create** - `POST /custom_fields`
- **Get** - `GET /custom_fields/{id}`
- **Get All** - `GET /custom_fields`
- **Update** - `PUT /custom_fields/{id}`

#### Form
- **Get** - `GET /forms/{id}`
- **Get All** - `GET /forms`
- **Subscribe** - `POST /forms/{formId}/subscribe`

#### Sequence
- **Get** - `GET /sequences/{id}`
- **Get All** - `GET /sequences`
- **Subscribe** - `POST /sequences/{sequenceId}/subscribe`

#### Tag
- **Create** - `POST /tags`
- **Get** - `GET /tags/{id}`
- **Get All** - `GET /tags`
- **Update** - `PUT /tags/{id}`

#### Tag Subscriber
- **Add** - `POST /tags/{tagId}/subscribe`
- **Remove** - `POST /tags/{tagId}/unsubscribe`

---

## 62. Freshdesk ✅ Implementiert

**Base URL:** `https://{domain}.freshdesk.com/api/v2`  
**Authentication:** API Key (Basic Auth: apiKey:X)  
**Secret Key:** `FRESHDESK_API_KEY`

### Ressourcen und Operationen

#### Contact
- **Create** - `POST /contacts`
- **Delete** - `DELETE /contacts/{id}`
- **Get** - `GET /contacts/{id}`
- **Get All** - `GET /contacts`
- **Update** - `PUT /contacts/{id}`

#### Ticket
- **Create** - `POST /tickets`
- **Delete** - `DELETE /tickets/{id}`
- **Get** - `GET /tickets/{id}`
- **Get All** - `GET /tickets`
- **Update** - `PUT /tickets/{id}`

---

## 63. Freshservice ✅ Implementiert

**Base URL:** `https://{domain}.freshservice.com/api/v2`  
**Authentication:** API Key (Basic Auth: apiKey:X)  
**Secret Key:** `FRESHSERVICE_API_KEY`

### Ressourcen und Operationen

#### Agent
- **Create** - `POST /agents`
- **Get** - `GET /agents/{id}`
- **Get All** - `GET /agents`
- **Update** - `PUT /agents/{id}`

#### Agent Group
- **Create** - `POST /agent_groups`
- **Get** - `GET /agent_groups/{id}`
- **Get All** - `GET /agent_groups`
- **Update** - `PUT /agent_groups/{id}`

#### Agent Role
- **Get** - `GET /agent_roles/{id}`
- **Get All** - `GET /agent_roles`

#### Announcement
- **Create** - `POST /announcements`
- **Get** - `GET /announcements/{id}`
- **Get All** - `GET /announcements`
- **Update** - `PUT /announcements/{id}`

#### Asset Type
- **Get** - `GET /asset_types/{id}`
- **Get All** - `GET /asset_types`

#### Change
- **Create** - `POST /changes`
- **Get** - `GET /changes/{id}`
- **Get All** - `GET /changes`
- **Update** - `PUT /changes/{id}`

#### Department
- **Create** - `POST /departments`
- **Get** - `GET /departments/{id}`
- **Get All** - `GET /departments`
- **Update** - `PUT /departments/{id}`

#### Location
- **Create** - `POST /locations`
- **Get** - `GET /locations/{id}`
- **Get All** - `GET /locations`
- **Update** - `PUT /locations/{id}`

#### Problem
- **Create** - `POST /problems`
- **Get** - `GET /problems/{id}`
- **Get All** - `GET /problems`
- **Update** - `PUT /problems/{id}`

#### Product
- **Get** - `GET /products/{id}`
- **Get All** - `GET /products`

#### Release
- **Create** - `POST /releases`
- **Get** - `GET /releases/{id}`
- **Get All** - `GET /releases`
- **Update** - `PUT /releases/{id}`

#### Requester
- **Create** - `POST /requesters`
- **Get** - `GET /requesters/{id}`
- **Get All** - `GET /requesters`
- **Update** - `PUT /requesters/{id}`

#### Requester Group
- **Create** - `POST /requester_groups`
- **Get** - `GET /requester_groups/{id}`
- **Get All** - `GET /requester_groups`
- **Update** - `PUT /requester_groups/{id}`

#### Software
- **Get** - `GET /software/{id}`
- **Get All** - `GET /software`

#### Ticket
- **Create** - `POST /tickets`
- **Get** - `GET /tickets/{id}`
- **Get All** - `GET /tickets`
- **Update** - `PUT /tickets/{id}`

---

## 64. GitLab ✅ Implementiert

**Base URL:** `{server}/api/v4` (z.B. `https://gitlab.com/api/v4`)  
**Authentication:** Access Token (Bearer) oder OAuth2  
**Secret Key:** `GITLAB_ACCESS_TOKEN` (für Access Token)

### Ressourcen und Operationen

#### File
- **Create** - `POST /projects/{projectId}/repository/files/{filePath}`
- **Get** - `GET /projects/{projectId}/repository/files/{filePath}`
- **Delete** - `DELETE /projects/{projectId}/repository/files/{filePath}`

#### Issue
- **Create** - `POST /projects/{projectId}/issues`
- **Get** - `GET /projects/{projectId}/issues/{issueIid}`
- **Get All** - `GET /projects/{projectId}/issues`
- **Update** - `PUT /projects/{projectId}/issues/{issueIid}`

#### Release
- **Create** - `POST /projects/{projectId}/releases`
- **Get** - `GET /projects/{projectId}/releases/{tagName}`
- **Get All** - `GET /projects/{projectId}/releases`
- **Update** - `PUT /projects/{projectId}/releases/{tagName}`

#### Repository
- **Get** - `GET /projects/{projectId}`
- **Get All** - `GET /projects`

#### User
- **Get** - `GET /users/{userId}`
- **Get All** - `GET /users`

---

## 65. Bitbucket ✅ Implementiert

**Base URL:** `https://api.bitbucket.org/2.0`  
**Authentication:** App Password (Basic Auth) oder Access Token (Bearer)  
**Secret Key:** `BITBUCKET_APP_PASSWORD` (für App Password)  
**Username Secret Key:** `BITBUCKET_USERNAME` (für App Password)

### Ressourcen und Operationen

#### Repository
- **Create** - `POST /repositories/{workspace}/{repo_slug}`
- **Get** - `GET /repositories/{workspace}/{repo_slug}`
- **Get All** - `GET /repositories/{workspace}`
- **Update** - `PUT /repositories/{workspace}/{repo_slug}`

#### Pull Request
- **Create** - `POST /repositories/{workspace}/{repo_slug}/pullrequests`
- **Get** - `GET /repositories/{workspace}/{repo_slug}/pullrequests/{pullRequestId}`
- **Get All** - `GET /repositories/{workspace}/{repo_slug}/pullrequests`
- **Update** - `PUT /repositories/{workspace}/{repo_slug}/pullrequests/{pullRequestId}`

#### Commit
- **Get** - `GET /repositories/{workspace}/{repo_slug}/commit/{commit}`
- **Get All** - `GET /repositories/{workspace}/{repo_slug}/commits`

---

## 66. Typeform ✅ Implementiert

**Base URL:** `https://api.typeform.com`  
**Authentication:** Personal Access Token (Bearer)  
**Secret Key:** `TYPEFORM_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Form
- **Create** - `POST /forms`
- **Delete** - `DELETE /forms/{formId}`
- **Get** - `GET /forms/{formId}`
- **Get All** - `GET /forms`
- **Update** - `PATCH /forms/{formId}`

#### Response
- **Get** - `GET /forms/{formId}/responses/{responseId}`
- **Get All** - `GET /forms/{formId}/responses`

#### Webhook
- **Create** - `POST /forms/{formId}/webhooks`
- **Delete** - `DELETE /forms/{formId}/webhooks/{tag}`
- **Get** - `GET /forms/{formId}/webhooks/{tag}`
- **Get All** - `GET /forms/{formId}/webhooks`
- **Update** - `PUT /forms/{formId}/webhooks/{tag}`

---

## 67. JotForm ✅ Implementiert

**Base URL:** `https://{apiDomain || 'api.jotform.com'}`  
**Authentication:** API Key (APIKEY Header)  
**Secret Key:** `JOTFORM_API_KEY`

### Ressourcen und Operationen

#### Form
- **Create** - `POST /form`
- **Delete** - `DELETE /form/{formId}`
- **Get** - `GET /form/{formId}`
- **Get All** - `GET /user/forms`
- **Update** - `POST /form/{formId}`

#### Submission
- **Get** - `GET /form/{formId}/submissions/{submissionId}`
- **Get All** - `GET /form/{formId}/submissions`

#### Webhook
- **Create** - `POST /form/{formId}/webhooks`
- **Delete** - `DELETE /form/{formId}/webhooks/{webhookId}`
- **Get All** - `GET /form/{formId}/webhooks`
- **Update** - `POST /form/{formId}/webhooks/{webhookId}`

---

## 68. Calendly ✅ Implementiert

**Base URL:** `https://api.calendly.com` (für Access Token) oder `https://calendly.com/api/v1` (für API Key, deprecated)  
**Authentication:** Access Token (Bearer) oder API Key (deprecated)  
**Secret Key:** `CALENDLY_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Event
- **Get** - `GET /scheduled_events/{eventId}`
- **Get All** - `GET /scheduled_events`

#### Invitee
- **Get** - `GET /scheduled_events/{eventId}/invitees/{inviteeId}`
- **Get All** - `GET /scheduled_events/{eventId}/invitees`

#### Webhook
- **Create** - `POST /webhook_subscriptions`
- **Delete** - `DELETE /webhook_subscriptions/{webhookId}`
- **Get** - `GET /webhook_subscriptions/{webhookId}`
- **Get All** - `GET /webhook_subscriptions`

---

## 69. AWS S3 ✅ Implementiert

**Base URL:** `https://{bucket}.s3.{region}.amazonaws.com` oder `https://s3.{region}.amazonaws.com/{bucket}`  
**Authentication:** AWS Access Key ID + Secret Access Key  
**Secret Key:** `AWS_SECRET_ACCESS_KEY`  
**Access Key ID Secret Key:** `AWS_ACCESS_KEY_ID`

### Ressourcen und Operationen (V2)

#### Bucket
- **Create** - `PUT /{bucket}`
- **Delete** - `DELETE /{bucket}`
- **Get All** - `GET /`

#### Object
- **Copy** - `PUT /{bucket}/{key}?x-amz-copy-source=...`
- **Delete** - `DELETE /{bucket}/{key}`
- **Download** - `GET /{bucket}/{key}`
- **Get All** - `GET /{bucket}?list-type=2`
- **Upload** - `PUT /{bucket}/{key}`

---

## 70. Google Drive ✅ Implementiert

**Base URL:** `https://www.googleapis.com`  
**Authentication:** OAuth2 oder Service Account  
**Secret Key:** `GOOGLE_DRIVE_ACCESS_TOKEN` (für OAuth2)

### Ressourcen und Operationen (V3)

#### File
- **Copy** - `POST /drive/v3/files/{fileId}/copy`
- **Delete** - `DELETE /drive/v3/files/{fileId}`
- **Download** - `GET /drive/v3/files/{fileId}?alt=media`
- **Get** - `GET /drive/v3/files/{fileId}`
- **Get All** - `GET /drive/v3/files`
- **Upload** - `POST /upload/drive/v3/files`

#### Folder
- **Create** - `POST /drive/v3/files`
- **Get** - `GET /drive/v3/files/{folderId}`
- **Get All** - `GET /drive/v3/files?q=mimeType='application/vnd.google-apps.folder'`

#### Drive
- **Get** - `GET /drive/v3/drives/{driveId}`
- **Get All** - `GET /drive/v3/drives`

---

## 71. Dropbox ✅ Implementiert

**Base URL:** `https://api.dropboxapi.com/2` (für API) oder `https://content.dropboxapi.com/2` (für Content)  
**Authentication:** Access Token (Bearer) oder OAuth2  
**Secret Key:** `DROPBOX_ACCESS_TOKEN` (für Access Token)

### Ressourcen und Operationen

#### File
- **Copy** - `POST /files/copy_v2`
- **Delete** - `POST /files/delete_v2`
- **Download** - `POST /files/download`
- **Get** - `POST /files/get_metadata`
- **Get All** - `POST /files/list_folder`
- **Search** - `POST /files/search_v2`
- **Upload** - `POST /files/upload`

#### Folder
- **Create** - `POST /files/create_folder_v2`
- **Get** - `POST /files/get_metadata`
- **Get All** - `POST /files/list_folder`

---

## 72. Box ✅ Implementiert

**Base URL:** `https://api.box.com/2.0`  
**Authentication:** OAuth2  
**Secret Key:** `BOX_ACCESS_TOKEN`

### Ressourcen und Operationen

#### File
- **Copy** - `POST /files/{fileId}/copy`
- **Delete** - `DELETE /files/{fileId}`
- **Download** - `GET /files/{fileId}/content`
- **Get** - `GET /files/{fileId}`
- **Get All** - `GET /search`
- **Upload** - `POST /files/content`

#### Folder
- **Create** - `POST /folders`
- **Delete** - `DELETE /folders/{folderId}`
- **Get** - `GET /folders/{folderId}`
- **Get All** - `GET /search`

---

## 73. Google Analytics ✅ Implementiert

**Base URL:** `https://analyticsdata.googleapis.com` (GA4) oder `https://analyticsreporting.googleapis.com` (Universal Analytics)  
**Authentication:** OAuth2  
**Secret Key:** `GOOGLE_ANALYTICS_ACCESS_TOKEN`

### Ressourcen und Operationen (V2)

#### Report
- **Get (GA4)** - `POST /v1beta/{property}:runReport`
- **Get (Universal)** - `POST /v4/reports:batchGet`

#### User Activity
- **Search** - `POST /v4/userActivity:search`

---

## 74. PostHog ✅ Implementiert

**Base URL:** `{url}` (aus Credentials, z.B. `https://app.posthog.com`)  
**Authentication:** API Key (Query Parameter: api_key) oder Form Data  
**Secret Key:** `POSTHOG_API_KEY`  
**Hinweis:** PostHog verwendet Query-Parameter-Authentifizierung. Der API-Key wird als `?api_key={key}` in der URL übergeben.

### Ressourcen und Operationen

#### Alias
- **Create** - `POST /batch`

#### Event
- **Create** - `POST /batch`

#### Identity
- **Create** - `POST /batch`

#### Track
- **Create** - `POST /batch`

---

## 75. Segment ✅ Implementiert

**Base URL:** `https://api.segment.io/v1`  
**Authentication:** Write Key (Basic Auth)  
**Secret Key:** `SEGMENT_WRITE_KEY`

### Ressourcen und Operationen

#### Group
- **Add** - `POST /group`

#### Identify
- **Create** - `POST /identify`

#### Track
- **Create** - `POST /track`

---

## 76. Contentful ✅ Implementiert

**Base URL:** `https://cdn.contentful.com` (Delivery API) oder `https://preview.contentful.com` (Preview API)  
**Authentication:** Access Token (Query Parameter)  
**Secret Key:** `CONTENTFUL_CONTENT_DELIVERY_ACCESS_TOKEN` (für Delivery API)  
**Preview Access Token Secret Key:** `CONTENTFUL_CONTENT_PREVIEW_ACCESS_TOKEN` (für Preview API)

### Ressourcen und Operationen

#### Asset
- **Get** - `GET /spaces/{spaceId}/assets/{assetId}`
- **Get All** - `GET /spaces/{spaceId}/assets`

#### Content Type
- **Get** - `GET /spaces/{spaceId}/content_types/{contentTypeId}`
- **Get All** - `GET /spaces/{spaceId}/content_types`

#### Entry
- **Get** - `GET /spaces/{spaceId}/entries/{entryId}`
- **Get All** - `GET /spaces/{spaceId}/entries`

#### Locale
- **Get** - `GET /spaces/{spaceId}/locales/{localeId}`
- **Get All** - `GET /spaces/{spaceId}/locales`

#### Space
- **Get** - `GET /spaces/{spaceId}`

---

## 77. Storyblok ✅ Implementiert

**Base URL:** `https://api.storyblok.com` (Content API) oder `https://mapi.storyblok.com` (Management API)  
**Authentication:** API Key (Query Parameter für Content API, Bearer für Management API)  
**Secret Key:** `STORYBLOK_API_KEY`

### Ressourcen und Operationen

#### Story (Content API)
- **Get** - `GET /v1/cdn/stories/{slug}`
- **Get All** - `GET /v1/cdn/stories`

#### Story (Management API)
- **Create** - `POST /v1/spaces/{spaceId}/stories`
- **Delete** - `DELETE /v1/spaces/{spaceId}/stories/{storyId}`
- **Get** - `GET /v1/spaces/{spaceId}/stories/{storyId}`
- **Get All** - `GET /v1/spaces/{spaceId}/stories`
- **Publish** - `GET /v1/spaces/{spaceId}/stories/{storyId}/publish`
- **Update** - `PUT /v1/spaces/{spaceId}/stories/{storyId}`

---

## 78. Strapi ✅ Implementiert

**Base URL:** `{url}/api` (aus Credentials, z.B. `https://{domain}/api`)  
**Authentication:** Username + Password (Basic Auth) oder API Token (Bearer)  
**Secret Key:** `STRAPI_PASSWORD` (für Username/Password)  
**Username Secret Key:** `STRAPI_USERNAME` (für Username/Password)  
**API Token Secret Key:** `STRAPI_API_TOKEN` (für API Token)

### Ressourcen und Operationen

#### Entry
- **Create** - `POST /{contentType}`
- **Delete** - `DELETE /{contentType}/{id}`
- **Get** - `GET /{contentType}/{id}`
- **Get All** - `GET /{contentType}`
- **Update** - `PUT /{contentType}/{id}`

---

## 79. Ghost ✅ Implementiert

**Base URL:** `{url}/ghost/api/v3` (Content API) oder `{url}/ghost/api/v2` (Admin API)  
**Authentication:** Content API Key (Query Parameter) oder Admin API Key (Bearer)  
**Secret Key:** `GHOST_CONTENT_API_KEY` (für Content API)  
**Admin API Key Secret Key:** `GHOST_ADMIN_API_KEY` (für Admin API)

### Ressourcen und Operationen

#### Post
- **Create** - `POST /admin/posts` (Admin API)
- **Delete** - `DELETE /admin/posts/{id}` (Admin API)
- **Get** - `GET /content/posts/{id}` (Content API) oder `GET /admin/posts/{id}` (Admin API)
- **Get All** - `GET /content/posts` (Content API) oder `GET /admin/posts` (Admin API)
- **Update** - `PUT /admin/posts/{id}` (Admin API)

---

## 80. WordPress ✅ Implementiert

**Base URL:** `{url}/wp-json/wp/v2` (aus Credentials)  
**Authentication:** Application Password (Basic Auth)  
**Secret Key:** `WORDPRESS_APPLICATION_PASSWORD`  
**Username Secret Key:** `WORDPRESS_USERNAME`

### Ressourcen und Operationen

#### Post
- **Create** - `POST /posts`
- **Delete** - `DELETE /posts/{id}`
- **Get** - `GET /posts/{id}`
- **Get All** - `GET /posts`
- **Update** - `PUT /posts/{id}`

#### Page
- **Create** - `POST /pages`
- **Delete** - `DELETE /pages/{id}`
- **Get** - `GET /pages/{id}`
- **Get All** - `GET /pages`
- **Update** - `PUT /pages/{id}`

#### User
- **Create** - `POST /users`
- **Delete** - `DELETE /users/{id}`
- **Get** - `GET /users/{id}`
- **Get All** - `GET /users`
- **Update** - `PUT /users/{id}`

---

## 81. Webflow ✅ Implementiert

**Base URL:** `https://api.webflow.com` (V1) oder `https://api.webflow.com/v2` (V2)  
**Authentication:** Access Token (Bearer) oder OAuth2  
**Secret Key:** `WEBFLOW_ACCESS_TOKEN` (für Access Token)

### Ressourcen und Operationen (V2)

#### Collection Item
- **Create** - `POST /collections/{collectionId}/items`
- **Delete** - `DELETE /collections/{collectionId}/items/{itemId}`
- **Get** - `GET /collections/{collectionId}/items/{itemId}`
- **Get All** - `GET /collections/{collectionId}/items`
- **Update** - `PATCH /collections/{collectionId}/items/{itemId}`

#### Site
- **Get** - `GET /sites/{siteId}`
- **Get All** - `GET /sites`

---

## 82. OpenAI ✅ Implementiert

**Base URL:** `https://api.openai.com`  
**Authentication:** API Key (Bearer)  
**Secret Key:** `OPENAI_API_KEY`

### Ressourcen und Operationen (V1.1)

#### Chat
- **Create** - `POST /v1/chat/completions`

#### Image
- **Create** - `POST /v1/images/generations`

#### Text
- **Classify** - `POST /v1/classifications`
- **Complete** - `POST /v1/completions`
- **Edit** - `POST /v1/edits`

---

## 83. Mistral AI ✅ Implementiert

**Base URL:** `https://api.mistral.ai`  
**Authentication:** API Key (Bearer)  
**Secret Key:** `MISTRAL_API_KEY`

### Ressourcen und Operationen

#### Document
- **Extract Text** - `POST /v1/batch`

---

## 84. DeepL ✅ Implementiert

**Base URL:** `https://api.deepl.com/v2` (Pro) oder `https://api-free.deepl.com/v2` (Free)  
**Authentication:** API Key (Form Data)  
**Secret Key:** `DEEPL_API_KEY`

### Ressourcen und Operationen

#### Language
- **Get All** - `GET /languages`
- **Translate** - `POST /translate`

---

## 85. Zoho CRM ✅ Implementiert

**Base URL:** `https://www.zohoapis.com/crm/v2`
**Authentication:** OAuth2
**Secret Key:** `ZOHO_CRM_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Account
- **Create** - `POST /Accounts`
- **Delete** - `DELETE /Accounts/{id}`
- **Get** - `GET /Accounts/{id}`
- **Get All** - `GET /Accounts`
- **Update** - `PUT /Accounts/{id}`

#### Contact
- **Create** - `POST /Contacts`
- **Delete** - `DELETE /Contacts/{id}`
- **Get** - `GET /Contacts/{id}`
- **Get All** - `GET /Contacts`
- **Update** - `PUT /Contacts/{id}`

#### Deal
- **Create** - `POST /Deals`
- **Delete** - `DELETE /Deals/{id}`
- **Get** - `GET /Deals/{id}`
- **Get All** - `GET /Deals`
- **Update** - `PUT /Deals/{id}`

#### Invoice
- **Create** - `POST /Invoices`
- **Delete** - `DELETE /Invoices/{id}`
- **Get** - `GET /Invoices/{id}`
- **Get All** - `GET /Invoices`
- **Update** - `PUT /Invoices/{id}`

#### Lead
- **Create** - `POST /Leads`
- **Delete** - `DELETE /Leads/{id}`
- **Get** - `GET /Leads/{id}`
- **Get All** - `GET /Leads`
- **Update** - `PUT /Leads/{id}`

#### Product
- **Create** - `POST /Products`
- **Delete** - `DELETE /Products/{id}`
- **Get** - `GET /Products/{id}`
- **Get All** - `GET /Products`
- **Update** - `PUT /Products/{id}`

#### Purchase Order
- **Create** - `POST /Purchase_Orders`
- **Delete** - `DELETE /Purchase_Orders/{id}`
- **Get** - `GET /Purchase_Orders/{id}`
- **Get All** - `GET /Purchase_Orders`
- **Update** - `PUT /Purchase_Orders/{id}`

#### Quote
- **Create** - `POST /Quotes`
- **Delete** - `DELETE /Quotes/{id}`
- **Get** - `GET /Quotes/{id}`
- **Get All** - `GET /Quotes`
- **Update** - `PUT /Quotes/{id}`

#### Sales Order
- **Create** - `POST /Sales_Orders`
- **Delete** - `DELETE /Sales_Orders/{id}`
- **Get** - `GET /Sales_Orders/{id}`
- **Get All** - `GET /Sales_Orders`
- **Update** - `PUT /Sales_Orders/{id}`

#### Vendor
- **Create** - `POST /Vendors`
- **Delete** - `DELETE /Vendors/{id}`
- **Get** - `GET /Vendors/{id}`
- **Get All** - `GET /Vendors`
- **Update** - `PUT /Vendors/{id}`

---

## 86. Okta ✅ Implementiert

**Base URL:** `https://{your-okta-domain}/api/v1`
**Authentication:** API Token (Bearer) oder OAuth2
**Secret Key:** `OKTA_API_TOKEN`
**Domain Secret Key:** `OKTA_DOMAIN`

### Ressourcen und Operationen

#### User
- **Create** - `POST /users`
- **Get** - `GET /users/{id}`
- **Get All** - `GET /users`
- **Update** - `PUT /users/{id}`
- **Delete** - `DELETE /users/{id}`

---

## 87. Odoo ✅ Implementiert

**Base URL:** `https://{your-odoo-domain}/jsonrpc`
**Authentication:** Username + Password (JSON-RPC)
**Secret Key:** `ODOO_PASSWORD`
**Username Secret Key:** `ODOO_USERNAME`
**Database Secret Key:** `ODOO_DATABASE`

**Hinweis:** Odoo verwendet JSON-RPC statt REST API. Die Operationen werden als JSON-RPC-Methoden aufgerufen.

### Ressourcen und Operationen

#### Contact
- **Create** - JSON-RPC `create` auf `res.partner`
- **Delete** - JSON-RPC `unlink` auf `res.partner`
- **Get** - JSON-RPC `read` auf `res.partner`
- **Get All** - JSON-RPC `search_read` auf `res.partner`
- **Update** - JSON-RPC `write` auf `res.partner`

#### Opportunity
- **Create** - JSON-RPC `create` auf `crm.lead`
- **Delete** - JSON-RPC `unlink` auf `crm.lead`
- **Get** - JSON-RPC `read` auf `crm.lead`
- **Get All** - JSON-RPC `search_read` auf `crm.lead`
- **Update** - JSON-RPC `write` auf `crm.lead`

#### Note
- **Create** - JSON-RPC `create` auf `note.note`
- **Delete** - JSON-RPC `unlink` auf `note.note`
- **Get** - JSON-RPC `read` auf `note.note`
- **Get All** - JSON-RPC `search_read` auf `note.note`
- **Update** - JSON-RPC `write` auf `note.note`

#### Custom Resource
- **Create** - JSON-RPC `create` auf benutzerdefiniertes Modell
- **Delete** - JSON-RPC `unlink` auf benutzerdefiniertes Modell
- **Get** - JSON-RPC `read` auf benutzerdefiniertes Modell
- **Get All** - JSON-RPC `search_read` auf benutzerdefiniertes Modell
- **Update** - JSON-RPC `write` auf benutzerdefiniertes Modell

---

## 88. Coda ✅ Implementiert

**Base URL:** `https://coda.io/apis/v1`
**Authentication:** Access Token (Bearer)
**Secret Key:** `CODA_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Table
- **Create Row** - `POST /docs/{docId}/tables/{tableId}/rows`
- **Delete Row** - `DELETE /docs/{docId}/tables/{tableId}/rows/{rowId}`
- **Get All Columns** - `GET /docs/{docId}/tables/{tableId}/columns`
- **Get All Rows** - `GET /docs/{docId}/tables/{tableId}/rows`
- **Get Column** - `GET /docs/{docId}/tables/{tableId}/columns/{columnId}`
- **Get Row** - `GET /docs/{docId}/tables/{tableId}/rows/{rowId}`
- **Push Button** - `POST /docs/{docId}/tables/{tableId}/rows/{rowId}/buttons/{buttonId}`
- **Upsert Rows** - `POST /docs/{docId}/tables/{tableId}/rows`

#### View
- **Delete View Row** - `DELETE /docs/{docId}/tables/{tableId}/views/{viewId}/rows/{rowId}`
- **Get** - `GET /docs/{docId}/tables/{tableId}/views/{viewId}`
- **Get All** - `GET /docs/{docId}/tables/{tableId}/views`
- **Get All View Columns** - `GET /docs/{docId}/tables/{tableId}/views/{viewId}/columns`
- **Get All View Rows** - `GET /docs/{docId}/tables/{tableId}/views/{viewId}/rows`
- **Push View Button** - `POST /docs/{docId}/tables/{tableId}/views/{viewId}/rows/{rowId}/buttons/{buttonId}`
- **Update View Row** - `PUT /docs/{docId}/tables/{tableId}/views/{viewId}/rows/{rowId}`

#### Formula
- **Get** - `GET /docs/{docId}/formulas/{formulaId}`
- **Get All** - `GET /docs/{docId}/formulas`

#### Control
- **Get** - `GET /docs/{docId}/controls/{controlId}`
- **Get All** - `GET /docs/{docId}/controls`

---

## 89. Bannerbear ✅ Implementiert

**Base URL:** `https://api.bannerbear.com/v2`
**Authentication:** API Key (Bearer)
**Secret Key:** `BANNERBEAR_API_KEY`

### Ressourcen und Operationen

#### Image
- **Create** - `POST /images`
- **Get** - `GET /images/{id}`

#### Template
- **Get** - `GET /templates/{id}`
- **Get All** - `GET /templates`

---

## 90. Mindee ✅ Implementiert

**Base URL:** `https://api.mindee.net/v1/products/mindee` (V3+) oder `https://api.mindee.net/products` (V1)
**Authentication:** API Key (Basic Auth)
**Secret Key:** `MINDEE_API_KEY`

### Ressourcen und Operationen

#### Receipt
- **Predict** - `POST /receipts/v1/predict` (V1) oder `POST /receipts/v3/predict` (V3+)

#### Invoice
- **Predict** - `POST /invoices/v1/predict` (V1) oder `POST /invoices/v3/predict` (V3+)

**Hinweis:** Mindee verwendet OCR und Machine Learning, um Rechnungen und Belege zu analysieren. Die API gibt strukturierte Daten zurück.

---

## 91. Baserow ✅ Implementiert

**Base URL:** `https://api.baserow.io` (Cloud) oder `https://{your-baserow-instance}` (Self-hosted)
**Authentication:** Username + Password (JWT Token)
**Secret Key:** `BASEROW_PASSWORD`
**Username Secret Key:** `BASEROW_USERNAME`
**Host Secret Key:** `BASEROW_HOST`

### Ressourcen und Operationen

#### Row
- **Create** - `POST /api/database/rows/table/{tableId}`
- **Delete** - `DELETE /api/database/rows/table/{tableId}/row/{rowId}`
- **Get** - `GET /api/database/rows/table/{tableId}/row/{rowId}`
- **Get All** - `GET /api/database/rows/table/{tableId}`
- **Update** - `PATCH /api/database/rows/table/{tableId}/row/{rowId}`

---

## 92. Microsoft Excel ✅ Implementiert

**Base URL:** `https://graph.microsoft.com/v1.0/me`
**Authentication:** OAuth2
**Secret Key:** `MICROSOFT_EXCEL_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Workbook
- **Add Worksheet** - `POST /drive/items/{workbookId}/workbook/worksheets`
- **Delete Workbook** - `DELETE /drive/items/{workbookId}`
- **Get All** - `GET /drive/root/search(q='.xlsx')`

#### Worksheet
- **Append** - `POST /drive/items/{workbookId}/workbook/worksheets/{worksheetId}/tables/{tableId}/rows/add`
- **Clear** - `POST /drive/items/{workbookId}/workbook/worksheets/{worksheetId}/range(address='{range}')/clear`
- **Delete Worksheet** - `DELETE /drive/items/{workbookId}/workbook/worksheets/{worksheetId}`
- **Get All** - `GET /drive/items/{workbookId}/workbook/worksheets`
- **Read Rows** - `GET /drive/items/{workbookId}/workbook/worksheets/{worksheetId}/range(address='{range}')`
- **Update** - `PATCH /drive/items/{workbookId}/workbook/worksheets/{worksheetId}/range(address='{range}')`
- **Upsert** - `POST /drive/items/{workbookId}/workbook/worksheets/{worksheetId}/tables/{tableId}/rows/add`

---

## 93. Microsoft ToDo ✅ Implementiert

**Base URL:** `https://graph.microsoft.com/v1.0/me`
**Authentication:** OAuth2
**Secret Key:** `MICROSOFT_TODO_ACCESS_TOKEN`

### Ressourcen und Operationen

#### List
- **Create** - `POST /todo/lists`
- **Delete** - `DELETE /todo/lists/{listId}`
- **Get** - `GET /todo/lists/{listId}`
- **Get All** - `GET /todo/lists`
- **Update** - `PATCH /todo/lists/{listId}`

#### Task
- **Create** - `POST /todo/lists/{listId}/tasks`
- **Delete** - `DELETE /todo/lists/{listId}/tasks/{taskId}`
- **Get** - `GET /todo/lists/{listId}/tasks/{taskId}`
- **Get All** - `GET /todo/lists/{listId}/tasks`
- **Update** - `PATCH /todo/lists/{listId}/tasks/{taskId}`

#### Linked Resource
- **Create** - `POST /todo/lists/{listId}/tasks/{taskId}/linkedResources`
- **Delete** - `DELETE /todo/lists/{listId}/tasks/{taskId}/linkedResources/{linkedResourceId}`
- **Get** - `GET /todo/lists/{listId}/tasks/{taskId}/linkedResources/{linkedResourceId}`
- **Get All** - `GET /todo/lists/{listId}/tasks/{taskId}/linkedResources`
- **Update** - `PATCH /todo/lists/{listId}/tasks/{taskId}/linkedResources/{linkedResourceId}`

---

## 94. Microsoft Entra (Azure AD) ✅ Implementiert

**Base URL:** `https://graph.microsoft.com/v1.0`
**Authentication:** OAuth2
**Secret Key:** `MICROSOFT_ENTRA_ACCESS_TOKEN`

### Ressourcen und Operationen

#### User
- **Create** - `POST /users`
- **Delete** - `DELETE /users/{userId}`
- **Get** - `GET /users/{userId}`
- **Get All** - `GET /users`
- **Update** - `PATCH /users/{userId}`

#### Group
- **Create** - `POST /groups`
- **Delete** - `DELETE /groups/{groupId}`
- **Get** - `GET /groups/{groupId}`
- **Get All** - `GET /groups`
- **Update** - `PATCH /groups/{groupId}`

---

## 95. Microsoft Dynamics CRM ✅ Implementiert

**Base URL:** `https://{subdomain}.{region}/api/data/v9.2`
**Authentication:** OAuth2
**Secret Key:** `MICROSOFT_DYNAMICS_ACCESS_TOKEN`
**Subdomain Secret Key:** `MICROSOFT_DYNAMICS_SUBDOMAIN`
**Region Secret Key:** `MICROSOFT_DYNAMICS_REGION`

### Ressourcen und Operationen

#### Account
- **Create** - `POST /accounts`
- **Delete** - `DELETE /accounts({accountId})`
- **Get** - `GET /accounts({accountId})`
- **Get All** - `GET /accounts`
- **Update** - `PATCH /accounts({accountId})`

---

## 96. Azure Cosmos DB ✅ Implementiert

**Base URL:** `https://{account}.documents.azure.com/dbs/{database}`
**Authentication:** Shared Key (Header)
**Secret Key:** `AZURE_COSMOS_DB_SHARED_KEY`
**Account Secret Key:** `AZURE_COSMOS_DB_ACCOUNT`
**Database Secret Key:** `AZURE_COSMOS_DB_DATABASE`

### Ressourcen und Operationen

#### Container
- **Create** - `POST /colls`
- **Delete** - `DELETE /colls/{containerId}`
- **Get** - `GET /colls/{containerId}`
- **Get All** - `GET /colls`

#### Item
- **Create** - `POST /colls/{containerId}/docs`
- **Delete** - `DELETE /colls/{containerId}/docs/{itemId}`
- **Get** - `GET /colls/{containerId}/docs/{itemId}`
- **Get All** - `GET /colls/{containerId}/docs`
- **Query** - `POST /colls/{containerId}/docs` (mit Query-Body)
- **Update** - `PUT /colls/{containerId}/docs/{itemId}`

---

## 97. Azure Storage ✅ Implementiert

**Base URL:** `https://{storageAccount}.blob.core.windows.net` (dynamisch aus Credentials)
**Authentication:** OAuth2 oder Shared Key
**Secret Key:** `AZURE_STORAGE_ACCESS_TOKEN` (für OAuth2)
**Shared Key Secret Key:** `AZURE_STORAGE_SHARED_KEY` (für Shared Key)
**Storage Account Secret Key:** `AZURE_STORAGE_ACCOUNT`

### Ressourcen und Operationen

#### Container
- **Create** - `PUT /{containerName}?restype=container`
- **Delete** - `DELETE /{containerName}?restype=container`
- **Get** - `GET /{containerName}?restype=container`
- **Get All** - `GET /?comp=list`

#### Blob
- **Create** - `PUT /{containerName}/{blobName}`
- **Delete** - `DELETE /{containerName}/{blobName}`
- **Get** - `GET /{containerName}/{blobName}`
- **Get All** - `GET /{containerName}?restype=container&comp=list`

---

## 98. Redis

**Base URL:** Keine HTTP API (direkte Verbindung)
**Authentication:** Password (optional)
**Secret Key:** `REDIS_PASSWORD`
**Host Secret Key:** `REDIS_HOST`
**Port Secret Key:** `REDIS_PORT`

**Hinweis:** Redis verwendet keine REST API, sondern eine direkte TCP-Verbindung. Die Operationen werden über Redis-Protokoll ausgeführt.

### Ressourcen und Operationen

#### Key
- **Delete** - `DEL {key}`
- **Get** - `GET {key}`
- **Keys** - `KEYS {pattern}`
- **Set** - `SET {key} {value}`

#### List
- **List Length** - `LLEN {key}`
- **Pop** - `LPOP {key}` oder `RPOP {key}`
- **Push** - `LPUSH {key} {value}` oder `RPUSH {key} {value}`

#### Set
- **Add** - `SADD {key} {member}`
- **Get All** - `SMEMBERS {key}`
- **Remove** - `SREM {key} {member}`

#### Hash
- **Get** - `HGET {key} {field}`
- **Get All** - `HGETALL {key}`
- **Set** - `HSET {key} {field} {value}`

#### Pub/Sub
- **Publish** - `PUBLISH {channel} {message}`

#### Info
- **Info** - `INFO {section}`

---

## 99. Jenkins ✅ Implementiert

**Base URL:** `https://{your-jenkins-instance}` (dynamisch aus Credentials)
**Authentication:** Username + API Token (Basic Auth)
**Secret Key:** `JENKINS_API_TOKEN`
**Username Secret Key:** `JENKINS_USERNAME`
**Base URL Secret Key:** `JENKINS_BASE_URL`

### Ressourcen und Operationen

#### Job
- **Copy** - `POST /job/{jobName}/doCopy`
- **Create** - `POST /createItem`
- **Delete** - `POST /job/{jobName}/doDelete`
- **Get** - `GET /job/{jobName}/api/json`
- **Get All** - `GET /api/json?tree=jobs[name,url,color]`
- **Trigger** - `POST /job/{jobName}/build`
- **Trigger with Parameters** - `POST /job/{jobName}/buildWithParameters`

#### Build
- **Get** - `GET /job/{jobName}/{buildNumber}/api/json`
- **Get All** - `GET /job/{jobName}/api/json?tree=builds[number,status,timestamp,id,result]`
- **Stop** - `POST /job/{jobName}/{buildNumber}/stop`

#### Instance
- **Get** - `GET /api/json`

---

## 100. Netlify ✅ Implementiert

**Base URL:** `https://api.netlify.com/api/v1`
**Authentication:** Access Token (Bearer)
**Secret Key:** `NETLIFY_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Site
- **Get** - `GET /sites/{siteId}`
- **Get All** - `GET /sites`
- **Update** - `PATCH /sites/{siteId}`

#### Deploy
- **Cancel** - `POST /deploys/{deployId}/cancel`
- **Get** - `GET /deploys/{deployId}`
- **Get All** - `GET /sites/{siteId}/deploys`
- **Rollback** - `POST /sites/{siteId}/rollback`

---

## 101. Google Calendar ✅ Implementiert

**Base URL:** `https://www.googleapis.com/calendar/v3`
**Authentication:** OAuth2
**Secret Key:** `GOOGLE_CALENDAR_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Calendar
- **Create** - `POST /calendars`
- **Delete** - `DELETE /calendars/{calendarId}`
- **Get** - `GET /calendars/{calendarId}`
- **Get All** - `GET /users/me/calendarList`
- **Update** - `PUT /calendars/{calendarId}`

#### Event
- **Create** - `POST /calendars/{calendarId}/events`
- **Delete** - `DELETE /calendars/{calendarId}/events/{eventId}`
- **Get** - `GET /calendars/{calendarId}/events/{eventId}`
- **Get All** - `GET /calendars/{calendarId}/events`
- **Update** - `PUT /calendars/{calendarId}/events/{eventId}`

---

## 102. Grafana ✅ Implementiert

**Base URL:** `https://{your-grafana-instance}` (dynamisch aus Credentials)
**Authentication:** API Key (Bearer)
**Secret Key:** `GRAFANA_API_KEY`
**Base URL Secret Key:** `GRAFANA_BASE_URL`

### Ressourcen und Operationen

#### Dashboard
- **Create** - `POST /api/dashboards/db`
- **Delete** - `DELETE /api/dashboards/uid/{uid}`
- **Get** - `GET /api/dashboards/uid/{uid}`
- **Get All** - `GET /api/search?type=dash-db`
- **Update** - `PUT /api/dashboards/db`

#### Team
- **Create** - `POST /api/teams`
- **Delete** - `DELETE /api/teams/{teamId}`
- **Get** - `GET /api/teams/{teamId}`
- **Get All** - `GET /api/teams/search`
- **Update** - `PUT /api/teams/{teamId}`

#### Team Member
- **Add** - `POST /api/teams/{teamId}/members`
- **Get All** - `GET /api/teams/{teamId}/members`
- **Remove** - `DELETE /api/teams/{teamId}/members/{userId}`

#### User
- **Create** - `POST /api/admin/users`
- **Delete** - `DELETE /api/admin/users/{userId}`
- **Get** - `GET /api/users/{userId}`
- **Get All** - `GET /api/users/search`
- **Update** - `PUT /api/users/{userId}`

---

## 103. Sentry.io ✅ Implementiert

**Base URL:** `https://sentry.io` (Cloud) oder `https://{your-sentry-instance}` (Self-hosted)
**Authentication:** Access Token (Bearer) oder OAuth2
**Secret Key:** `SENTRY_ACCESS_TOKEN` (für Access Token)
**OAuth2 Secret Key:** `SENTRY_OAUTH2_ACCESS_TOKEN` (für OAuth2)

### Ressourcen und Operationen

#### Issue
- **Get** - `GET /api/0/projects/{organizationSlug}/{projectSlug}/issues/{issueId}/`
- **Get All** - `GET /api/0/projects/{organizationSlug}/{projectSlug}/issues/`
- **Update** - `PUT /api/0/projects/{organizationSlug}/{projectSlug}/issues/{issueId}/`

#### Event
- **Get** - `GET /api/0/projects/{organizationSlug}/{projectSlug}/events/{eventId}/`
- **Get All** - `GET /api/0/projects/{organizationSlug}/{projectSlug}/events/`

#### Project
- **Create** - `POST /api/0/teams/{organizationSlug}/{teamSlug}/projects/`
- **Delete** - `DELETE /api/0/projects/{organizationSlug}/{projectSlug}/`
- **Get** - `GET /api/0/projects/{organizationSlug}/{projectSlug}/`
- **Get All** - `GET /api/0/organizations/{organizationSlug}/projects/`
- **Update** - `PUT /api/0/projects/{organizationSlug}/{projectSlug}/`

#### Release
- **Create** - `POST /api/0/organizations/{organizationSlug}/releases/`
- **Delete** - `DELETE /api/0/organizations/{organizationSlug}/releases/{version}/`
- **Get** - `GET /api/0/organizations/{organizationSlug}/releases/{version}/`
- **Get All** - `GET /api/0/organizations/{organizationSlug}/releases/`
- **Update** - `PUT /api/0/organizations/{organizationSlug}/releases/{version}/`

#### Team
- **Create** - `POST /api/0/organizations/{organizationSlug}/teams/`
- **Delete** - `DELETE /api/0/teams/{organizationSlug}/{teamSlug}/`
- **Get** - `GET /api/0/teams/{organizationSlug}/{teamSlug}/`
- **Get All** - `GET /api/0/organizations/{organizationSlug}/teams/`
- **Update** - `PUT /api/0/teams/{organizationSlug}/{teamSlug}/`

#### Organization
- **Get** - `GET /api/0/organizations/{organizationSlug}/`
- **Get All** - `GET /api/0/organizations/`

---

## 104. Facebook Graph API ✅ Implementiert

**Base URL:** `https://graph.facebook.com/{version}` oder `https://graph-video.facebook.com/{version}` (für Video-Uploads)
**Authentication:** Access Token (Query Parameter oder Header)
**Secret Key:** `FACEBOOK_ACCESS_TOKEN`

**Hinweis:** Facebook Graph API verwendet eine flexible API-Struktur. Die Endpoints werden dynamisch über den `node` Parameter definiert.

### Ressourcen und Operationen

#### Generic API Call
- **GET** - `GET /{version}/{node}?access_token={token}`
- **POST** - `POST /{version}/{node}?access_token={token}`
- **DELETE** - `DELETE /{version}/{node}?access_token={token}`

**Beispiele:**
- `GET /v23.0/me` - Get current user
- `GET /v23.0/{page-id}/posts` - Get page posts
- `POST /v23.0/{page-id}/feed` - Post to page feed

---

## 105. Facebook Lead Ads ✅ Implementiert

**Base URL:** `https://graph.facebook.com/v23.0`
**Authentication:** OAuth2
**Secret Key:** `FACEBOOK_LEAD_ADS_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Lead
- **Get All** - `GET /{page-id}/leadgen_forms/{form-id}/leads`

#### Form
- **Get All** - `GET /{page-id}/leadgen_forms`

**Hinweis:** Facebook Lead Ads verwendet Webhooks für neue Leads. Die API wird hauptsächlich zum Abrufen von Lead-Daten verwendet.

---

## 106. CircleCI ✅ Implementiert

**Base URL:** `https://circleci.com/api/v2`
**Authentication:** API Token (Header)
**Secret Key:** `CIRCLECI_API_TOKEN`

### Ressourcen und Operationen

#### Pipeline
- **Get** - `GET /project/{vcs}/{projectSlug}/pipeline/{pipelineNumber}`
- **Get All** - `GET /project/{vcs}/{projectSlug}/pipeline`
- **Trigger** - `POST /project/{vcs}/{projectSlug}/pipeline`

---

## 107. TravisCI ✅ Implementiert

**Base URL:** `https://api.travis-ci.com`
**Authentication:** API Token (Header)
**Secret Key:** `TRAVISCI_API_TOKEN`

### Ressourcen und Operationen

#### Build
- **Get** - `GET /build/{buildId}`
- **Get All** - `GET /builds`
- **Cancel** - `POST /build/{buildId}/cancel`
- **Restart** - `POST /build/{buildId}/restart`

---

## 108. UptimeRobot ✅ Implementiert

**Base URL:** `https://api.uptimerobot.com/v2`
**Authentication:** API Key (Form Data)
**Secret Key:** `UPTIMEROBOT_API_KEY`

### Ressourcen und Operationen

#### Account
- **Get** - `POST /getAccountDetails`

#### Monitor
- **Create** - `POST /newMonitor`
- **Delete** - `POST /deleteMonitor`
- **Edit** - `POST /editMonitor`
- **Get** - `POST /getMonitors`
- **Reset** - `POST /resetMonitor`

#### Alert Contact
- **Create** - `POST /newAlertContact`
- **Delete** - `POST /deleteAlertContact`
- **Get** - `POST /getAlertContacts`

#### Maintenance Window
- **Create** - `POST /newMWindow`
- **Delete** - `POST /deleteMWindow`
- **Edit** - `POST /editMWindow`
- **Get** - `POST /getMWindows`

#### Public Status Page
- **Create** - `POST /newPSP`
- **Delete** - `POST /deletePSP`
- **Edit** - `POST /editPSP`
- **Get** - `POST /getPSPs`

**Hinweis:** UptimeRobot API verwendet POST-Requests für alle Operationen, auch für GET-Operationen.

---

## 109. SecurityScorecard ✅ Implementiert

**Base URL:** `https://api.securityscorecard.io`
**Authentication:** API Token (Bearer)
**Secret Key:** `SECURITYSCORECARD_API_TOKEN`

### Ressourcen und Operationen

#### Company
- **Get** - `GET /companies/{domain}`
- **Get All** - `GET /companies`

#### Industry
- **Get** - `GET /industries/{industry}`
- **Get All** - `GET /industries`

#### Invite
- **Create** - `POST /invites`

#### Portfolio
- **Create** - `POST /portfolios`
- **Delete** - `DELETE /portfolios/{portfolioId}`
- **Get** - `GET /portfolios/{portfolioId}`
- **Get All** - `GET /portfolios`
- **Update** - `PUT /portfolios/{portfolioId}`

#### Portfolio Company
- **Add** - `POST /portfolios/{portfolioId}/companies`
- **Remove** - `DELETE /portfolios/{portfolioId}/companies/{domain}`

#### Report
- **Get** - `GET /companies/{domain}/history/factors/{factor}`

---

## 110. Wise (TransferWise) ✅ Implementiert

**Base URL:** `https://api.transferwise.com` (Live) oder `https://api.sandbox.transferwise.tech` (Sandbox)
**Authentication:** API Token (Bearer)
**Secret Key:** `WISE_API_TOKEN`

### Ressourcen und Operationen

#### Account
- **Get** - `GET /v1/accounts/{accountId}`
- **Get All** - `GET /v1/accounts`
- **Get Statement** - `GET /v1/accounts/{accountId}/statement.json`

#### Exchange Rate
- **Get** - `GET /v1/rates`

#### Profile
- **Get** - `GET /v1/profiles/{profileId}`
- **Get All** - `GET /v1/profiles`

#### Quote
- **Create** - `POST /v3/quotes`
- **Get** - `GET /v3/quotes/{quoteId}`

#### Recipient
- **Create** - `POST /v1/accounts`
- **Delete** - `DELETE /v1/accounts/{accountId}`
- **Get** - `GET /v1/accounts/{accountId}`
- **Get All** - `GET /v1/accounts`
- **Update** - `PUT /v1/accounts/{accountId}`

#### Transfer
- **Create** - `POST /v1/transfers`
- **Cancel** - `PUT /v1/transfers/{transferId}/cancel`
- **Fund** - `POST /v3/profiles/{profileId}/transfers/{transferId}/payments`
- **Get** - `GET /v1/transfers/{transferId}`
- **Get All** - `GET /v1/transfers`

---

## 111. Invoice Ninja ✅ Implementiert

**Base URL:** `https://{your-invoice-ninja-instance}/api/v4` oder `https://{your-invoice-ninja-instance}/api/v5`
**Authentication:** API Token (Header)
**Secret Key:** `INVOICE_NINJA_API_TOKEN`
**Base URL Secret Key:** `INVOICE_NINJA_BASE_URL`

### Ressourcen und Operationen

#### Client
- **Create** - `POST /clients`
- **Delete** - `DELETE /clients/{id}`
- **Get** - `GET /clients/{id}`
- **Get All** - `GET /clients`
- **Update** - `PUT /clients/{id}`

#### Invoice
- **Create** - `POST /invoices`
- **Delete** - `DELETE /invoices/{id}`
- **Email** - `POST /invoices/{id}/email`
- **Get** - `GET /invoices/{id}`
- **Get All** - `GET /invoices`
- **Update** - `PUT /invoices/{id}`

#### Payment
- **Create** - `POST /payments`
- **Delete** - `DELETE /payments/{id}`
- **Get** - `GET /payments/{id}`
- **Get All** - `GET /payments`
- **Update** - `PUT /payments/{id}`

#### Quote
- **Create** - `POST /quotes`
- **Delete** - `DELETE /quotes/{id}`
- **Email** - `POST /quotes/{id}/email`
- **Get** - `GET /quotes/{id}`
- **Get All** - `GET /quotes`
- **Update** - `PUT /quotes/{id}`

#### Task
- **Create** - `POST /tasks`
- **Delete** - `DELETE /tasks/{id}`
- **Get** - `GET /tasks/{id}`
- **Get All** - `GET /tasks`
- **Update** - `PUT /tasks/{id}`

#### Expense
- **Create** - `POST /expenses`
- **Delete** - `DELETE /expenses/{id}`
- **Get** - `GET /expenses/{id}`
- **Get All** - `GET /expenses`
- **Update** - `PUT /expenses/{id}`

#### Bank Transaction
- **Create** - `POST /bank_transactions`
- **Delete** - `DELETE /bank_transactions/{id}`
- **Get** - `GET /bank_transactions/{id}`
- **Get All** - `GET /bank_transactions`
- **Update** - `PUT /bank_transactions/{id}`

---

## 112. RocketChat ✅ Implementiert

**Base URL:** `https://{your-rocketchat-instance}/api/v1`
**Authentication:** User ID + Auth Token (Header)
**Secret Key:** `ROCKETCHAT_AUTH_TOKEN`
**User ID Secret Key:** `ROCKETCHAT_USER_ID`
**Base URL Secret Key:** `ROCKETCHAT_BASE_URL`

### Ressourcen und Operationen

#### Chat
- **Post Message** - `POST /chat.postMessage`

---

## 113. Line (LINE Notify) ✅ Implementiert

**Base URL:** `https://notify-api.line.me/api/notify`
**Authentication:** Access Token (Bearer)
**Secret Key:** `LINE_NOTIFY_ACCESS_TOKEN`

**Hinweis:** LINE Notify wird ab 1. April 2025 eingestellt.

### Ressourcen und Operationen

#### Notification
- **Send** - `POST /notify`

---

## 114. Reddit ✅ Implementiert

**Base URL:** `https://oauth.reddit.com` (für authentifizierte Requests) oder `https://www.reddit.com` (für öffentliche Requests)
**Authentication:** OAuth2 (optional für öffentliche Requests)
**Secret Key:** `REDDIT_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Post
- **Create** - `POST /api/submit`
- **Get** - `GET /r/{subreddit}/comments/{postId}.json`
- **Get All** - `GET /r/{subreddit}/hot.json` oder `/r/{subreddit}/new.json`

#### Post Comment
- **Create** - `POST /api/comment`
- **Get** - `GET /r/{subreddit}/comments/{postId}/{commentId}.json`
- **Get All** - `GET /r/{subreddit}/comments/{postId}.json`

#### Subreddit
- **Get** - `GET /r/{subreddit}/about.json`
- **Get All** - `GET /subreddits/popular.json`

#### User
- **Get** - `GET /user/{username}/about.json`

#### Profile
- **Get** - `GET /api/v1/me`

---

## 115. Medium ✅ Implementiert

**Base URL:** `https://api.medium.com/v1`
**Authentication:** Access Token (Bearer) oder OAuth2
**Secret Key:** `MEDIUM_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Post
- **Create** - `POST /users/{userId}/posts`

#### Publication
- **Get All** - `GET /users/{userId}/publications`

---

## 116. Hacker News ✅ Implementiert

**Base URL:** `http://hn.algolia.com/api/v1`
**Authentication:** Keine (öffentliche API)

### Ressourcen und Operationen

#### Article
- **Get** - `GET /items/{itemId}`

#### All
- **Get All** - `GET /search?query={query}` oder `/search_by_date?query={query}`

#### User
- **Get** - `GET /users/{username}`

---

## 117. Metabase ✅ Implementiert

**Base URL:** `https://{your-metabase-instance}` (dynamisch aus Credentials)
**Authentication:** Username + Password (Session Token)
**Secret Key:** `METABASE_PASSWORD`
**Username Secret Key:** `METABASE_USERNAME`
**Base URL Secret Key:** `METABASE_BASE_URL`

### Ressourcen und Operationen

#### Question
- **Get** - `GET /api/card/{id}`
- **Get All** - `GET /api/card`

#### Metric
- **Get** - `GET /api/metric/{id}`
- **Get All** - `GET /api/metric`

#### Database
- **Get** - `GET /api/database/{id}`
- **Get All** - `GET /api/database`

#### Alert
- **Create** - `POST /api/alert`
- **Delete** - `DELETE /api/alert/{id}`
- **Get** - `GET /api/alert/{id}`
- **Get All** - `GET /api/alert`
- **Update** - `PUT /api/alert/{id}`

---

## 118. Mandrill ✅ Implementiert

**Base URL:** `https://mandrillapp.com/api/1.0`
**Authentication:** API Key (Body Parameter)
**Secret Key:** `MANDRILL_API_KEY`

### Ressourcen und Operationen

#### Message
- **Send** - `POST /messages/send.json`
- **Send Template** - `POST /messages/send-template.json`

#### Template
- **Get** - `GET /templates/info.json`
- **Get All** - `GET /templates/list.json`

#### Webhook
- **Get All** - `GET /webhooks/list.json`

---

## 119. Mailjet ✅ Implementiert

**Base URL:** `https://api.mailjet.com`
**Authentication:** API Key + Secret Key (Basic Auth)
**Secret Key:** `MAILJET_API_SECRET`
**API Key Secret Key:** `MAILJET_API_KEY`

### Ressourcen und Operationen

#### Email
- **Send** - `POST /v3.1/send`
- **Send Template** - `POST /v3.1/send`

#### SMS
- **Send** - `POST /v4/sms-send`

---

## 120. NextCloud ✅ Implementiert

**Base URL:** `https://{your-nextcloud-instance}/ocs/v2.php` (dynamisch aus Credentials)
**Authentication:** Access Token (Bearer) oder OAuth2
**Secret Key:** `NEXTCLOUD_ACCESS_TOKEN` (für Access Token)
**OAuth2 Secret Key:** `NEXTCLOUD_OAUTH2_ACCESS_TOKEN` (für OAuth2)
**Base URL Secret Key:** `NEXTCLOUD_BASE_URL`

### Ressourcen und Operationen

#### File
- **Copy** - `COPY /remote.php/dav/files/{userId}/{filePath}`
- **Delete** - `DELETE /remote.php/dav/files/{userId}/{filePath}`
- **Download** - `GET /remote.php/dav/files/{userId}/{filePath}`
- **Get** - `PROPFIND /remote.php/dav/files/{userId}/{filePath}`
- **Get All** - `PROPFIND /remote.php/dav/files/{userId}/{folderPath}`
- **Upload** - `PUT /remote.php/dav/files/{userId}/{filePath}`

#### Folder
- **Create** - `MKCOL /remote.php/dav/files/{userId}/{folderPath}`
- **Delete** - `DELETE /remote.php/dav/files/{userId}/{folderPath}`
- **Get** - `PROPFIND /remote.php/dav/files/{userId}/{folderPath}`
- **Get All** - `PROPFIND /remote.php/dav/files/{userId}/{folderPath}`

#### User
- **Create** - `POST /cloud/users`
- **Delete** - `DELETE /cloud/users/{userId}`
- **Get** - `GET /cloud/users/{userId}`
- **Get All** - `GET /cloud/users`
- **Update** - `PUT /cloud/users/{userId}`

**Hinweis:** NextCloud verwendet WebDAV für File-Operationen und OCS API für User-Management.

---

## 121. Grist ✅ Implementiert

**Base URL:** `https://docs.getgrist.com/api` (Free) oder `https://{customSubdomain}.getgrist.com/api` (Paid) oder `{selfHostedUrl}/api` (Self-hosted)
**Authentication:** API Key (Bearer)
**Secret Key:** `GRIST_API_KEY`
**Custom Subdomain Secret Key:** `GRIST_CUSTOM_SUBDOMAIN` (für Paid)
**Self-hosted URL Secret Key:** `GRIST_SELF_HOSTED_URL` (für Self-hosted)

### Ressourcen und Operationen

#### Row
- **Create** - `POST /docs/{docId}/tables/{tableId}/records`
- **Delete** - `DELETE /docs/{docId}/tables/{tableId}/records/{recordId}`
- **Get** - `GET /docs/{docId}/tables/{tableId}/records/{recordId}`
- **Get All** - `GET /docs/{docId}/tables/{tableId}/records`
- **Update** - `PATCH /docs/{docId}/tables/{tableId}/records/{recordId}`

---

## 122. SeaTable ✅ Implementiert

**Base URL:** `https://{your-seatable-instance}` (dynamisch aus Credentials)
**Authentication:** API Token (Bearer)
**Secret Key:** `SEATABLE_API_TOKEN`
**Base URL Secret Key:** `SEATABLE_BASE_URL`

### Ressourcen und Operationen

#### Row
- **Create** - `POST /dtable-server/api/v1/dtables/{dtableId}/rows`
- **Delete** - `DELETE /dtable-server/api/v1/dtables/{dtableId}/rows`
- **Get All** - `GET /dtable-server/api/v1/dtables/{dtableId}/rows`

#### Base
- **Get** - `GET /dtable-server/api/v1/dtables/{dtableId}`

#### Link
- **Create** - `POST /dtable-server/api/v1/dtables/{dtableId}/links`
- **Delete** - `DELETE /dtable-server/api/v1/dtables/{dtableId}/links`

#### Asset
- **Upload** - `POST /dtable-server/api/v1/dtables/{dtableId}/upload-link`

---

## 123. NocoDB ✅ Implementiert

**Base URL:** `https://{your-nocodb-instance}` (dynamisch aus Credentials)
**Authentication:** API Token (Bearer) oder User Token (Bearer)
**Secret Key:** `NOCODB_API_TOKEN` (für API Token)
**User Token Secret Key:** `NOCODB_USER_TOKEN` (für User Token)
**Base URL Secret Key:** `NOCODB_BASE_URL`

### Ressourcen und Operationen

#### Record
- **Create** - `POST /api/v1/db/data/noco/{projectId}/{tableId}`
- **Delete** - `DELETE /api/v1/db/data/noco/{projectId}/{tableId}/{recordId}`
- **Get** - `GET /api/v1/db/data/noco/{projectId}/{tableId}/{recordId}`
- **Get All** - `GET /api/v1/db/data/noco/{projectId}/{tableId}`
- **Update** - `PATCH /api/v1/db/data/noco/{projectId}/{tableId}/{recordId}`

**Hinweis:** NocoDB unterstützt mehrere API-Versionen (v0.90.0, v0.200.0+). Die Endpoints können je nach Version variieren.

---

## 124. Stackby ✅ Implementiert

**Base URL:** `https://stackby.com/api/betav1`
**Authentication:** API Key (Header)
**Secret Key:** `STACKBY_API_KEY`

### Ressourcen und Operationen

#### Record
- **Append** - `POST /{stackId}/{table}/data`
- **Delete** - `DELETE /{stackId}/{table}/data/{id}`
- **List** - `GET /{stackId}/{table}/data`
- **Read** - `GET /{stackId}/{table}/data/{id}`

---

## 125. Taiga ✅ Implementiert

**Base URL:** `https://api.taiga.io/api/v1` (Cloud) oder `https://{your-taiga-instance}/api/v1` (Self-hosted)
**Authentication:** Username + Password (Session Token)
**Secret Key:** `TAIGA_PASSWORD`
**Username Secret Key:** `TAIGA_USERNAME`
**Base URL Secret Key:** `TAIGA_BASE_URL` (für Self-hosted)

### Ressourcen und Operationen

#### Issue
- **Create** - `POST /issues`
- **Delete** - `DELETE /issues/{id}`
- **Get** - `GET /issues/{id}`
- **Get All** - `GET /issues`
- **Update** - `PATCH /issues/{id}`

#### User Story
- **Create** - `POST /userstories`
- **Delete** - `DELETE /userstories/{id}`
- **Get** - `GET /userstories/{id}`
- **Get All** - `GET /userstories`
- **Update** - `PATCH /userstories/{id}`

#### Task
- **Create** - `POST /tasks`
- **Delete** - `DELETE /tasks/{id}`
- **Get** - `GET /tasks/{id}`
- **Get All** - `GET /tasks`
- **Update** - `PATCH /tasks/{id}`

#### Epic
- **Create** - `POST /epics`
- **Delete** - `DELETE /epics/{id}`
- **Get** - `GET /epics/{id}`
- **Get All** - `GET /epics`
- **Update** - `PATCH /epics/{id}`

---

## 126. Wekan ✅ Implementiert

**Base URL:** `https://{your-wekan-instance}/api` (dynamisch aus Credentials)
**Authentication:** Username + Password (Session Token)
**Secret Key:** `WEKAN_PASSWORD`
**Username Secret Key:** `WEKAN_USERNAME`
**Base URL Secret Key:** `WEKAN_BASE_URL`

### Ressourcen und Operationen

#### Board
- **Create** - `POST /boards`
- **Delete** - `DELETE /boards/{boardId}`
- **Get** - `GET /boards/{boardId}`
- **Get All** - `GET /boards`
- **Update** - `PUT /boards/{boardId}`

#### List
- **Create** - `POST /boards/{boardId}/lists`
- **Delete** - `DELETE /boards/{boardId}/lists/{listId}`
- **Get** - `GET /boards/{boardId}/lists/{listId}`
- **Get All** - `GET /boards/{boardId}/lists`
- **Update** - `PUT /boards/{boardId}/lists/{listId}`

#### Card
- **Create** - `POST /boards/{boardId}/lists/{listId}/cards`
- **Delete** - `DELETE /boards/{boardId}/lists/{listId}/cards/{cardId}`
- **Get** - `GET /boards/{boardId}/lists/{listId}/cards/{cardId}`
- **Get All** - `GET /boards/{boardId}/lists/{listId}/cards`
- **Update** - `PUT /boards/{boardId}/lists/{listId}/cards/{cardId}`

#### Card Comment
- **Create** - `POST /boards/{boardId}/lists/{listId}/cards/{cardId}/comments`
- **Delete** - `DELETE /boards/{boardId}/lists/{listId}/cards/{cardId}/comments/{commentId}`
- **Get All** - `GET /boards/{boardId}/lists/{listId}/cards/{cardId}/comments`
- **Update** - `PUT /boards/{boardId}/lists/{listId}/cards/{cardId}/comments/{commentId}`

#### Checklist
- **Create** - `POST /boards/{boardId}/lists/{listId}/cards/{cardId}/checklists`
- **Delete** - `DELETE /boards/{boardId}/lists/{listId}/cards/{cardId}/checklists/{checklistId}`
- **Get All** - `GET /boards/{boardId}/lists/{listId}/cards/{cardId}/checklists`
- **Update** - `PUT /boards/{boardId}/lists/{listId}/cards/{cardId}/checklists/{checklistId}`

#### Checklist Item
- **Create** - `POST /boards/{boardId}/lists/{listId}/cards/{cardId}/checklists/{checklistId}/items`
- **Delete** - `DELETE /boards/{boardId}/lists/{listId}/cards/{cardId}/checklists/{checklistId}/items/{itemId}`
- **Get All** - `GET /boards/{boardId}/lists/{listId}/cards/{cardId}/checklists/{checklistId}/items`
- **Update** - `PUT /boards/{boardId}/lists/{listId}/cards/{cardId}/checklists/{checklistId}/items/{itemId}`

---

## 127. Kitemaker ✅ Implementiert

**Base URL:** `https://toil.kitemaker.co/developers/graphql`
**Authentication:** API Token (Bearer)
**Secret Key:** `KITEMAKER_API_TOKEN`

**Hinweis:** Kitemaker verwendet GraphQL statt REST API.

### Ressourcen und Operationen

#### Work Item
- **Create** - GraphQL Mutation `createWorkItem`
- **Get** - GraphQL Query `workItem`
- **Get All** - GraphQL Query `workItems`
- **Update** - GraphQL Mutation `editWorkItem`

#### Space
- **Get** - GraphQL Query `space`
- **Get All** - GraphQL Query `spaces`

#### User
- **Get** - GraphQL Query `user`
- **Get All** - GraphQL Query `users`

#### Organization
- **Get** - GraphQL Query `organization`

---

## 128. Orbit ✅ Implementiert

**Base URL:** `https://app.orbit.love/api/v1`
**Authentication:** Access Token (Bearer)
**Secret Key:** `ORBIT_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Activity
- **Create** - `POST /workspaces/{workspaceSlug}/activities`
- **Get** - `GET /workspaces/{workspaceSlug}/activities/{activityId}`
- **Get All** - `GET /workspaces/{workspaceSlug}/activities`

#### Member
- **Create** - `POST /workspaces/{workspaceSlug}/members`
- **Get** - `GET /workspaces/{workspaceSlug}/members/{memberId}`
- **Get All** - `GET /workspaces/{workspaceSlug}/members`
- **Update** - `PUT /workspaces/{workspaceSlug}/members/{memberId}`

#### Note
- **Create** - `POST /workspaces/{workspaceSlug}/members/{memberId}/notes`
- **Get** - `GET /workspaces/{workspaceSlug}/members/{memberId}/notes/{noteId}`
- **Get All** - `GET /workspaces/{workspaceSlug}/members/{memberId}/notes`
- **Update** - `PUT /workspaces/{workspaceSlug}/members/{memberId}/notes/{noteId}`

---

## 129. ProfitWell ✅ Implementiert

**Base URL:** `https://api.profitwell.com/v2`
**Authentication:** Access Token (Header)
**Secret Key:** `PROFITWELL_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Metrics
- **Get** - `GET /metrics/daily`

#### User
- **Create** - `POST /users`
- **Delete** - `DELETE /users/{userId}`
- **Get** - `GET /users/{userId}`
- **Get All** - `GET /users`
- **Update** - `PUT /users/{userId}`

#### Subscription
- **Create** - `POST /subscriptions`
- **Delete** - `DELETE /subscriptions/{subscriptionId}`
- **Get** - `GET /subscriptions/{subscriptionId}`
- **Get All** - `GET /subscriptions`
- **Update** - `PUT /subscriptions/{subscriptionId}`

---

## 130. Tapfiliate ✅ Implementiert

**Base URL:** `https://api.tapfiliate.com/1.6`
**Authentication:** API Key (Header: Api-Key)
**Secret Key:** `TAPFILIATE_API_KEY`

### Ressourcen und Operationen

#### Affiliate
- **Create** - `POST /affiliates`
- **Get** - `GET /affiliates/{affiliateId}`
- **Get All** - `GET /affiliates`
- **Update** - `PUT /affiliates/{affiliateId}`

#### Commission
- **Get** - `GET /commissions/{commissionId}`
- **Get All** - `GET /commissions`

#### Program
- **Create** - `POST /programs`
- **Get** - `GET /programs/{programId}`
- **Get All** - `GET /programs`
- **Update** - `PUT /programs/{programId}`

#### Referral
- **Get** - `GET /referrals/{referralId}`
- **Get All** - `GET /referrals`

---

## 131. Formstack ✅ Implementiert

**Base URL:** `https://www.formstack.com/api/v2`
**Authentication:** Access Token (Bearer)
**Secret Key:** `FORMSTACK_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Form
- **Get** - `GET /form/{formId}`
- **Get All** - `GET /form`

#### Submission
- **Get** - `GET /form/{formId}/submission/{submissionId}`
- **Get All** - `GET /form/{formId}/submission`

**Hinweis:** Formstack unterstützt Webhooks für neue Submissions.

---

## 132. Form.io ✅ Implementiert

**Base URL:** `https://api.form.io` (Cloud) oder `https://{your-formio-instance}` (Self-hosted)
**Authentication:** Email + Password (Session Token)
**Secret Key:** `FORMIO_PASSWORD`
**Email Secret Key:** `FORMIO_EMAIL`
**Base URL Secret Key:** `FORMIO_BASE_URL` (für Self-hosted)

### Ressourcen und Operationen

#### Form
- **Create** - `POST /form`
- **Delete** - `DELETE /form/{formId}`
- **Get** - `GET /form/{formId}`
- **Get All** - `GET /form`
- **Update** - `PUT /form/{formId}`

#### Submission
- **Create** - `POST /form/{formId}/submission`
- **Delete** - `DELETE /form/{formId}/submission/{submissionId}`
- **Get** - `GET /form/{formId}/submission/{submissionId}`
- **Get All** - `GET /form/{formId}/submission`
- **Update** - `PUT /form/{formId}/submission/{submissionId}`

**Hinweis:** Form.io unterstützt Webhooks für neue Submissions.

---

## 133. Wufoo ✅ Implementiert

**Base URL:** `https://{subdomain}.wufoo.com/api/v3`
**Authentication:** API Key + Subdomain (Basic Auth)
**Secret Key:** `WUFOO_API_KEY`
**Subdomain Secret Key:** `WUFOO_SUBDOMAIN`

### Ressourcen und Operationen

#### Form
- **Get** - `GET /forms/{formId}.json`
- **Get All** - `GET /forms.json`

#### Entry
- **Create** - `POST /forms/{formId}/entries.json`
- **Get** - `GET /forms/{formId}/entries/{entryId}.json`
- **Get All** - `GET /forms/{formId}/entries.json`

#### Report
- **Get** - `GET /reports/{reportId}.json`
- **Get All** - `GET /reports.json`

**Hinweis:** Wufoo unterstützt Webhooks für neue Entries.

---

## 134. SurveyMonkey ✅ Implementiert

**Base URL:** `https://api.surveymonkey.com/v3`
**Authentication:** Access Token (Bearer) oder OAuth2
**Secret Key:** `SURVEYMONKEY_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Survey
- **Create** - `POST /surveys`
- **Get** - `GET /surveys/{surveyId}`
- **Get All** - `GET /surveys`
- **Update** - `PATCH /surveys/{surveyId}`

#### Collector
- **Create** - `POST /surveys/{surveyId}/collectors`
- **Get** - `GET /collectors/{collectorId}`
- **Get All** - `GET /surveys/{surveyId}/collectors`
- **Update** - `PATCH /collectors/{collectorId}`

#### Response
- **Get** - `GET /collectors/{collectorId}/responses/{responseId}`
- **Get All** - `GET /collectors/{collectorId}/responses`

**Hinweis:** SurveyMonkey unterstützt Webhooks für neue Responses.

---

## 135. KoBoToolbox ✅ Implementiert

**Base URL:** `https://{your-kobotoolbox-instance}` (dynamisch aus Credentials)
**Authentication:** API Token (Bearer)
**Secret Key:** `KOBOTOOLBOX_API_TOKEN`
**Base URL Secret Key:** `KOBOTOOLBOX_BASE_URL`

### Ressourcen und Operationen

#### Form
- **Get** - `GET /api/v1/forms/{formId}`
- **Get All** - `GET /api/v1/forms`

#### Submission
- **Get** - `GET /api/v1/data/{formId}/{submissionId}`
- **Get All** - `GET /api/v1/data/{formId}`

**Hinweis:** KoBoToolbox unterstützt Webhooks für neue Submissions.

---

## 136. Acuity Scheduling ✅ Implementiert

**Base URL:** `https://acuityscheduling.com/api/v1`
**Authentication:** API Key + User ID (Basic Auth)
**Secret Key:** `ACUITY_API_KEY`
**User ID Secret Key:** `ACUITY_USER_ID`

### Ressourcen und Operationen

#### Appointment
- **Create** - `POST /appointments`
- **Delete** - `DELETE /appointments/{appointmentId}`
- **Get** - `GET /appointments/{appointmentId}`
- **Get All** - `GET /appointments`
- **Update** - `PUT /appointments/{appointmentId}`

#### Calendar
- **Get** - `GET /calendars/{calendarId}`
- **Get All** - `GET /calendars`

#### Client
- **Create** - `POST /clients`
- **Get** - `GET /clients/{clientId}`
- **Get All** - `GET /clients`
- **Update** - `PUT /clients/{clientId}`

**Hinweis:** Acuity Scheduling unterstützt Webhooks für neue Appointments.

---

## 137. GoToWebinar ✅ Implementiert

**Base URL:** `https://api.getgo.com/G2W/rest/v2`
**Authentication:** OAuth2
**Secret Key:** `GOTOWEBINAR_OAUTH2_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Webinar
- **Create** - `POST /webinars`
- **Get** - `GET /webinars/{webinarKey}`
- **Get All** - `GET /webinars`
- **Update** - `PUT /webinars/{webinarKey}`

#### Registrant
- **Create** - `POST /webinars/{webinarKey}/registrants`
- **Get** - `GET /webinars/{webinarKey}/registrants/{registrantKey}`
- **Get All** - `GET /webinars/{webinarKey}/registrants`

#### Attendee
- **Get** - `GET /webinars/{webinarKey}/attendees/{attendeeKey}`
- **Get All** - `GET /webinars/{webinarKey}/attendees`

---

## 138. Eventbrite ✅ Implementiert

**Base URL:** `https://www.eventbriteapi.com/v3`
**Authentication:** Private Key (Bearer) oder OAuth2
**Secret Key:** `EVENTBRITE_API_KEY` (für Private Key)
**OAuth2 Secret Key:** `EVENTBRITE_OAUTH2_ACCESS_TOKEN` (für OAuth2)

### Ressourcen und Operationen

#### Event
- **Create** - `POST /events`
- **Get** - `GET /events/{eventId}`
- **Get All** - `GET /organizations/{organizationId}/events`
- **Update** - `POST /events/{eventId}`

#### Attendee
- **Get** - `GET /events/{eventId}/attendees/{attendeeId}`
- **Get All** - `GET /events/{eventId}/attendees`

#### Order
- **Get** - `GET /orders/{orderId}`
- **Get All** - `GET /events/{eventId}/orders`

#### Ticket Class
- **Create** - `POST /events/{eventId}/ticket_classes`
- **Get** - `GET /events/{eventId}/ticket_classes/{ticketClassId}`
- **Get All** - `GET /events/{eventId}/ticket_classes`
- **Update** - `POST /events/{eventId}/ticket_classes/{ticketClassId}`

**Hinweis:** Eventbrite unterstützt Webhooks für neue Orders und Attendees.

---

## 139. Zammad ✅ Implementiert

**Base URL:** `https://{your-zammad-instance}/api/v1` (dynamisch aus Credentials)
**Authentication:** Basic Auth (Username + Password) oder Token Auth
**Secret Key:** `ZAMMAD_PASSWORD` (für Basic Auth)
**Username Secret Key:** `ZAMMAD_USERNAME` (für Basic Auth)
**Token Secret Key:** `ZAMMAD_API_TOKEN` (für Token Auth)
**Base URL Secret Key:** `ZAMMAD_BASE_URL`

### Ressourcen und Operationen

#### Ticket
- **Create** - `POST /tickets`
- **Get** - `GET /tickets/{ticketId}`
- **Get All** - `GET /tickets`
- **Update** - `PUT /tickets/{ticketId}`

#### User
- **Create** - `POST /users`
- **Get** - `GET /users/{userId}`
- **Get All** - `GET /users`
- **Update** - `PUT /users/{userId}`

#### Organization
- **Create** - `POST /organizations`
- **Get** - `GET /organizations/{organizationId}`
- **Get All** - `GET /organizations`
- **Update** - `PUT /organizations/{organizationId}`

#### Group
- **Get** - `GET /groups/{groupId}`
- **Get All** - `GET /groups`

---

## 140. Gong ✅ Implementiert

**Base URL:** `https://{your-gong-instance}` (dynamisch aus Credentials)
**Authentication:** Access Token (Bearer) oder OAuth2
**Secret Key:** `GONG_ACCESS_TOKEN` (für Access Token)
**OAuth2 Secret Key:** `GONG_OAUTH2_ACCESS_TOKEN` (für OAuth2)
**Base URL Secret Key:** `GONG_BASE_URL`

### Ressourcen und Operationen

#### Call
- **Get** - `GET /v2/calls/{callId}`
- **Get All** - `GET /v2/calls`

#### User
- **Get** - `GET /v2/users/{userId}`
- **Get All** - `GET /v2/users`

**Hinweis:** Gong ist eine Revenue Intelligence Platform für Sales Teams.

---

## 141. ERPNext ✅ Implementiert

**Base URL:** `https://{your-erpnext-instance}` (dynamisch aus Credentials)
**Authentication:** API Key + API Secret (Basic Auth)
**Secret Key:** `ERPNEXT_API_SECRET`
**API Key Secret Key:** `ERPNEXT_API_KEY`
**Base URL Secret Key:** `ERPNEXT_BASE_URL`

### Ressourcen und Operationen

#### Document
- **Create** - `POST /api/resource/{docType}`
- **Delete** - `DELETE /api/resource/{docType}/{name}`
- **Get** - `GET /api/resource/{docType}/{name}`
- **Get All** - `GET /api/resource/{docType}`
- **Update** - `PUT /api/resource/{docType}/{name}`

**Hinweis:** ERPNext verwendet DocTypes (Document Types) als Ressourcen. Jeder DocType kann verschiedene Felder haben.

---

## 142. QuickBase ✅ Implementiert

**Base URL:** `https://api.quickbase.com/v1`
**Authentication:** User Token (Header: QB-User-Token)
**Secret Key:** `QUICKBASE_USER_TOKEN`

### Ressourcen und Operationen

#### Record
- **Create** - `POST /records`
- **Delete** - `DELETE /records/{recordId}`
- **Get** - `GET /records/{recordId}`
- **Get All** - `GET /records`
- **Update** - `POST /records`

#### Field
- **Get** - `GET /fields/{fieldId}`
- **Get All** - `GET /fields`

#### File
- **Upload** - `POST /files`

#### Report
- **Get** - `GET /reports/{reportId}`
- **Get All** - `GET /reports`

---

## 143. FileMaker ✅ Implementiert

**Base URL:** `https://{your-filemaker-host}/fmi/data/v1/databases/{database}`
**Authentication:** Username + Password (Session Token)
**Secret Key:** `FILEMAKER_PASSWORD`
**Username Secret Key:** `FILEMAKER_USERNAME`
**Host Secret Key:** `FILEMAKER_HOST`
**Database Secret Key:** `FILEMAKER_DATABASE`

### Ressourcen und Operationen

#### Record
- **Create** - `POST /layouts/{layout}/records`
- **Delete** - `DELETE /layouts/{layout}/records/{recordId}`
- **Duplicate** - `POST /layouts/{layout}/records/{recordId}`
- **Edit** - `PATCH /layouts/{layout}/records/{recordId}`
- **Find** - `POST /layouts/{layout}/_find`
- **Get** - `GET /layouts/{layout}/records/{recordId}`
- **Get All** - `GET /layouts/{layout}/records`

#### Script
- **Perform** - `POST /scripts/{scriptName}`

**Hinweis:** FileMaker verwendet Layouts als Ressourcen. Jedes Layout kann verschiedene Felder haben.

---

## 144. Perplexity ✅ Implementiert

**Base URL:** `https://api.perplexity.ai`
**Authentication:** API Key (Bearer)
**Secret Key:** `PERPLEXITY_API_KEY`

### Ressourcen und Operationen

#### Chat
- **Complete** - `POST /chat/completions`

**Hinweis:** Perplexity ist eine AI-Suchmaschine, die Antworten mit Quellenangaben generiert.

---

## 145. Jina AI ✅ Implementiert

**Base URL:** `https://r.jina.ai` (Reader), `https://s.jina.ai` (Search), `https://deepsearch.jina.ai/v1` (Research)
**Authentication:** API Key (Header: X-API-Key)
**Secret Key:** `JINAAI_API_KEY`

### Ressourcen und Operationen

#### Reader
- **Read** - `GET /{url}` (mit speziellen Headers für Formatierung)
- **Search** - `GET /` (Web-Suche)

#### Research
- **Complete** - `POST /chat/completions` (Deep Research)

**Hinweis:** Jina AI bietet verschiedene Services: Reader (URL-zu-Text), Search (Web-Suche), und Research (Deep Research mit Chat Completions).

---

## 146. Humantic AI ✅ Implementiert

**Base URL:** `https://api.humantic.ai/v1`
**Authentication:** API Key (Query Parameter: apikey)
**Secret Key:** `HUMANTICAI_API_KEY`

### Ressourcen und Operationen

#### Profile
- **Get** - `GET /user-profile`

**Hinweis:** Humantic AI analysiert Persönlichkeitsprofile basierend auf Textdaten.

---

## 147. Rundeck ✅ Implementiert

**Base URL:** `https://{your-rundeck-instance}/api/{apiVersion}` (dynamisch aus Credentials)
**Authentication:** API Token (Header: X-Rundeck-Auth-Token)
**Secret Key:** `RUNDECK_API_TOKEN`
**Base URL Secret Key:** `RUNDECK_BASE_URL`
**API Version Secret Key:** `RUNDECK_API_VERSION`

### Ressourcen und Operationen

#### Job
- **Execute** - `POST /job/{jobId}/run`
- **Get Metadata** - `GET /job/{jobId}`

---

## 148. Unleashed Software ✅ Implementiert

**Base URL:** `https://api.unleashedsoftware.com`
**Authentication:** API ID + API Key (HMAC SHA256 Signature)
**Secret Key:** `UNLEASHED_API_KEY`
**API ID Secret Key:** `UNLEASHED_API_ID`

### Ressourcen und Operationen

#### Sales Order
- **Get All** - `GET /SalesOrders`

#### Stock On Hand
- **Get All** - `GET /StockOnHand`

---

## 149. Sms77 (seven) ✅ Implementiert

**Base URL:** `https://gateway.seven.io/api`
**Authentication:** API Key (Header: SentWith)
**Secret Key:** `SMS77_API_KEY`

### Ressourcen und Operationen

#### SMS
- **Send** - `POST /sms`

#### Voice Call
- **Send** - `POST /voice`

---

## 150. Mocean ✅ Implementiert

**Base URL:** `https://rest.moceanapi.com/rest/2`
**Authentication:** API Key + API Secret (Basic Auth)
**Secret Key:** `MOCEAN_API_SECRET`
**API Key Secret Key:** `MOCEAN_API_KEY`

### Ressourcen und Operationen

#### SMS
- **Send** - `POST /sms`

#### Voice
- **Send** - `POST /voice/dial`

---

## 151. CrateDB ✅ Implementiert

**Base URL:** `postgresql://{host}:{port}/{database}` (Connection String)
**Authentication:** Username + Password (PostgreSQL Connection)
**Secret Key:** `CRATEDB_PASSWORD`
**Username Secret Key:** `CRATEDB_USERNAME`
**Host Secret Key:** `CRATEDB_HOST`
**Port Secret Key:** `CRATEDB_PORT`
**Database Secret Key:** `CRATEDB_DATABASE`

### Ressourcen und Operationen

#### Query
- **Execute Query** - SQL Query (PostgreSQL-kompatibel)
- **Insert** - SQL INSERT
- **Update** - SQL UPDATE

**Hinweis:** CrateDB verwendet PostgreSQL-kompatible SQL-Queries.

---

## 152. QuestDB ✅ Implementiert

**Base URL:** `postgresql://{host}:{port}/{database}` (Connection String)
**Authentication:** Username + Password (PostgreSQL Connection)
**Secret Key:** `QUESTDB_PASSWORD`
**Username Secret Key:** `QUESTDB_USERNAME`
**Host Secret Key:** `QUESTDB_HOST`
**Port Secret Key:** `QUESTDB_PORT`
**Database Secret Key:** `QUESTDB_DATABASE`

### Ressourcen und Operationen

#### Query
- **Execute Query** - SQL Query (PostgreSQL-kompatibel)
- **Insert** - SQL INSERT

**Hinweis:** QuestDB verwendet PostgreSQL-kompatible SQL-Queries für Time-Series-Daten.

---

## 153. TimescaleDB ✅ Implementiert

**Base URL:** `postgresql://{host}:{port}/{database}` (Connection String)
**Authentication:** Username + Password (PostgreSQL Connection)
**Secret Key:** `TIMESCALEDB_PASSWORD`
**Username Secret Key:** `TIMESCALEDB_USERNAME`
**Host Secret Key:** `TIMESCALEDB_HOST`
**Port Secret Key:** `TIMESCALEDB_PORT`
**Database Secret Key:** `TIMESCALEDB_DATABASE`

### Ressourcen und Operationen

#### Query
- **Execute Query** - SQL Query (PostgreSQL-kompatibel)
- **Insert** - SQL INSERT
- **Update** - SQL UPDATE

**Hinweis:** TimescaleDB ist eine PostgreSQL-Erweiterung für Time-Series-Daten.

---

## 154. Spontit ✅ Implementiert

**Base URL:** `https://api.spontit.com/v3`
**Authentication:** API Key + Username (Headers: X-Authorization, X-UserId)
**Secret Key:** `SPONTIT_API_KEY`
**Username Secret Key:** `SPONTIT_USERNAME`

### Ressourcen und Operationen

#### Push
- **Create** - `POST /push`

---

## 155. Pushbullet ✅ Implementiert

**Base URL:** `https://api.pushbullet.com/v2`
**Authentication:** OAuth2
**Secret Key:** `PUSHBULLET_OAUTH2_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Push
- **Create** - `POST /pushes`
- **Delete** - `DELETE /pushes/{pushId}`
- **Get All** - `GET /pushes`
- **Update** - `POST /pushes/{pushId}`

---

## 156. Pushover ✅ Implementiert

**Base URL:** `https://api.pushover.net/1`
**Authentication:** API Token (Query Parameter: token)
**Secret Key:** `PUSHOVER_API_TOKEN`
**User Key Secret Key:** `PUSHOVER_USER_KEY`

### Ressourcen und Operationen

#### Message
- **Push** - `POST /messages.json`

---

## 157. Gotify ✅ Implementiert

**Base URL:** `https://{your-gotify-instance}` (dynamisch aus Credentials)
**Authentication:** Application Token (Header: X-Gotify-Key)
**Secret Key:** `GOTIFY_APPLICATION_TOKEN`
**Base URL Secret Key:** `GOTIFY_BASE_URL`

### Ressourcen und Operationen

#### Message
- **Create** - `POST /message`
- **Delete** - `DELETE /message/{messageId}`
- **Get All** - `GET /message`

---

## 158. Matrix ✅ Implementiert

**Base URL:** `https://{your-matrix-server}/_matrix/client/r0` (dynamisch aus Credentials)
**Authentication:** Access Token (Bearer)
**Secret Key:** `MATRIX_ACCESS_TOKEN`
**Base URL Secret Key:** `MATRIX_BASE_URL`

### Ressourcen und Operationen

#### Message
- **Create** - `POST /rooms/{roomId}/send/{eventType}`

#### Room
- **Create** - `POST /createRoom`
- **Get** - `GET /rooms/{roomId}/state`
- **Get All** - `GET /joined_rooms`
- **Update** - `PUT /rooms/{roomId}/state/{eventType}/{stateKey}`

#### Room Member
- **Invite** - `POST /rooms/{roomId}/invite`
- **Get All** - `GET /rooms/{roomId}/members`

#### Media
- **Upload** - `POST /upload`

#### Event
- **Get** - `GET /rooms/{roomId}/event/{eventId}`

#### Account
- **Get** - `GET /account/whoami`

**Hinweis:** Matrix ist ein dezentrales Chat-Protokoll. Jeder Server hat seine eigene Base URL.

---

## 159. Cal ✅ Implementiert

**Base URL:** `https://{your-cal-instance}` (dynamisch aus Credentials)
**Authentication:** API Key (Bearer)
**Secret Key:** `CAL_API_KEY`
**Base URL Secret Key:** `CAL_BASE_URL`

### Ressourcen und Operationen

#### Event
- **Get** - `GET /bookings/{bookingId}`
- **Get All** - `GET /bookings`

**Hinweis:** Cal ist ein Open-Source Scheduling-Tool. Die Base URL ist die URL der eigenen Cal-Instanz.

---

## 160. Microsoft Graph Security ✅ Implementiert

**Base URL:** `https://graph.microsoft.com/v1.0/security`
**Authentication:** OAuth2
**Secret Key:** `MICROSOFT_GRAPH_SECURITY_OAUTH2_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Secure Score
- **Get** - `GET /secureScores/{secureScoreId}`
- **Get All** - `GET /secureScores`

#### Secure Score Control Profile
- **Get** - `GET /secureScoreControlProfiles/{secureScoreControlProfileId}`
- **Get All** - `GET /secureScoreControlProfiles`
- **Update** - `PATCH /secureScoreControlProfiles/{secureScoreControlProfileId}`

---

## 161. Affinity ✅ Implementiert

**Base URL:** `https://api.affinity.co`
**Authentication:** API Key (Basic Auth)
**Secret Key:** `AFFINITY_API_KEY`

### Ressourcen und Operationen

#### Organization
- **Create** - `POST /organizations`
- **Get** - `GET /organizations/{organizationId}`
- **Get All** - `GET /organizations`
- **Update** - `PUT /organizations/{organizationId}`

#### Person
- **Create** - `POST /persons`
- **Get** - `GET /persons/{personId}`
- **Get All** - `GET /persons`
- **Update** - `PUT /persons/{personId}`

#### List
- **Get** - `GET /lists/{listId}`
- **Get All** - `GET /lists`

#### List Entry
- **Create** - `POST /list-entries`
- **Get** - `GET /list-entries/{listEntryId}`
- **Get All** - `GET /list-entries`
- **Update** - `PUT /list-entries/{listEntryId}`

---

## 162. Agile CRM ✅ Implementiert

**Base URL:** `https://{subdomain}.agilecrm.com/dev`
**Authentication:** Email + API Key (Basic Auth)
**Secret Key:** `AGILECRM_API_KEY`
**Email Secret Key:** `AGILECRM_EMAIL`
**Subdomain Secret Key:** `AGILECRM_SUBDOMAIN`

### Ressourcen und Operationen

#### Contact
- **Create** - `POST /api/contacts`
- **Delete** - `DELETE /api/contacts/{contactId}`
- **Get** - `GET /api/contacts/{contactId}`
- **Get All** - `GET /api/contacts`
- **Update** - `PUT /api/contacts/{contactId}`

#### Company
- **Create** - `POST /api/contacts`
- **Delete** - `DELETE /api/contacts/{companyId}`
- **Get** - `GET /api/contacts/{companyId}`
- **Get All** - `GET /api/contacts`
- **Update** - `PUT /api/contacts/{companyId}`

#### Deal
- **Create** - `POST /api/opportunity`
- **Delete** - `DELETE /api/opportunity/{dealId}`
- **Get** - `GET /api/opportunity/{dealId}`
- **Get All** - `GET /api/opportunity`
- **Update** - `PUT /api/opportunity/{dealId}`

---

## 163. Autopilot ✅ Implementiert

**Base URL:** `https://api2.autopilothq.com/v1`
**Authentication:** API Key (Header: autopilotapikey)
**Secret Key:** `AUTOPILOT_API_KEY`

### Ressourcen und Operationen

#### Contact
- **Create** - `POST /contacts`
- **Get** - `GET /contacts/{contactId}`
- **Get All** - `GET /contacts`
- **Update** - `PUT /contacts/{contactId}`

#### Contact Journey
- **Add** - `POST /journeys/{journeyId}/contacts`
- **Remove** - `DELETE /journeys/{journeyId}/contacts/{contactId}`

#### Contact List
- **Add** - `POST /lists/{listId}/contacts`
- **Remove** - `DELETE /lists/{listId}/contacts/{contactId}`

#### List
- **Get** - `GET /lists/{listId}`
- **Get All** - `GET /lists`

---

## 164. E-goi (Egoi) ✅ Implementiert

**Base URL:** `https://api.egoiapp.com`
**Authentication:** API Key (Header: Apikey)
**Secret Key:** `EGOI_API_KEY`

### Ressourcen und Operationen

#### Contact
- **Create** - `POST /lists/{listId}/contacts`
- **Get** - `GET /lists/{listId}/contacts/{contactId}`
- **Get All** - `GET /lists/{listId}/contacts`
- **Update** - `PATCH /lists/{listId}/contacts/{contactId}`

---

## 165. GetResponse ✅ Implementiert

**Base URL:** `https://api.getresponse.com/v3`
**Authentication:** API Key (Header: X-Auth-Token) oder OAuth2
**Secret Key:** `GETRESPONSE_API_KEY` (für API Key)
**OAuth2 Secret Key:** `GETRESPONSE_OAUTH2_ACCESS_TOKEN` (für OAuth2)

### Ressourcen und Operationen

#### Contact
- **Create** - `POST /contacts`
- **Delete** - `DELETE /contacts/{contactId}`
- **Get** - `GET /contacts/{contactId}`
- **Get All** - `GET /contacts`
- **Update** - `POST /contacts/{contactId}`

---

## 166. Lemlist ✅ Implementiert

**Base URL:** `https://api.lemlist.com/api`
**Authentication:** API Key (Basic Auth)
**Secret Key:** `LEMLIST_API_KEY`

### Ressourcen und Operationen

#### Campaign
- **Get** - `GET /campaigns/{campaignId}`
- **Get All** - `GET /campaigns`

#### Lead
- **Add** - `POST /campaigns/{campaignId}/leads`
- **Get** - `GET /leads/{leadId}`
- **Get All** - `GET /leads`
- **Unsubscribe** - `POST /leads/{leadId}/unsubscribe`

#### Email
- **Get** - `GET /emails/{emailId}`
- **Get All** - `GET /emails`

---

## 167. MailerLite ✅ Implementiert

**Base URL:** `https://api.mailerlite.com/api/v2` (v1) oder `https://connect.mailerlite.com/api` (v2)
**Authentication:** API Key (Bearer)
**Secret Key:** `MAILERLITE_API_KEY`

### Ressourcen und Operationen

#### Subscriber
- **Create** - `POST /subscribers`
- **Delete** - `DELETE /subscribers/{subscriberId}`
- **Get** - `GET /subscribers/{subscriberId}`
- **Get All** - `GET /subscribers`
- **Update** - `PUT /subscribers/{subscriberId}`

#### Group
- **Create** - `POST /groups`
- **Delete** - `DELETE /groups/{groupId}`
- **Get** - `GET /groups/{groupId}`
- **Get All** - `GET /groups`
- **Update** - `PUT /groups/{groupId}`

**Hinweis:** MailerLite unterstützt zwei API-Versionen. Version 2 verwendet eine andere Base URL.

---

## 168. Sendy ✅ Implementiert

**Base URL:** `https://{your-sendy-instance}` (dynamisch aus Credentials)
**Authentication:** API Key (Body Parameter: api_key)
**Secret Key:** `SENDY_API_KEY`
**Base URL Secret Key:** `SENDY_BASE_URL`

### Ressourcen und Operationen

#### Subscriber
- **Create** - `POST /api/subscribers/subscribe.php`
- **Delete** - `POST /api/subscribers/unsubscribe.php`
- **Get** - `POST /api/subscribers/subscription-status.php`
- **Update** - `POST /api/subscribers/update.php`

#### Campaign
- **Create** - `POST /api/campaigns/create.php`

**Hinweis:** Sendy ist ein Self-hosted Email Marketing Tool. Die Base URL ist die URL der eigenen Sendy-Instanz.

---

## 169. Mautic ✅ Implementiert

**Base URL:** `https://{your-mautic-instance}/api` (dynamisch aus Credentials)
**Authentication:** Username + Password (Basic Auth) oder OAuth2
**Secret Key:** `MAUTIC_PASSWORD` (für Basic Auth)
**Username Secret Key:** `MAUTIC_USERNAME` (für Basic Auth)
**OAuth2 Secret Key:** `MAUTIC_OAUTH2_ACCESS_TOKEN` (für OAuth2)
**Base URL Secret Key:** `MAUTIC_BASE_URL`

### Ressourcen und Operationen

#### Contact
- **Create** - `POST /contacts/new`
- **Delete** - `DELETE /contacts/{contactId}/delete`
- **Get** - `GET /contacts/{contactId}`
- **Get All** - `GET /contacts`
- **Update** - `PATCH /contacts/{contactId}/edit`

#### Company
- **Create** - `POST /companies/new`
- **Delete** - `DELETE /companies/{companyId}/delete`
- **Get** - `GET /companies/{companyId}`
- **Get All** - `GET /companies`
- **Update** - `PATCH /companies/{companyId}/edit`

#### Company Contact
- **Add** - `POST /companies/{companyId}/contact/{contactId}/add`
- **Remove** - `DELETE /companies/{companyId}/contact/{contactId}/remove`

#### Campaign Contact
- **Add** - `POST /campaigns/{campaignId}/contact/{contactId}/add`
- **Remove** - `DELETE /campaigns/{campaignId}/contact/{contactId}/remove`

#### Contact Segment
- **Add** - `POST /segments/{segmentId}/contact/{contactId}/add`
- **Remove** - `DELETE /segments/{segmentId}/contact/{contactId}/remove`

#### Segment Email
- **Send** - `POST /emails/{emailId}/send/segment/{segmentId}`

**Hinweis:** Mautic ist ein Open-Source Marketing Automation Tool. Die Base URL ist die URL der eigenen Mautic-Instanz.

---

## 170. MISP (Malware Information Sharing Platform) ✅ Implementiert

**Base URL:** `https://{your-misp-instance}` (dynamisch aus Credentials)
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `MISP_API_KEY`
**Base URL Secret Key:** `MISP_BASE_URL`

### Ressourcen und Operationen

#### Event
- **Create** - `POST /events/add`
- **Delete** - `POST /events/delete/{eventId}`
- **Get** - `GET /events/view/{eventId}`
- **Get All** - `GET /events/index`
- **Search** - `POST /events/restSearch`
- **Update** - `POST /events/edit/{eventId}`

#### Attribute
- **Create** - `POST /attributes/add/{eventId}`
- **Delete** - `POST /attributes/delete/{attributeId}`
- **Get** - `GET /attributes/view/{attributeId}`
- **Get All** - `GET /attributes/index`
- **Search** - `POST /attributes/restSearch`
- **Update** - `POST /attributes/edit/{attributeId}`

#### Object
- **Create** - `POST /objects/add/{eventId}`
- **Get** - `GET /objects/view/{objectId}`
- **Get All** - `GET /objects/index`
- **Search** - `POST /objects/restSearch`

#### Event Tag
- **Add** - `POST /tags/attachTagToObject`
- **Remove** - `POST /tags/removeTagFromObject`

#### Tag
- **Get** - `GET /tags/view/{tagId}`
- **Get All** - `GET /tags/index`

#### Organisation
- **Get** - `GET /organisations/view/{organisationId}`
- **Get All** - `GET /organisations/index`

#### User
- **Get** - `GET /users/view/{userId}`
- **Get All** - `GET /users/index`

#### Feed
- **Get** - `GET /feeds/view/{feedId}`
- **Get All** - `GET /feeds/index`

#### Galaxy
- **Get** - `GET /galaxies/view/{galaxyId}`
- **Get All** - `GET /galaxies/index`

#### Noticelist
- **Get** - `GET /noticelists/view/{noticelistId}`
- **Get All** - `GET /noticelists/index`

#### Warninglist
- **Get** - `GET /warninglists/view/{warninglistId}`
- **Get All** - `GET /warninglists/index`

**Hinweis:** MISP ist eine Open-Source Threat Intelligence Platform. Die Base URL ist die URL der eigenen MISP-Instanz.

---

## 171. TheHive ✅ Implementiert

**Base URL:** `https://{your-thehive-instance}/api` (dynamisch aus Credentials)
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `THEHIVE_API_KEY`
**Base URL Secret Key:** `THEHIVE_BASE_URL`

### Ressourcen und Operationen

#### Alert
- **Create** - `POST /alert`
- **Get** - `GET /alert/{alertId}`
- **Get All** - `GET /alert`
- **Update** - `PATCH /alert/{alertId}`

#### Case
- **Create** - `POST /case`
- **Get** - `GET /case/{caseId}`
- **Get All** - `GET /case`
- **Update** - `PATCH /case/{caseId}`

#### Task
- **Create** - `POST /case/{caseId}/task`
- **Get** - `GET /case/{caseId}/task/{taskId}`
- **Get All** - `GET /case/{caseId}/task`
- **Update** - `PATCH /case/{caseId}/task/{taskId}`

#### Observable
- **Create** - `POST /case/{caseId}/observable`
- **Get** - `GET /case/{caseId}/observable/{observableId}`
- **Get All** - `GET /case/{caseId}/observable`
- **Update** - `PATCH /case/{caseId}/observable/{observableId}`

#### Log
- **Create** - `POST /case/{caseId}/task/{taskId}/log`
- **Get** - `GET /case/{caseId}/task/{taskId}/log/{logId}`
- **Get All** - `GET /case/{caseId}/task/{taskId}/log`
- **Update** - `PATCH /case/{caseId}/task/{taskId}/log/{logId}`

**Hinweis:** TheHive ist eine Security Incident Response Platform. Die Base URL ist die URL der eigenen TheHive-Instanz.

---

## 172. Cortex ✅ Implementiert

**Base URL:** `https://{your-cortex-instance}/api` (dynamisch aus Credentials)
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `CORTEX_API_KEY`
**Base URL Secret Key:** `CORTEX_BASE_URL`

### Ressourcen und Operationen

#### Analyzer
- **Get** - `GET /analyzer/{analyzerId}`
- **Get All** - `GET /analyzer`
- **Run** - `POST /analyzer/{analyzerId}/run`

#### Responder
- **Get** - `GET /responder/{responderId}`
- **Get All** - `GET /responder`
- **Run** - `POST /responder/{responderId}/run`

#### Job
- **Get** - `GET /job/{jobId}`

**Hinweis:** Cortex ist eine Threat Intelligence Platform, die Analyzer und Responder für Security-Analysen bereitstellt. Die Base URL ist die URL der eigenen Cortex-Instanz.

---

## 173. Elastic Security ✅ Implementiert

**Base URL:** `https://{your-elastic-instance}:{port}/api` (dynamisch aus Credentials)
**Authentication:** Username + Password (Basic Auth) oder API Key
**Secret Key:** `ELASTIC_SECURITY_PASSWORD` (für Basic Auth)
**Username Secret Key:** `ELASTIC_SECURITY_USERNAME` (für Basic Auth)
**API Key Secret Key:** `ELASTIC_SECURITY_API_KEY` (für API Key)
**Base URL Secret Key:** `ELASTIC_SECURITY_BASE_URL`

### Ressourcen und Operationen

#### Case
- **Create** - `POST /cases`
- **Delete** - `DELETE /cases/{caseId}`
- **Get** - `GET /cases/{caseId}`
- **Get All** - `GET /cases/_find`
- **Update** - `PATCH /cases/{caseId}`

#### Case Comment
- **Create** - `POST /cases/{caseId}/comments`
- **Get** - `GET /cases/{caseId}/comments/{commentId}`
- **Get All** - `GET /cases/{caseId}/comments`
- **Update** - `PUT /cases/{caseId}/comments/{commentId}`

#### Case Tag
- **Create** - `POST /cases/{caseId}/tags`
- **Delete** - `DELETE /cases/{caseId}/tags/{tagId}`

#### Connector
- **Get** - `GET /cases/configure/connectors/_find`
- **Get All** - `GET /cases/configure/connectors`

**Hinweis:** Elastic Security ist Teil der Elastic Stack für Security Information and Event Management (SIEM).

---

## 174. Cisco Webex ✅ Implementiert

**Base URL:** `https://webexapis.com/v1`
**Authentication:** OAuth2
**Secret Key:** `CISCO_WEBEX_OAUTH2_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Message
- **Create** - `POST /messages`
- **Delete** - `DELETE /messages/{messageId}`
- **Get** - `GET /messages/{messageId}`
- **Get All** - `GET /messages`
- **Update** - `PUT /messages/{messageId}`

#### Meeting
- **Create** - `POST /meetings`
- **Delete** - `DELETE /meetings/{meetingId}`
- **Get** - `GET /meetings/{meetingId}`
- **Get All** - `GET /meetings`
- **Update** - `PUT /meetings/{meetingId}`

---

## 175. One Simple API ✅ Implementiert

**Base URL:** `https://onesimpleapi.com/api`
**Authentication:** API Token (Query Parameter: token)
**Secret Key:** `ONESIMPLEAPI_API_TOKEN`

### Ressourcen und Operationen

#### Website
- **Generate PDF** - `GET /website/pdf?url={url}`
- **Get SEO Data** - `GET /website/seo?url={url}`
- **Take Screenshot** - `GET /website/screenshot?url={url}`

#### Social Profile
- **Get** - `GET /social-profile?url={url}`

#### Information
- **Get** - `GET /information?url={url}`

#### Utility
- **Various utilities** - `GET /utility/{operation}`

**Hinweis:** One Simple API ist eine Toolbox mit verschiedenen No-Code-Utilities für Web-Operationen.

---

## 176. TheHive 5 (TheHiveProject) ✅ Implementiert

**Base URL:** `https://{your-thehive5-instance}/api/v1` (dynamisch aus Credentials)
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `THEHIVE5_API_KEY`
**Base URL Secret Key:** `THEHIVE5_BASE_URL`

### Ressourcen und Operationen

#### Alert
- **Create** - `POST /alert`
- **Get** - `GET /alert/{alertId}`
- **Get All** - `GET /alert`
- **Update** - `PATCH /alert/{alertId}`

#### Case
- **Create** - `POST /case`
- **Get** - `GET /case/{caseId}`
- **Get All** - `GET /case`
- **Update** - `PATCH /case/{caseId}`

#### Comment
- **Create** - `POST /case/{caseId}/comment`
- **Get** - `GET /case/{caseId}/comment/{commentId}`
- **Get All** - `GET /case/{caseId}/comment`
- **Update** - `PATCH /case/{caseId}/comment/{commentId}`

#### Observable
- **Create** - `POST /case/{caseId}/observable`
- **Get** - `GET /case/{caseId}/observable/{observableId}`
- **Get All** - `GET /case/{caseId}/observable`
- **Update** - `PATCH /case/{caseId}/observable/{observableId}`

#### Task
- **Create** - `POST /case/{caseId}/task`
- **Get** - `GET /case/{caseId}/task/{taskId}`
- **Get All** - `GET /case/{caseId}/task`
- **Update** - `PATCH /case/{caseId}/task/{taskId}`

#### Task Log
- **Create** - `POST /case/{caseId}/task/{taskId}/log`
- **Get** - `GET /case/{caseId}/task/{taskId}/log/{logId}`
- **Get All** - `GET /case/{caseId}/task/{taskId}/log`
- **Update** - `PATCH /case/{caseId}/task/{taskId}/log/{logId}`

#### Page
- **Get** - `GET /page/{pageId}`
- **Get All** - `GET /page`

#### Query
- **Execute** - `POST /query`

**Hinweis:** TheHive 5 ist die neuere Version von TheHive (Security Incident Response Platform). Die Base URL ist die URL der eigenen TheHive 5-Instanz.

---

## 177. Cockpit ✅ Implementiert

**Base URL:** `https://{your-cockpit-instance}/api` (dynamisch aus Credentials)
**Authentication:** Access Token (Query Parameter: token)
**Secret Key:** `COCKPIT_ACCESS_TOKEN`
**Base URL Secret Key:** `COCKPIT_BASE_URL`

### Ressourcen und Operationen

#### Collection
- **Create** - `POST /collections/save/{collectionName}`
- **Get** - `GET /collections/get/{collectionName}/{entryId}`
- **Get All** - `GET /collections/get/{collectionName}`
- **Update** - `POST /collections/save/{collectionName}/{entryId}`
- **Delete** - `DELETE /collections/remove/{collectionName}/{entryId}`

#### Singleton
- **Get** - `GET /singletons/get/{singletonName}`
- **Update** - `POST /singletons/save/{singletonName}`

#### Form
- **Submit** - `POST /forms/submit/{formName}`

**Hinweis:** Cockpit ist ein Headless CMS. Die Base URL ist die URL der eigenen Cockpit-Instanz.

---

## 178. Adalo ✅ Implementiert

**Base URL:** `https://api.adalo.com/v0/apps/{appId}`
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `ADALO_API_KEY`
**App ID Secret Key:** `ADALO_APP_ID`

### Ressourcen und Operationen

#### Collection
- **Create** - `POST /collections/{collectionId}`
- **Delete** - `DELETE /collections/{collectionId}/{rowId}`
- **Get** - `GET /collections/{collectionId}/{rowId}`
- **Get All** - `GET /collections/{collectionId}`
- **Update** - `PATCH /collections/{collectionId}/{rowId}`

**Hinweis:** Adalo ist eine No-Code Platform für mobile Apps. Die App ID ist Teil der Base URL.

---

## 179. Bubble ✅ Implementiert

**Base URL:** `https://{appName}.bubbleapps.io/api/1.1` (Bubble-hosted) oder `{domain}/api/1.1` (Self-hosted)
**Authentication:** API Token (Bearer)
**Secret Key:** `BUBBLE_API_TOKEN`
**App Name Secret Key:** `BUBBLE_APP_NAME` (für Bubble-hosted)
**Domain Secret Key:** `BUBBLE_DOMAIN` (für Self-hosted)
**Environment Secret Key:** `BUBBLE_ENVIRONMENT` (development oder live)

### Ressourcen und Operationen

#### Object
- **Create** - `POST /obj/{typeName}`
- **Delete** - `DELETE /obj/{typeName}/{objectId}`
- **Get** - `GET /obj/{typeName}/{objectId}`
- **Get All** - `GET /obj/{typeName}`
- **Update** - `PATCH /obj/{typeName}/{objectId}`

**Hinweis:** Bubble ist eine No-Code Platform für Web-Apps. Die Base URL hängt davon ab, ob die App auf Bubble gehostet wird oder selbst gehostet ist.

---

## 180. uProc ✅ Implementiert

**Base URL:** `https://api.uproc.io/api/v2`
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `UPROC_API_KEY`

### Ressourcen und Operationen

#### Process
- **Create** - `POST /process`

**Tool Groups:**
- **Audio** - Audio-Verarbeitungstools
- **Communication** - Kommunikationstools
- **Company** - Firmeninformationstools
- **Finance** - Finanz-Tools
- **Geographic** - Geografische Tools
- **Image** - Bildverarbeitungstools
- **Internet** - Internet-Tools
- **Personal** - Persönliche Informationstools
- **Product** - Produkt-Tools
- **Security** - Sicherheits-Tools
- **Text** - Textverarbeitungstools

**Hinweis:** uProc ist eine API-Toolbox mit verschiedenen Tools für Datenverarbeitung. Jedes Tool hat spezifische Parameter und kann asynchron mit einem Data Webhook ausgeführt werden.

---

## 181. Customer.io ✅ Implementiert

**Base URL:** `https://api.customer.io/v1` (US) oder `https://api-eu.customer.io/v1` (EU) oder `https://beta-api.customer.io/v1` (Beta API)
**Authentication:** App API Key (Basic Auth)
**Secret Key:** `CUSTOMERIO_APP_API_KEY`
**Region Secret Key:** `CUSTOMERIO_REGION` (track.customer.io für US oder track-eu.customer.io für EU)

### Ressourcen und Operationen

#### Customer
- **Create** - `PUT /customers/{customerId}`
- **Delete** - `DELETE /customers/{customerId}`
- **Get** - `GET /customers/{customerId}`
- **Update** - `PUT /customers/{customerId}`

#### Event
- **Create** - `POST /events`

#### Campaign
- **Get** - `GET /campaigns/{campaignId}` (Beta API)
- **Get All** - `GET /campaigns` (Beta API)

#### Segment
- **Get** - `GET /segments/{segmentId}` (Beta API)
- **Get All** - `GET /segments` (Beta API)

---

## 182. Google Docs ✅ Implementiert

**Base URL:** `https://docs.googleapis.com/v1`
**Authentication:** OAuth2 oder Service Account
**Secret Key:** `GOOGLE_DOCS_OAUTH2_ACCESS_TOKEN` (für OAuth2)
**Service Account Secret Key:** `GOOGLE_DOCS_SERVICE_ACCOUNT_KEY` (für Service Account)

### Ressourcen und Operationen

#### Document
- **Create** - `POST /documents`
- **Get** - `GET /documents/{documentId}`
- **Get All** - `GET /documents`
- **Update** - `POST /documents/{documentId}:batchUpdate`

**Hinweis:** Google Docs API verwendet OAuth2 oder Service Account für die Authentifizierung.

---

## 183. Google Translate ✅ Implementiert

**Base URL:** `https://translation.googleapis.com/v3`
**Authentication:** OAuth2 oder Service Account
**Secret Key:** `GOOGLE_TRANSLATE_OAUTH2_ACCESS_TOKEN` (für OAuth2)
**Service Account Secret Key:** `GOOGLE_TRANSLATE_SERVICE_ACCOUNT_KEY` (für Service Account)

### Ressourcen und Operationen

#### Translation
- **Translate** - `POST /projects/{projectId}/locations/{location}:translateText`
- **Detect Language** - `POST /projects/{projectId}/locations/{location}:detectLanguage`

**Hinweis:** Google Translate API v3 verwendet OAuth2 oder Service Account. Die API erfordert ein Google Cloud Project mit aktivierter Translation API.

---

## 184. Airtop ✅ Implementiert

**Base URL:** `https://api.airtop.ai/api/v1`
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `AIRTOP_API_KEY`

### Ressourcen und Operationen

#### Session
- **Create** - `POST /sessions`
- **Get** - `GET /sessions/{sessionId}`
- **Update** - `PATCH /sessions/{sessionId}`
- **Delete** - `DELETE /sessions/{sessionId}`

#### Window
- **Create** - `POST /sessions/{sessionId}/windows`
- **Get** - `GET /sessions/{sessionId}/windows/{windowId}`
- **Get All** - `GET /sessions/{sessionId}/windows`
- **Update** - `PATCH /sessions/{sessionId}/windows/{windowId}`
- **Delete** - `DELETE /sessions/{sessionId}/windows/{windowId}`

#### File
- **Upload** - `POST /sessions/{sessionId}/files`
- **Get** - `GET /sessions/{sessionId}/files/{fileId}`
- **Get All** - `GET /sessions/{sessionId}/files`
- **Download** - `GET /sessions/{sessionId}/files/{fileId}/download`

#### Extraction
- **Create** - `POST /sessions/{sessionId}/extractions`
- **Get** - `GET /sessions/{sessionId}/extractions/{extractionId}`
- **Get All** - `GET /sessions/{sessionId}/extractions`

#### Interaction
- **Click** - `POST /sessions/{sessionId}/interactions/click`
- **Type** - `POST /sessions/{sessionId}/interactions/type`
- **Scroll** - `POST /sessions/{sessionId}/interactions/scroll`
- **Navigate** - `POST /sessions/{sessionId}/interactions/navigate`

**Hinweis:** Airtop ist eine Browser-Automation-API für Web-Scraping und -Interaktionen.

---

## 185. Flow ✅ Implementiert

**Base URL:** `https://api.getflow.com/v2`
**Authentication:** API Token (Basic Auth)
**Secret Key:** `FLOW_API_TOKEN`
**Organization ID Secret Key:** `FLOW_ORGANIZATION_ID`

### Ressourcen und Operationen

#### Task
- **Create** - `POST /tasks`
- **Delete** - `DELETE /tasks/{taskId}`
- **Get** - `GET /tasks/{taskId}`
- **Get All** - `GET /tasks`
- **Update** - `PUT /tasks/{taskId}`

**Hinweis:** Flow ist ein Task-Management-Tool. Die API erfordert eine Organization ID.

---

---

## 186. Kafka

**Base URL:** `{broker-url}` (dynamisch aus Credentials, z.B. `localhost:9092`)
**Authentication:** Keine (Plain) oder SASL (PLAIN, SCRAM-SHA-256, SCRAM-SHA-512)
**Broker URL Secret Key:** `KAFKA_BROKER_URL`
**SASL Username Secret Key:** `KAFKA_SASL_USERNAME` (für SASL)
**SASL Password Secret Key:** `KAFKA_SASL_PASSWORD` (für SASL)

### Ressourcen und Operationen

#### Message
- **Send** - `POST /topics/{topicName}` (über Kafka Producer)

**Hinweis:** Kafka ist ein Message Broker für Event-Streaming. Die Base URL ist die Broker-URL (z.B. `localhost:9092` oder `kafka.example.com:9092`). Kafka unterstützt auch Schema Registry (Confluent) für Avro-Schemas.

---

## 187. Bitwarden ✅ Implementiert

**Base URL:** `https://api.bitwarden.com` (Cloud) oder `https://{your-bitwarden-instance}/api` (Self-hosted)
**Authentication:** OAuth2 (Client ID + Client Secret)
**Secret Key:** `BITWARDEN_CLIENT_ID`
**Client Secret Key:** `BITWARDEN_CLIENT_SECRET`
**Base URL Secret Key:** `BITWARDEN_BASE_URL` (für Self-hosted)

### Ressourcen und Operationen

#### Collection
- **Create** - `POST /collections`
- **Delete** - `DELETE /collections/{collectionId}`
- **Get** - `GET /collections/{collectionId}`
- **Get All** - `GET /collections`
- **Update** - `PUT /collections/{collectionId}`

#### Group
- **Create** - `POST /groups`
- **Delete** - `DELETE /groups/{groupId}`
- **Get** - `GET /groups/{groupId}`
- **Get All** - `GET /groups`
- **Update** - `PUT /groups/{groupId}`

#### Member
- **Create** - `POST /members`
- **Delete** - `DELETE /members/{memberId}`
- **Get** - `GET /members/{memberId}`
- **Get All** - `GET /members`
- **Update** - `PUT /members/{memberId}`

#### Event
- **Get** - `GET /events/{eventId}`
- **Get All** - `GET /events`

**Hinweis:** Bitwarden ist ein Password Manager. Die API unterstützt sowohl Cloud- als auch Self-hosted-Instanzen.

---

## 188. Zulip ✅ Implementiert

**Base URL:** `https://{your-zulip-instance}/api/v1` (dynamisch aus Credentials)
**Authentication:** API Key (Basic Auth: email:apiKey)
**Secret Key:** `ZULIP_API_KEY`
**Email Secret Key:** `ZULIP_EMAIL`
**Base URL Secret Key:** `ZULIP_BASE_URL`

### Ressourcen und Operationen

#### Message
- **Create** - `POST /messages`
- **Delete** - `DELETE /messages/{messageId}`
- **Get** - `GET /messages/{messageId}`
- **Get All** - `GET /messages`
- **Update** - `PATCH /messages/{messageId}`

#### Stream
- **Create** - `POST /streams`
- **Delete** - `DELETE /streams/{streamId}`
- **Get** - `GET /streams/{streamId}`
- **Get All** - `GET /streams`
- **Update** - `PATCH /streams/{streamId}`

#### User
- **Create** - `POST /users`
- **Get** - `GET /users/{userId}`
- **Get All** - `GET /users`
- **Update** - `PATCH /users/{userId}`

**Hinweis:** Zulip ist ein Team-Chat-Tool. Die Base URL ist die URL der eigenen Zulip-Instanz.

---

## 189. Beeminder ✅ Implementiert

**Base URL:** `https://www.beeminder.com/api/v1`
**Authentication:** API Token (Query Parameter: auth_token) oder OAuth2
**Secret Key:** `BEEMINDER_API_TOKEN` (für API Token)
**OAuth2 Secret Key:** `BEEMINDER_OAUTH2_ACCESS_TOKEN` (für OAuth2)

### Ressourcen und Operationen

#### Goal
- **Create** - `POST /users/{username}/goals.json`
- **Get** - `GET /users/{username}/goals/{goalName}.json`
- **Get All** - `GET /users/{username}/goals.json`
- **Get Archived** - `GET /users/{username}/goals.json?filter=frontburner`
- **Update** - `PUT /users/{username}/goals/{goalName}.json`
- **Refresh** - `POST /users/{username}/goals/{goalName}/refresh.json`
- **Short Circuit** - `POST /users/{username}/goals/{goalName}/shortcircuit.json`
- **Step Down** - `POST /users/{username}/goals/{goalName}/stepdown.json`
- **Cancel Step Down** - `POST /users/{username}/goals/{goalName}/cancel_stepdown.json`

#### Datapoint
- **Create** - `POST /users/{username}/goals/{goalName}/datapoints.json`
- **Create All** - `POST /users/{username}/goals/{goalName}/datapoints.json` (mit Array)
- **Delete** - `DELETE /users/{username}/goals/{goalName}/datapoints/{datapointId}.json`
- **Get** - `GET /users/{username}/goals/{goalName}/datapoints/{datapointId}.json`
- **Get All** - `GET /users/{username}/goals/{goalName}/datapoints.json`
- **Update** - `PUT /users/{username}/goals/{goalName}/datapoints/{datapointId}.json`

#### Charge
- **Create** - `POST /users/{username}/goals/{goalName}/charges.json`

#### User
- **Get** - `GET /users/{username}.json`

**Hinweis:** Beeminder ist ein Goal-Tracking-Tool. Die API verwendet den Benutzernamen im URL-Pfad.

---

## 190. Onfleet ✅ Implementiert

**Base URL:** `https://onfleet.com/api/v2`
**Authentication:** API Key (Basic Auth)
**Secret Key:** `ONFLEET_API_KEY`

### Ressourcen und Operationen

#### Task
- **Create** - `POST /tasks`
- **Delete** - `DELETE /tasks/{taskId}`
- **Get** - `GET /tasks/{taskId}`
- **Get All** - `GET /tasks`
- **Update** - `PUT /tasks/{taskId}`

#### Worker
- **Create** - `POST /workers`
- **Delete** - `DELETE /workers/{workerId}`
- **Get** - `GET /workers/{workerId}`
- **Get All** - `GET /workers`
- **Update** - `PUT /workers/{workerId}`

#### Destination
- **Create** - `POST /destinations`
- **Get** - `GET /destinations/{destinationId}`

#### Recipient
- **Create** - `POST /recipients`
- **Get** - `GET /recipients/{recipientId}`
- **Get All** - `GET /recipients`
- **Update** - `PUT /recipients/{recipientId}`

#### Team
- **Get** - `GET /teams/{teamId}`
- **Get All** - `GET /teams`

#### Hub
- **Get** - `GET /hubs/{hubId}`
- **Get All** - `GET /hubs`

#### Organization
- **Get** - `GET /organization`

#### Admin
- **Get** - `GET /admins/{adminId}`
- **Get All** - `GET /admins`

#### Container
- **Get** - `GET /containers/{containerId}`

**Hinweis:** Onfleet ist eine Delivery Management Platform für Last-Mile-Lieferungen.

---

## 191. Google Chat ✅ Implementiert

**Base URL:** `https://chat.googleapis.com`
**Authentication:** OAuth2 oder Service Account
**Secret Key:** `GOOGLE_CHAT_OAUTH2_ACCESS_TOKEN` (für OAuth2)
**Service Account Secret Key:** `GOOGLE_CHAT_SERVICE_ACCOUNT_KEY` (für Service Account)

### Ressourcen und Operationen

#### Message
- **Create** - `POST /v1/{parent}/messages`
- **Delete** - `DELETE /v1/{name}`
- **Get** - `GET /v1/{name}`
- **Get All** - `GET /v1/{parent}/messages`
- **Update** - `PUT /v1/{name}`

#### Space
- **Get** - `GET /v1/{name}`
- **Get All** - `GET /v1/spaces`

#### Member
- **Get** - `GET /v1/{name}`
- **Get All** - `GET /v1/{parent}/members`

**Hinweis:** Google Chat API ermöglicht die Integration mit Google Chat Spaces und Messages.

---

## 192. Google BigQuery ✅ Implementiert

**Base URL:** `https://bigquery.googleapis.com/bigquery/v2`
**Authentication:** OAuth2 oder Service Account
**Secret Key:** `GOOGLE_BIGQUERY_OAUTH2_ACCESS_TOKEN` (für OAuth2)
**Service Account Secret Key:** `GOOGLE_BIGQUERY_SERVICE_ACCOUNT_KEY` (für Service Account)

### Ressourcen und Operationen

#### Database
- **Execute Query** - `POST /projects/{projectId}/queries`
- **Insert** - `POST /projects/{projectId}/datasets/{datasetId}/tables/{tableId}/insertAll`

#### Dataset
- **Create** - `POST /projects/{projectId}/datasets`
- **Delete** - `DELETE /projects/{projectId}/datasets/{datasetId}`
- **Get** - `GET /projects/{projectId}/datasets/{datasetId}`
- **Get All** - `GET /projects/{projectId}/datasets`

#### Table
- **Create** - `POST /projects/{projectId}/datasets/{datasetId}/tables`
- **Delete** - `DELETE /projects/{projectId}/datasets/{datasetId}/tables/{tableId}`
- **Get** - `GET /projects/{projectId}/datasets/{datasetId}/tables/{tableId}`
- **Get All** - `GET /projects/{projectId}/datasets/{datasetId}/tables`

**Hinweis:** Google BigQuery ist ein Data Warehouse für große Datenmengen. Die API unterstützt SQL-ähnliche Abfragen und Datenimport.

---

## 193. Google G Suite Admin ✅ Implementiert

**Base URL:** `https://www.googleapis.com/admin`
**Authentication:** OAuth2 oder Service Account
**Secret Key:** `GOOGLE_GSUITE_ADMIN_OAUTH2_ACCESS_TOKEN` (für OAuth2)
**Service Account Secret Key:** `GOOGLE_GSUITE_ADMIN_SERVICE_ACCOUNT_KEY` (für Service Account)

### Ressourcen und Operationen

#### User
- **Create** - `POST /directory/v1/users`
- **Delete** - `DELETE /directory/v1/users/{userKey}`
- **Get** - `GET /directory/v1/users/{userKey}`
- **Get All** - `GET /directory/v1/users`
- **Update** - `PUT /directory/v1/users/{userKey}`

#### Group
- **Create** - `POST /directory/v1/groups`
- **Delete** - `DELETE /directory/v1/groups/{groupKey}`
- **Get** - `GET /directory/v1/groups/{groupKey}`
- **Get All** - `GET /directory/v1/groups`
- **Update** - `PUT /directory/v1/groups/{groupKey}`

#### Device
- **Get** - `GET /directory/v1/customer/{customerId}/devices/{deviceId}`
- **Get All** - `GET /directory/v1/customer/{customerId}/devices`

**Hinweis:** Google G Suite Admin API ermöglicht die Verwaltung von Google Workspace (früher G Suite) Benutzern, Gruppen und Geräten.

---

## 194. Google YouTube ✅ Implementiert

**Base URL:** `https://www.googleapis.com/youtube/v3`
**Authentication:** OAuth2
**Secret Key:** `GOOGLE_YOUTUBE_OAUTH2_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Video
- **Get** - `GET /videos`
- **Get All** - `GET /videos`
- **Update** - `PUT /videos`

#### Playlist
- **Create** - `POST /playlists`
- **Delete** - `DELETE /playlists`
- **Get** - `GET /playlists`
- **Get All** - `GET /playlists`
- **Update** - `PUT /playlists`

#### Playlist Item
- **Create** - `POST /playlistItems`
- **Delete** - `DELETE /playlistItems`
- **Get** - `GET /playlistItems`
- **Get All** - `GET /playlistItems`
- **Update** - `PUT /playlistItems`

#### Channel
- **Get** - `GET /channels`
- **Get All** - `GET /channels`
- **Update** - `PUT /channels`

#### Video Category
- **Get All** - `GET /videoCategories`

**Hinweis:** Google YouTube Data API v3 ermöglicht den Zugriff auf YouTube-Videos, Playlists, Channels und mehr.

---

## 195. Figma ✅ Implementiert

**Base URL:** `https://api.figma.com/v1`
**Authentication:** Personal Access Token (Header: X-Figma-Token)
**Secret Key:** `FIGMA_ACCESS_TOKEN`

### Ressourcen und Operationen

#### File
- **Get** - `GET /files/{fileKey}`
- **Get Nodes** - `GET /files/{fileKey}/nodes`

#### Comment
- **Create** - `POST /files/{fileKey}/comments`
- **Get** - `GET /files/{fileKey}/comments/{commentId}`
- **Get All** - `GET /files/{fileKey}/comments`
- **Delete** - `DELETE /files/{fileKey}/comments/{commentId}`

#### Project
- **Get** - `GET /projects/{projectId}`
- **Get All** - `GET /teams/{teamId}/projects`

#### File Version
- **Get** - `GET /files/{fileKey}/versions/{versionId}`
- **Get All** - `GET /files/{fileKey}/versions`

**Hinweis:** Figma API ermöglicht den Zugriff auf Design-Dateien, Kommentare, Projekte und Versionen.

---

## 196. Spotify ✅ Implementiert

**Base URL:** `https://api.spotify.com/v1`
**Authentication:** OAuth2
**Secret Key:** `SPOTIFY_OAUTH2_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Album
- **Get** - `GET /albums/{albumId}`
- **Get All** - `GET /albums`
- **Get Tracks** - `GET /albums/{albumId}/tracks`

#### Artist
- **Get** - `GET /artists/{artistId}`
- **Get All** - `GET /artists`
- **Get Albums** - `GET /artists/{artistId}/albums`
- **Get Top Tracks** - `GET /artists/{artistId}/top-tracks`

#### Track
- **Get** - `GET /tracks/{trackId}`
- **Get All** - `GET /tracks`
- **Get Audio Features** - `GET /audio-features/{trackId}`

#### Playlist
- **Create** - `POST /users/{userId}/playlists`
- **Delete** - `DELETE /playlists/{playlistId}/followers`
- **Get** - `GET /playlists/{playlistId}`
- **Get All** - `GET /me/playlists`
- **Update** - `PUT /playlists/{playlistId}`
- **Add Items** - `POST /playlists/{playlistId}/tracks`
- **Remove Items** - `DELETE /playlists/{playlistId}/tracks`

#### Player
- **Pause** - `PUT /me/player/pause`
- **Play** - `PUT /me/player/play`
- **Get Currently Playing** - `GET /me/player/currently-playing`
- **Get Recently Played** - `GET /me/player/recently-played`
- **Next** - `POST /me/player/next`
- **Previous** - `POST /me/player/previous`
- **Add to Queue** - `POST /me/player/queue`
- **Set Volume** - `PUT /me/player/volume`

#### Library
- **Add** - `PUT /me/tracks`
- **Get All** - `GET /me/tracks`
- **Remove** - `DELETE /me/tracks`

#### My Data
- **Get** - `GET /me`

**Hinweis:** Spotify Web API ermöglicht den Zugriff auf Musik-Daten, Playlists, Player-Steuerung und persönliche Bibliothek.

---

## 197. Snowflake ✅ Implementiert

**Base URL:** `{account}.snowflakecomputing.com` (dynamisch aus Credentials)
**Authentication:** Username + Password oder OAuth2
**Secret Key:** `SNOWFLAKE_PASSWORD` (für Username/Password)
**Username Secret Key:** `SNOWFLAKE_USERNAME` (für Username/Password)
**Account Secret Key:** `SNOWFLAKE_ACCOUNT`
**Database Secret Key:** `SNOWFLAKE_DATABASE`
**Schema Secret Key:** `SNOWFLAKE_SCHEMA`
**Warehouse Secret Key:** `SNOWFLAKE_WAREHOUSE`

### Ressourcen und Operationen

#### Query
- **Execute** - SQL Query Execution

#### Table
- **Insert** - `INSERT INTO {table}`
- **Update** - `UPDATE {table}`

**Hinweis:** Snowflake ist ein Cloud Data Warehouse. Die API verwendet SQL-Queries über eine JDBC/ODBC-Verbindung. Die Base URL ist die Account-URL (z.B. `xy12345.snowflakecomputing.com`).

---

## 198. PagerDuty ✅ Implementiert

**Base URL:** `https://api.pagerduty.com`
**Authentication:** API Token (Header: Authorization) oder OAuth2
**Secret Key:** `PAGERDUTY_API_TOKEN` (für API Token)
**OAuth2 Secret Key:** `PAGERDUTY_OAUTH2_ACCESS_TOKEN` (für OAuth2)

### Ressourcen und Operationen

#### Incident
- **Create** - `POST /incidents`
- **Delete** - `DELETE /incidents/{incidentId}`
- **Get** - `GET /incidents/{incidentId}`
- **Get All** - `GET /incidents`
- **Update** - `PUT /incidents/{incidentId}`
- **Resolve** - `PUT /incidents/{incidentId}/resolve`
- **Acknowledge** - `PUT /incidents/{incidentId}/acknowledge`

#### Incident Note
- **Create** - `POST /incidents/{incidentId}/notes`
- **Get** - `GET /incidents/{incidentId}/notes/{noteId}`
- **Get All** - `GET /incidents/{incidentId}/notes`

#### Log Entry
- **Get** - `GET /log_entries/{logEntryId}`
- **Get All** - `GET /log_entries`

#### User
- **Get** - `GET /users/{userId}`
- **Get All** - `GET /users`
- **Update** - `PUT /users/{userId}`

**Hinweis:** PagerDuty ist ein Incident Management System für DevOps-Teams.

---

## 199. RabbitMQ

**Base URL:** `amqp://{host}:{port}` (dynamisch aus Credentials)
**Authentication:** Username + Password
**Secret Key:** `RABBITMQ_PASSWORD`
**Username Secret Key:** `RABBITMQ_USERNAME`
**Host Secret Key:** `RABBITMQ_HOST`
**Port Secret Key:** `RABBITMQ_PORT` (Standard: 5672)

### Ressourcen und Operationen

#### Message
- **Send** - Publish to Exchange/Queue
- **Delete** - Delete from Queue

**Hinweis:** RabbitMQ ist ein Message Broker für AMQP (Advanced Message Queuing Protocol). Die Base URL ist eine AMQP-URL (z.B. `amqp://localhost:5672`). RabbitMQ unterstützt Exchanges, Queues, Routing Keys und verschiedene Exchange-Typen (direct, topic, fanout, headers).

---

## 200. Strava ✅ Implementiert

**Base URL:** `https://www.strava.com/api/v3`
**Authentication:** OAuth2
**Secret Key:** `STRAVA_OAUTH2_ACCESS_TOKEN`

### Ressourcen und Operationen

#### Activity
- **Create** - `POST /activities`
- **Delete** - `DELETE /activities/{activityId}`
- **Get** - `GET /activities/{activityId}`
- **Get All** - `GET /athlete/activities`
- **Update** - `PUT /activities/{activityId}`
- **Get Zones** - `GET /activities/{activityId}/zones`
- **Get Laps** - `GET /activities/{activityId}/laps`
- **Get Comments** - `GET /activities/{activityId}/comments`
- **Get Kudos** - `GET /activities/{activityId}/kudos`

**Hinweis:** Strava ist eine Fitness-Tracking-Plattform. Die API ermöglicht den Zugriff auf Aktivitäten, Athleten-Daten und mehr.

---

## 201. Splunk ✅ Implementiert

**Base URL:** `https://{your-splunk-instance}:{port}/services` (dynamisch aus Credentials)
**Authentication:** Username + Password (Basic Auth) oder Token
**Secret Key:** `SPLUNK_PASSWORD` (für Username/Password)
**Username Secret Key:** `SPLUNK_USERNAME` (für Username/Password)
**Token Secret Key:** `SPLUNK_TOKEN` (für Token)
**Base URL Secret Key:** `SPLUNK_BASE_URL`
**Port Secret Key:** `SPLUNK_PORT` (Standard: 8089)

### Ressourcen und Operationen

#### Search
- **Execute** - `POST /search/jobs`
- **Get Results** - `GET /search/jobs/{searchId}/results`
- **Get Status** - `GET /search/jobs/{searchId}`

#### Saved Search
- **Create** - `POST /saved/searches`
- **Delete** - `DELETE /saved/searches/{savedSearchName}`
- **Get** - `GET /saved/searches/{savedSearchName}`
- **Get All** - `GET /saved/searches`
- **Update** - `POST /saved/searches/{savedSearchName}`

#### Index
- **Get** - `GET /data/indexes/{indexName}`
- **Get All** - `GET /data/indexes`

**Hinweis:** Splunk ist eine Data Analytics Platform. Die Base URL ist die URL der eigenen Splunk-Instanz (z.B. `https://splunk.example.com:8089/services`).

---

## 202. Workable ✅ Implementiert

**Base URL:** `https://{subdomain}.workable.com/spi/v3`
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `WORKABLE_API_KEY`
**Subdomain Secret Key:** `WORKABLE_SUBDOMAIN`

### Ressourcen und Operationen

#### Candidate
- **Create** - `POST /candidates`
- **Get** - `GET /candidates/{candidateId}`
- **Get All** - `GET /candidates`
- **Update** - `PUT /candidates/{candidateId}`

#### Job
- **Get** - `GET /jobs/{jobId}`
- **Get All** - `GET /jobs`

#### Stage
- **Get All** - `GET /jobs/{jobId}/stages`

**Hinweis:** Workable ist ein Recruiting-Tool. Die Base URL enthält das Subdomain (z.B. `https://company.workable.com/spi/v3`).

---

## 203. BambooHR ✅ Implementiert

**Base URL:** `https://api.bamboohr.com/api/gateway.php/{subdomain}/v1`
**Authentication:** API Key (Basic Auth)
**Secret Key:** `BAMBOOHR_API_KEY`
**Subdomain Secret Key:** `BAMBOOHR_SUBDOMAIN`

### Ressourcen und Operationen

#### Employee
- **Create** - `POST /employees`
- **Get** - `GET /employees/{employeeId}`
- **Get All** - `GET /employees/directory`
- **Update** - `POST /employees/{employeeId}`

#### Time Off
- **Get** - `GET /time_off/requests/{requestId}`
- **Get All** - `GET /time_off/requests`
- **Create** - `POST /time_off/requests`

#### Report
- **Get** - `GET /reports/{reportId}`

**Hinweis:** BambooHR ist ein HR-Management-System. Die Base URL enthält das Subdomain (z.B. `https://api.bamboohr.com/api/gateway.php/company/v1`).

---

## 204. Iterable ✅ Implementiert

**Base URL:** `https://api.iterable.com/api`
**Authentication:** API Key (Header: Api-Key)
**Secret Key:** `ITERABLE_API_KEY`

### Ressourcen und Operationen

#### User
- **Create** - `POST /users/update`
- **Delete** - `DELETE /users/{email}` oder `DELETE /users/byUserId/{userId}`
- **Get** - `GET /users/byEmail/{email}` oder `GET /users/byUserId/{userId}`
- **Update** - `POST /users/update`

#### Event
- **Track** - `POST /events/track`
- **Track Bulk** - `POST /events/trackBulk`

#### User List
- **Subscribe** - `POST /lists/{listId}/subscribe`
- **Unsubscribe** - `POST /lists/{listId}/unsubscribe`
- **Get** - `GET /lists/{listId}`
- **Get All** - `GET /lists`

**Hinweis:** Iterable ist eine Marketing Automation Platform für Customer Engagement.

---

## 205. Drift ✅ Implementiert

**Base URL:** `https://driftapi.com`
**Authentication:** Access Token (Header: Authorization) oder OAuth2
**Secret Key:** `DRIFT_ACCESS_TOKEN` (für Access Token)
**OAuth2 Secret Key:** `DRIFT_OAUTH2_ACCESS_TOKEN` (für OAuth2)

### Ressourcen und Operationen

#### Contact
- **Create** - `POST /contacts`
- **Delete** - `DELETE /contacts/{contactId}`
- **Get** - `GET /contacts/{contactId}`
- **Get All** - `GET /contacts`
- **Update** - `PATCH /contacts/{contactId}`

**Hinweis:** Drift ist eine Conversational Marketing Platform für Sales und Marketing.

---

## 206. Discourse ✅ Implementiert

**Base URL:** `https://{your-discourse-instance}` (dynamisch aus Credentials)
**Authentication:** API Key + Username (Header: Api-Key, Api-Username)
**Secret Key:** `DISCOURSE_API_KEY`
**Username Secret Key:** `DISCOURSE_USERNAME`
**Base URL Secret Key:** `DISCOURSE_BASE_URL`

### Ressourcen und Operationen

#### Post
- **Create** - `POST /posts.json`
- **Get** - `GET /posts/{postId}.json`
- **Get All** - `GET /posts.json`
- **Update** - `PUT /posts/{postId}.json`

#### Category
- **Create** - `POST /categories.json`
- **Get** - `GET /categories/{categoryId}.json`
- **Get All** - `GET /categories.json`
- **Update** - `PUT /categories/{categoryId}.json`

#### Group
- **Get** - `GET /groups/{groupName}.json`
- **Get All** - `GET /groups.json`

#### User
- **Get** - `GET /users/{username}.json`
- **Get All** - `GET /admin/users/list/{filter}.json`
- **Update** - `PUT /users/{username}.json`

#### User Group
- **Add** - `PUT /groups/{groupId}/members.json`
- **Remove** - `DELETE /groups/{groupId}/members.json`

**Hinweis:** Discourse ist eine Open-Source Discussion Platform. Die Base URL ist die URL der eigenen Discourse-Instanz.

---

## 207. Disqus ✅ Implementiert

**Base URL:** `https://disqus.com/api/3.0`
**Authentication:** API Key (Query Parameter: api_key)
**Secret Key:** `DISQUS_API_KEY`

### Ressourcen und Operationen

#### Forum
- **Get** - `GET /forums/details.json`
- **Get All Categories** - `GET /forums/listCategories.json`
- **Get All Threads** - `GET /forums/listThreads.json`
- **Get All Posts** - `GET /forums/listPosts.json`

**Hinweis:** Disqus ist eine Commenting Platform für Websites.

---

## 208. HighLevel ✅ Implementiert

**Base URL:** `https://rest.gohighlevel.com/v1`
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `HIGHLEVEL_API_KEY`

### Ressourcen und Operationen

#### Contact
- **Create** - `POST /contacts`
- **Delete** - `DELETE /contacts/{contactId}`
- **Get** - `GET /contacts/{contactId}`
- **Get All** - `GET /contacts`
- **Update** - `PUT /contacts/{contactId}`

#### Conversation
- **Get** - `GET /conversations/{conversationId}`
- **Get All** - `GET /conversations`
- **Create** - `POST /conversations`

#### Message
- **Create** - `POST /conversations/{conversationId}/messages`
- **Get All** - `GET /conversations/{conversationId}/messages`

#### Campaign
- **Create** - `POST /campaigns`
- **Get** - `GET /campaigns/{campaignId}`
- **Get All** - `GET /campaigns`
- **Update** - `PUT /campaigns/{campaignId}`

#### Opportunity
- **Create** - `POST /opportunities`
- **Delete** - `DELETE /opportunities/{opportunityId}`
- **Get** - `GET /opportunities/{opportunityId}`
- **Get All** - `GET /opportunities`
- **Update** - `PUT /opportunities/{opportunityId}`

#### Task
- **Create** - `POST /tasks`
- **Delete** - `DELETE /tasks/{taskId}`
- **Get** - `GET /tasks/{taskId}`
- **Get All** - `GET /tasks`
- **Update** - `PUT /tasks/{taskId}`

**Hinweis:** HighLevel ist eine All-in-One Marketing Platform für Agencies.

---

## 209. Hunter.io ✅ Implementiert

**Base URL:** `https://api.hunter.io/v2`
**Authentication:** API Key (Query Parameter: api_key)
**Secret Key:** `HUNTER_API_KEY`

### Ressourcen und Operationen

#### Domain Search
- **Search** - `GET /domain-search?domain={domain}`

#### Email Finder
- **Find** - `GET /email-finder?domain={domain}&first_name={firstName}&last_name={lastName}`

#### Email Verifier
- **Verify** - `GET /email-verifier?email={email}`

**Hinweis:** Hunter.io ist ein Email-Finder und Email-Verification Service.

---

## 210. Clearbit ✅ Implementiert

**Base URL:** `https://{api}.clearbit.com` (person.clearbit.com oder company.clearbit.com)
**Authentication:** API Key (Header: Authorization, Bearer)
**Secret Key:** `CLEARBIT_API_KEY`

### Ressourcen und Operationen

#### Company
- **Autocomplete** - `GET /v1/companies/suggest?query={query}`
- **Enrich** - `GET /v1/companies/domain={domain}`

#### Person
- **Enrich** - `GET /v1/people/email={email}`

**Hinweis:** Clearbit ist eine Data Enrichment Platform für Company und Person Data.

---

## 211. Brandfetch ✅ Implementiert

**Base URL:** `https://api.brandfetch.io/v2`
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `BRANDFETCH_API_KEY`

### Ressourcen und Operationen

#### Company
- **Get** - `GET /brands/{domain}`

#### Color
- **Get** - `GET /brands/{domain}/colors`

#### Font
- **Get** - `GET /brands/{domain}/fonts`

#### Industry
- **Get** - `GET /brands/{domain}/industry`

#### Logo
- **Get** - `GET /brands/{domain}/logo` (kann als Binary heruntergeladen werden)

**Hinweis:** Brandfetch ist eine Brand Asset API für Logos, Farben, Fonts und andere Brand-Informationen.

---

## 212. Dropcontact ✅ Implementiert

**Base URL:** `https://api.dropcontact.io`
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `DROPCONTACT_API_KEY`

### Ressourcen und Operationen

#### Contact
- **Enrich** - `POST /batch` (asynchron, Request ID wird zurückgegeben)
- **Fetch Request** - `GET /batch/{requestId}` (holt Ergebnisse einer Enrich-Request)

**Hinweis:** Dropcontact ist eine B2B Email-Finder und Contact Enrichment Platform. Die Enrich-Operation ist asynchron und gibt eine Request ID zurück, die dann mit Fetch Request abgerufen werden kann.

---

## 213. Uplead ✅ Implementiert

**Base URL:** `https://api.uplead.com/v2`
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `UPLEAD_API_KEY`

### Ressourcen und Operationen

#### Company
- **Enrich** - `GET /person-search?domain={domain}` oder `?company={company}`

#### Person
- **Enrich** - `GET /person-search?email={email}` oder `?domain={domain}&first_name={firstName}&last_name={lastName}`

**Hinweis:** Uplead ist eine B2B Data Enrichment Platform für Company und Person Data.

---

## 214. Emelia ✅ Implementiert

**Base URL:** `https://graphql.emelia.io`
**Authentication:** API Key (Header: Authorization)
**Secret Key:** `EMELIA_API_KEY`
**API Type:** GraphQL

### Ressourcen und Operationen

#### Campaign
- **Add Contact** - GraphQL Mutation: `addContactToCampaign`
- **Create** - GraphQL Mutation: `createCampaign`
- **Duplicate** - GraphQL Mutation: `duplicateCampaign`
- **Get** - GraphQL Query: `campaign`
- **Get All** - GraphQL Query: `campaigns`
- **Pause** - GraphQL Mutation: `pauseCampaign`
- **Start** - GraphQL Mutation: `startCampaign`

#### Contact List
- **Add** - GraphQL Mutation: `addContactToList`
- **Get All** - GraphQL Query: `contactLists`

**Hinweis:** Emelia ist eine Cold Email Marketing Platform. Die API verwendet GraphQL statt REST.

---

## 215. NocoDB ✅ Implementiert

**Base URL:** Dynamisch aus Credentials (eigene NocoDB-Instanz)
**Authentication:** API Token (Header: xc-token) oder User Token (Header: xc-auth)
**Secret Key:** `NOCODB_API_TOKEN` (für API Token) oder `NOCODB_USER_TOKEN` (für User Token)
**Base URL Secret Key:** `NOCODB_HOST`
**API Version:** Unterstützt v1 (Before v0.90.0), v2 (v0.90.0 Onwards), v3 (v0.200.0 Onwards)

### Ressourcen und Operationen

#### Record (Row)
- **Create** - `POST /api/v1/db/{projectId}/tables/{tableId}/records`
- **Delete** - `DELETE /api/v1/db/{projectId}/tables/{tableId}/records/{recordId}`
- **Get** - `GET /api/v1/db/{projectId}/tables/{tableId}/records/{recordId}`
- **Get All** - `GET /api/v1/db/{projectId}/tables/{tableId}/records`
- **Update** - `PATCH /api/v1/db/{projectId}/tables/{tableId}/records/{recordId}`

**Hinweis:** NocoDB ist eine Open-Source Airtable-Alternative. Die Base URL ist die URL der eigenen NocoDB-Instanz. Unterstützt mehrere API-Versionen.

---

## 216. Baserow ✅ Implementiert

**Base URL:** Dynamisch aus Credentials (eigene Baserow-Instanz oder `https://api.baserow.io`)
**Authentication:** JWT Token (Header: Authorization, JWT {token})
**Secret Key:** `BASEROW_JWT_TOKEN`
**Base URL Secret Key:** `BASEROW_HOST`

### Ressourcen und Operationen

#### Row
- **Create** - `POST /api/database/rows/table/{tableId}/`
- **Delete** - `DELETE /api/database/rows/table/{tableId}/{rowId}/`
- **Get** - `GET /api/database/rows/table/{tableId}/{rowId}/`
- **Get All** - `GET /api/database/rows/table/{tableId}/`
- **Update** - `PATCH /api/database/rows/table/{tableId}/{rowId}/`

**Hinweis:** Baserow ist eine Open-Source Airtable-Alternative. Die Base URL ist die URL der eigenen Baserow-Instanz oder die Cloud-URL.

---

## 217. SeaTable ✅ Implementiert

**Base URL:** `https://cloud.seatable.io` (Cloud) oder dynamisch aus Credentials (Self-hosted)
**Authentication:** Token (Header: Authorization, Token {token})
**Secret Key:** `SEATABLE_TOKEN`
**Base URL Secret Key:** `SEATABLE_DOMAIN` (für Self-hosted)

### Ressourcen und Operationen

#### Row
- **Create** - `POST /dtable-server/api/v1/dtables/{dtable_uuid}/rows/`
- **Delete** - `DELETE /dtable-server/api/v1/dtables/{dtable_uuid}/rows/`
- **Get All** - `GET /dtable-server/api/v1/dtables/{dtable_uuid}/rows/`
- **Update** - `PUT /dtable-server/api/v1/dtables/{dtable_uuid}/rows/`

#### Base
- **Get** - `GET /api/v2.1/dtable/{dtable_uuid}/`
- **Get All** - `GET /api/v2.1/dtables/`

#### Link
- **Create** - `POST /dtable-server/api/v1/dtables/{dtable_uuid}/links/`
- **Delete** - `DELETE /dtable-server/api/v1/dtables/{dtable_uuid}/links/`

#### Asset
- **Upload** - `POST /api/v2.1/workspace/{workspace_id}/asset/`

**Hinweis:** SeaTable ist eine Collaborative Database Platform. Unterstützt Cloud und Self-hosted Installationen.

---

## 218. Grist ✅ Implementiert

**Base URL:** `https://docs.getgrist.com/api` (Free Plan), `https://{customSubdomain}.getgrist.com/api` (Paid Plan), oder Self-hosted URL
**Authentication:** API Key (Header: Authorization, Bearer)
**Secret Key:** `GRIST_API_KEY`
**Plan Type Secret Key:** `GRIST_PLAN_TYPE` (free, paid, selfHosted)
**Custom Subdomain Secret Key:** `GRIST_CUSTOM_SUBDOMAIN` (für Paid Plan)
**Self-hosted URL Secret Key:** `GRIST_SELF_HOSTED_URL` (für Self-hosted)

### Ressourcen und Operationen

#### Record (Row)
- **Create** - `POST /docs/{docId}/tables/{tableId}/records`
- **Delete** - `POST /docs/{docId}/tables/{tableId}/data/delete`
- **Get All** - `GET /docs/{docId}/tables/{tableId}/records`
- **Update** - `PATCH /docs/{docId}/tables/{tableId}/records`

**Hinweis:** Grist ist eine Spreadsheet-Database Hybrid Platform. Unterstützt Free Plan, Paid Plan (mit Custom Subdomain) und Self-hosted Installationen.

---

## 219. Stackby ✅ Implementiert

**Base URL:** `https://stackby.com/api/betav1`
**Authentication:** API Key (Header: api-key)
**Secret Key:** `STACKBY_API_KEY`

### Ressourcen und Operationen

#### Record
- **Append** - `POST /{stackId}/{table}/append`
- **Delete** - `DELETE /{stackId}/{table}/{id}`
- **List** - `GET /{stackId}/{table}/list`
- **Read** - `GET /{stackId}/{table}/{id}`

**Hinweis:** Stackby ist eine Database und Spreadsheet Platform ähnlich wie Airtable.

---

## 220. Supabase ✅ Implementiert

**Base URL:** Dynamisch aus Credentials (eigene Supabase-Instanz, z.B. `https://{project-ref}.supabase.co`)
**Authentication:** Service Role Key (Header: apikey, Authorization)
**Secret Key:** `SUPABASE_SERVICE_ROLE_KEY`
**Base URL Secret Key:** `SUPABASE_HOST` (z.B. `https://{project-ref}.supabase.co`)

### Ressourcen und Operationen

#### Row
- **Create** - `POST /rest/v1/{tableId}`
- **Delete** - `DELETE /rest/v1/{tableId}`
- **Get** - `GET /rest/v1/{tableId}`
- **Get All** - `GET /rest/v1/{tableId}`
- **Update** - `PATCH /rest/v1/{tableId}`

**Hinweis:** Supabase ist eine Open-Source Firebase-Alternative mit PostgreSQL als Backend. Unterstützt Custom Schemas (nicht nur "public"). Die Base URL ist die URL der eigenen Supabase-Instanz.

---

## 221. CrateDB ✅ Implementiert

**Base URL:** Dynamisch aus Credentials (eigene CrateDB-Instanz)
**Authentication:** Username/Password (PostgreSQL Connection)
**Secret Key:** `CRATEDB_USERNAME`
**Password Secret Key:** `CRATEDB_PASSWORD`
**Host Secret Key:** `CRATEDB_HOST`
**Port Secret Key:** `CRATEDB_PORT` (Standard: 5432)
**Database Secret Key:** `CRATEDB_DATABASE`

### Ressourcen und Operationen

#### Query
- **Execute Query** - SQL Query Execution (PostgreSQL-kompatibel)

#### Table
- **Insert** - `INSERT INTO {schema}.{table} ...`
- **Update** - `UPDATE {schema}.{table} ...`

**Hinweis:** CrateDB ist eine Distributed SQL Database für Machine Data. Verwendet PostgreSQL-kompatible SQL-Queries. Die Base URL ist die Connection-String der eigenen CrateDB-Instanz.

---

## 222. QuestDB ✅ Implementiert

**Base URL:** Dynamisch aus Credentials (eigene QuestDB-Instanz)
**Authentication:** Username/Password (PostgreSQL Connection)
**Secret Key:** `QUESTDB_USERNAME`
**Password Secret Key:** `QUESTDB_PASSWORD`
**Host Secret Key:** `QUESTDB_HOST`
**Port Secret Key:** `QUESTDB_PORT` (Standard: 8812)
**Database Secret Key:** `QUESTDB_DATABASE`

### Ressourcen und Operationen

#### Query
- **Execute Query** - SQL Query Execution (PostgreSQL-kompatibel)

#### Table
- **Insert** - `INSERT INTO {table} ...`

**Hinweis:** QuestDB ist eine High-Performance Time-Series Database. Verwendet PostgreSQL-kompatible SQL-Queries. Die Base URL ist die Connection-String der eigenen QuestDB-Instanz.

---

## 223. TimescaleDB ✅ Implementiert

**Base URL:** Dynamisch aus Credentials (eigene TimescaleDB-Instanz)
**Authentication:** Username/Password (PostgreSQL Connection)
**Secret Key:** `TIMESCALEDB_USERNAME`
**Password Secret Key:** `TIMESCALEDB_PASSWORD`
**Host Secret Key:** `TIMESCALEDB_HOST`
**Port Secret Key:** `TIMESCALEDB_PORT` (Standard: 5432)
**Database Secret Key:** `TIMESCALEDB_DATABASE`

### Ressourcen und Operationen

#### Query
- **Execute Query** - SQL Query Execution (PostgreSQL-kompatibel)

#### Table
- **Insert** - `INSERT INTO {schema}.{table} ...`
- **Update** - `UPDATE {schema}.{table} ...`

**Hinweis:** TimescaleDB ist eine PostgreSQL-Extension für Time-Series Data. Verwendet PostgreSQL-kompatible SQL-Queries. Die Base URL ist die Connection-String der eigenen TimescaleDB-Instanz.

---

## Weitere verfügbare APIs (Kurzübersicht)

Die folgenden APIs sind verfügbar, aber noch nicht detailliert analysiert:

### Microsoft Services
- **Microsoft Teams** - Teams, Channels, Messages, Members
- **Microsoft Outlook** - Emails, Calendar, Contacts
- **Microsoft OneDrive** - Files, Folders
- **Microsoft SharePoint** - Lists, Items, Files
- **Microsoft Excel** - Workbooks, Worksheets, Tables
- **Microsoft ToDo** - Lists, Tasks, Linked Resources
- **Microsoft Entra** - Users, Groups
- **Microsoft Dynamics** - Accounts

### Communication & Messaging
- **Discord** - Channels, Messages, Members
- **Telegram** - Messages, Updates
- **WhatsApp** - Messages
- **Twilio** - SMS, Calls (bereits oben)
- **MessageBird** - SMS, Voice
- **Vonage** - SMS, Voice

### CRM & Sales
- **Copper** - People, Companies, Opportunities
- **Freshworks CRM** - Contacts, Deals, Accounts
- **Salesmate** - Contacts, Deals, Activities
- **Keap** - Contacts, Companies, Opportunities

### Project Management
- **Monday.com** - Boards, Items, Columns
- **Linear** - Issues, Projects, Teams
- **Wrike** - Folders, Tasks, Projects

### E-Commerce
- **WooCommerce** - Products, Orders, Customers
- **Magento** - Products, Orders, Customers

### Email Marketing
- **SendGrid** - Emails, Contacts, Lists
- **Mailgun** - Emails, Domains, Events
- **Postmark** - Emails, Bounces, Opens
- **Brevo (Sendinblue)** - Emails, Contacts, Campaigns

### Database & Storage
- **MongoDB** - Collections, Documents
- **PostgreSQL** - Tables, Queries
- **MySQL** - Tables, Queries
- **Supabase** - Tables, Rows, Functions (bereits oben dokumentiert)
- **Airtable** - Tables, Records (bereits oben dokumentiert)

### Cloud Services
- **AWS S3** - Buckets, Objects
- **Google Drive** - Files, Folders
- **Dropbox** - Files, Folders
- **Box** - Files, Folders

### Social Media
- **Twitter** - Tweets, Users, Lists
- **Facebook** - Posts, Pages, Events
- **LinkedIn** - Posts, Companies, Connections
- **Instagram** - Media, Users

### Payment & Finance
- **PayPal** - Payments, Orders, Subscriptions
- **QuickBooks** - Customers, Invoices, Items
- **Xero** - Contacts, Invoices, Payments
- **Wise** - Transfers, Accounts

### Analytics & Monitoring
- **Google Analytics** - Reports, Properties
- **PostHog** - Events, Insights
- **Mixpanel** - Events, Funnels
- **Segment** - Events, Users

### Development & DevOps
- **GitLab** - Projects, Issues, Merge Requests
- **Bitbucket** - Repositories, Pull Requests
- **Jenkins** - Jobs, Builds
- **CircleCI** - Pipelines, Jobs

### Forms & Surveys (10+ APIs)
- **Typeform** - Forms, Responses, Webhooks
- **JotForm** - Forms, Submissions, Webhooks
- **Formstack** - Forms, Submissions, Fields
- **FormIo** - Forms, Submissions, Resources
- **Wufoo** - Forms, Entries, Reports
- **SurveyMonkey** - Surveys, Responses, Collectors
- **KoBoToolbox** - Forms, Submissions, Data

### Calendar & Scheduling (10+ APIs)
- **Calendly** - Events, Invitees, Webhooks
- **Cal** - Bookings, Events, Schedules
- **Google Calendar** - Events, Calendars, Free/Busy
- **Outlook Calendar** - Events, Calendars (Microsoft, bereits oben)
- **AcuityScheduling** - Appointments, Calendars, Clients
- **GoToWebinar** - Webinars, Registrants, Attendees
- **Eventbrite** - Events, Attendees, Orders

### Customer Support & Helpdesk (15+ APIs)
- **Intercom** - Conversations, Users, Messages (bereits oben dokumentiert)
- **HelpScout** - Conversations, Customers, Mailboxes
- **Zendesk** - Tickets, Users, Organizations (bereits oben dokumentiert)
- **Freshdesk** - Tickets, Contacts, Companies
- **Freshservice** - Tickets, Assets, Changes
- **ServiceNow** - Incidents, Users, Tables, Workflows
- **Zammad** - Tickets, Users, Organizations
- **Gong** - Calls, Conversations, Deals

### Business & ERP (10+ APIs)
- **Zoho** - CRM, Books, Mail, Projects, Desk
- **Okta** - Users, Groups, Applications
- **Odoo** - Sales, Inventory, CRM, Accounting
- **ERPNext** - Sales Orders, Purchase Orders, Items
- **QuickBase** - Tables, Records, Reports
- **FileMaker** - Records, Scripts, Layouts

### AI & Machine Learning (10+ APIs)
- **OpenAI** - Chat, Completions, Embeddings, Images
- **MistralAI** - Chat, Completions, Embeddings
- **Perplexity** - Chat, Search, Completions
- **JinaAI** - Embeddings, Rerank, Search
- **HumanticAI** - Personality Profiles, Insights
- **DeepL** - Translation, Glossary
- **Google Translate** - Translation, Languages

### File Processing & Media (10+ APIs)
- **EditImage** - Image Manipulation, Filters
- **ReadPdf** - PDF Text Extraction, Metadata
- **Compression** - File Compression, Decompression
- **Files** - File Operations, Read/Write
- **SpreadsheetFile** - CSV, Excel, JSON Operations
- **Bannerbear** - Image Generation, Templates
- **Mindee** - Document Parsing, OCR

### Content Management & Headless CMS (10+ APIs)
- **Contentful** - Content, Entries, Assets
- **Storyblok** - Stories, Components, Assets
- **Strapi** - Content, Entries, Media
- **Ghost** - Posts, Pages, Members
- **Wordpress** - Posts, Pages, Media, Comments
- **Webflow** - Sites, Collections, Items
- **Bubble** - Data, Workflows, Backend
- **Adalo** - Data, Actions, Backend
- **Cockpit** - Collections, Assets, Forms
- **Coda** - Docs, Tables, Formulas

---

## Status

- ✅ Pipedrive - Grundstruktur vorhanden (4 Endpoints)
- ⏳ Salesforce - Noch zu implementieren
- ⏳ Slack - Noch zu implementieren
- ⏳ HubSpot - Grundstruktur vorhanden (1 Endpoint)
- ⏳ Shopify - Grundstruktur vorhanden (1 Endpoint)
- ⏳ Stripe - Grundstruktur vorhanden (2 Endpoints)
- ⏳ Google Sheets - Grundstruktur vorhanden (1 Endpoint)
- ⏳ Jira - Grundstruktur vorhanden (1 Endpoint)
- ⏳ Airtable - Noch zu implementieren
- ⏳ Notion - Noch zu implementieren
- ⏳ Zendesk - Noch zu implementieren
- ⏳ Twilio - Noch zu implementieren
- ⏳ GitHub - Noch zu implementieren
- ⏳ Trello - Noch zu implementieren
- ⏳ Asana - Noch zu implementieren
- ⏳ Mailchimp - Noch zu implementieren
- ⏳ Zoom - Noch zu implementieren
- ⏳ ClickUp - Noch zu implementieren
- ⏳ Weitere 50+ APIs - Noch zu analysieren und implementieren

---

## Vollständige API-Liste

### Bereits dokumentiert (91 APIs)
1. Pipedrive ✅
2. Salesforce ✅
3. Slack ✅
4. HubSpot ✅
5. Shopify ✅
6. Stripe ✅
7. Google Sheets ✅
8. Jira ✅
9. Airtable ✅
10. Notion ✅
11. Zendesk ✅
12. Twilio ✅
13. GitHub ✅
14. Trello ✅
15. Asana ✅
16. Mailchimp ✅
17. Zoom ✅
18. ClickUp ✅
19. Monday.com ✅
20. Intercom ✅
21. SendGrid ✅
22. Discord ✅
23. Telegram ✅
24. WooCommerce ✅
25. PayPal ✅
26. Linear ✅
27. MongoDB ✅
28. PostgreSQL ✅
29. MySQL ✅
30. Twitter (X) ✅
31. LinkedIn ✅
32. Microsoft Teams ✅
33. Microsoft Outlook ✅
34. Microsoft OneDrive ✅
35. Microsoft SharePoint ✅
36. WhatsApp ✅
37. MessageBird ✅
38. Vonage (Nexmo) ✅
39. Mattermost ✅
40. Copper ✅
41. Freshworks CRM ✅
42. ActiveCampaign ✅
43. Salesmate ✅
44. Keap (Infusionsoft) ✅
45. Mailgun ✅
46. Postmark ✅
47. Supabase ✅
48. QuickBooks Online ✅
49. Xero ✅
50. HelpScout ✅
51. ServiceNow ✅
52. Todoist ✅
53. Harvest ✅
54. Clockify ✅
55. Toggl ✅
56. Magento 2 ✅
57. Gumroad ✅
58. Paddle ✅
59. Chargebee ✅
60. Brevo (Sendinblue) ✅
61. ConvertKit ✅
62. Freshdesk ✅
63. Freshservice ✅
64. GitLab ✅
65. Bitbucket ✅
66. Typeform ✅
67. JotForm ✅
68. Calendly ✅
69. AWS S3 ✅
70. Google Drive ✅
71. Dropbox ✅
72. Box ✅
73. Google Analytics ✅
74. PostHog ✅
75. Segment ✅
76. Contentful ✅
77. Storyblok ✅
78. Strapi ✅
79. Ghost ✅
80. WordPress ✅
81. Webflow ✅
82. OpenAI ✅
83. Mistral AI ✅
84. DeepL ✅
85. Zoho CRM ✅
86. Okta ✅
87. Odoo ✅
88. Coda ✅
89. Bannerbear ✅
90. Mindee ✅
91. Baserow ✅
92. Microsoft Excel ✅
93. Microsoft ToDo ✅
94. Microsoft Entra ✅
95. Microsoft Dynamics ✅
96. Azure Cosmos DB ✅
97. Azure Storage ✅
98. Redis ✅
99. Jenkins ✅
100. Netlify ✅
101. Google Calendar ✅
102. Grafana ✅
103. Sentry.io ✅
104. Facebook Graph API ✅
105. Facebook Lead Ads ✅
106. CircleCI ✅
107. TravisCI ✅
108. UptimeRobot ✅
109. SecurityScorecard ✅
110. Wise ✅
111. Invoice Ninja ✅
112. RocketChat ✅
113. Line ✅
114. Reddit ✅
115. Medium ✅
116. Hacker News ✅
117. Metabase ✅
118. Mandrill ✅
119. Mailjet ✅
120. NextCloud ✅
121. Grist ✅
122. SeaTable ✅
123. NocoDB ✅
124. Stackby ✅
125. Taiga ✅
126. Wekan ✅
127. Kitemaker ✅
128. Orbit ✅
129. ProfitWell ✅
130. Tapfiliate ✅
131. Formstack ✅
132. Form.io ✅
133. Wufoo ✅
134. SurveyMonkey ✅
135. KoBoToolbox ✅
136. Acuity Scheduling ✅
137. GoToWebinar ✅
138. Eventbrite ✅
139. Zammad ✅
140. Gong ✅
141. ERPNext ✅
142. QuickBase ✅
143. FileMaker ✅
144. Perplexity ✅
145. Jina AI ✅
146. Humantic AI ✅
147. Rundeck ✅
148. Unleashed Software ✅
149. Sms77 (seven) ✅
150. Mocean ✅
151. CrateDB ✅
152. QuestDB ✅
153. TimescaleDB ✅
154. Spontit ✅
155. Pushbullet ✅
156. Pushover ✅
157. Gotify ✅
158. Matrix ✅
159. Cal ✅
160. Microsoft Graph Security ✅
161. Affinity ✅
162. Agile CRM ✅
163. Autopilot ✅
164. E-goi (Egoi) ✅
165. GetResponse ✅
166. Lemlist ✅
167. MailerLite ✅
168. Sendy ✅
169. Mautic ✅
170. MISP ✅
171. TheHive ✅
172. Cortex ✅
173. Elastic Security ✅
174. Cisco Webex ✅
175. One Simple API ✅
176. TheHive 5 ✅
177. Cockpit ✅
178. Adalo ✅
179. Bubble ✅
180. uProc ✅
181. Customer.io ✅
182. Google Docs ✅
183. Google Translate ✅
184. Airtop ✅
185. Flow ✅
186. Kafka ✅
187. Bitwarden ✅
188. Zulip ✅
189. Beeminder ✅
190. Onfleet ✅
191. Google Chat ✅
192. Google BigQuery ✅
193. Google G Suite Admin ✅
194. Google YouTube ✅
195. Figma ✅
196. Spotify ✅
197. Snowflake ✅
198. PagerDuty ✅
199. RabbitMQ ✅
200. Strava ✅
201. Splunk ✅
202. Workable ✅
203. BambooHR ✅
204. Iterable ✅
205. Drift ✅
206. Discourse ✅
207. Disqus ✅
208. HighLevel ✅
209. Hunter.io ✅
210. Clearbit ✅
211. Brandfetch ✅
212. Dropcontact ✅
213. Uplead ✅
214. Emelia ✅
215. NocoDB ✅
216. Baserow ✅
217. SeaTable ✅
218. Grist ✅
219. Stackby ✅
220. Supabase ✅
221. CrateDB ✅
222. QuestDB ✅
223. TimescaleDB ✅

### Weitere verfügbare APIs (ca. 150+ APIs)

**Hinweis:** Die folgenden APIs sind verfügbar, aber noch nicht detailliert dokumentiert. Sie können schrittweise hinzugefügt werden, wenn sie benötigt werden.

#### Microsoft Services (8 APIs)
- **Microsoft Teams** - Teams, Channels, Messages, Members, Webhooks
- **Microsoft Outlook** - Emails, Calendar, Contacts, Attachments
- **Microsoft OneDrive** - Files, Folders, Sharing
- **Microsoft SharePoint** - Lists, Items, Files, Sites
- **Microsoft Excel** - Workbooks, Worksheets, Tables, Rows
- **Microsoft ToDo** - Lists, Tasks, Linked Resources
- **Microsoft Entra** - Users, Groups, Directory
- **Microsoft Dynamics** - Accounts, Contacts, Opportunities
- **Azure Cosmos DB** - Containers, Items, Queries
- **Azure Storage** - Blobs, Containers, Files
- **Microsoft Graph Security** - Secure Scores, Alerts

#### Communication & Messaging (10+ APIs)
- **WhatsApp** - Messages, Media, Contacts
- **MessageBird** - SMS, Voice, Conversations
- **Vonage** (Nexmo) - SMS, Voice, Verify
- **Mattermost** - Channels, Messages, Users
- **Rocketchat** - Channels, Messages, Users
- **Line** - Messages, Webhooks
- **Matrix** - Rooms, Messages, Events
- **Spontit** - Notifications
- **Pushbullet** - Pushes, Devices
- **Pushover** - Messages, Users
- **Gotify** - Messages, Applications

#### CRM & Sales (20+ APIs)
- **Copper** - People, Companies, Opportunities, Activities
- **Freshworks CRM** - Contacts, Deals, Accounts, Activities
- **Salesmate** - Contacts, Deals, Activities, Pipelines
- **Keap** (Infusionsoft) - Contacts, Companies, Opportunities, Orders
- **ActiveCampaign** - Contacts, Lists, Automations, Deals
- **AgileCrm** - Contacts, Companies, Deals, Tasks
- **Autopilot** - Contacts, Lists, Journeys
- **Brevo** (Sendinblue) - Contacts, Lists, Campaigns, SMS
- **ConvertKit** - Subscribers, Forms, Sequences
- **Egoi** - Contacts, Lists, Campaigns
- **GetResponse** - Contacts, Lists, Campaigns
- **Lemlist** - Campaigns, Contacts, Sequences
- **MailerLite** - Subscribers, Groups, Campaigns
- **Sendy** - Lists, Campaigns, Subscribers
- **Affinity** - Organizations, People, Lists
- **AgileCrm** - Contacts, Companies, Deals
- **Autopilot** - Contacts, Lists, Journeys
- **Copper** - People, Companies, Opportunities
- **Freshdesk** - Tickets, Contacts, Companies
- **Freshservice** - Tickets, Assets, Changes

#### Project Management (10+ APIs)
- **Linear** - Issues, Projects, Teams (bereits oben dokumentiert)
- **Wrike** - Folders, Tasks, Projects, Timelogs
- **Taiga** - Projects, Issues, User Stories, Tasks
- **Wekan** - Boards, Lists, Cards
- **Todoist** - Tasks, Projects, Labels, Comments
- **Toggl** - Time Entries, Projects, Workspaces
- **Harvest** - Time Entries, Projects, Clients
- **Clockify** - Time Entries, Projects, Workspaces
- **Kitemaker** - Items, Workspaces, Teams

#### E-Commerce (10+ APIs)
- **WooCommerce** - Products, Orders, Customers (bereits oben dokumentiert)
- **Magento** - Products, Orders, Customers, Categories
- **Gumroad** - Products, Sales, Customers
- **Paddle** - Products, Transactions, Subscriptions
- **Chargebee** - Subscriptions, Customers, Invoices
- **UnleashedSoftware** - Products, Sales Orders, Purchase Orders

#### Email Marketing
- Mailgun, Postmark, Mandrill, Mailjet, Sms77, Mocean, MessageBird

#### Database & Storage (20+ APIs)
- **MongoDB** - Collections, Documents (bereits oben dokumentiert)
- **PostgreSQL** - Tables, Queries (bereits oben dokumentiert)
- **MySQL** - Tables, Queries (bereits oben dokumentiert)
- **Supabase** - Tables, Rows, Functions, Storage
- **CrateDB** - Tables, Queries (bereits oben dokumentiert)
- **QuestDB** - Tables, Queries (bereits oben dokumentiert)
- **TimescaleDB** - Tables, Queries, Hypertables (bereits oben dokumentiert)
- **Redis** - Keys, Lists, Sets, Hashes
- **AWS S3** - Buckets, Objects, Multipart Uploads
- **Google Drive** - Files, Folders, Sharing, Permissions
- **Dropbox** - Files, Folders, Sharing
- **Box** - Files, Folders, Comments, Collaborations
- **NextCloud** - Files, Folders, Sharing
- **OneDrive** - Files, Folders (Microsoft, bereits oben)
- **Airtable** - Tables, Records (bereits oben dokumentiert)
- **Baserow** - Tables, Rows, Views (bereits oben dokumentiert)
- **Grist** - Tables, Records, Views (bereits oben dokumentiert)
- **SeaTable** - Tables, Records, Views (bereits oben dokumentiert)
- **NocoDB** - Tables, Records, Views (bereits oben dokumentiert)
- **Stackby** - Tables, Records, Views (bereits oben dokumentiert)

#### Social Media (10+ APIs)
- **Twitter (X)** - Tweets, Users, Lists (bereits oben dokumentiert)
- **Facebook** - Posts, Pages, Events, Ads
- **Facebook Lead Ads** - Lead Ads, Forms, Leads
- **LinkedIn** - Posts, Companies, Connections (bereits oben dokumentiert)
- **Instagram** - Media, Users, Stories, Insights
- **Reddit** - Posts, Comments, Subreddits
- **Medium** - Posts, Publications, Users
- **HackerNews** - Stories, Comments, Users
- **Orbit** - Activities, Members, Workspaces

#### Payment & Finance (15+ APIs)
- **PayPal** - Payouts, Payments (bereits oben dokumentiert)
- **QuickBooks** - Customers, Invoices, Items, Payments
- **Xero** - Contacts, Invoices, Payments, Bank Transactions
- **Wise** (TransferWise) - Transfers, Accounts, Rates
- **ProfitWell** - Metrics, Subscriptions, Revenue
- **Tapfiliate** - Affiliates, Programs, Conversions
- **Stripe** - Payments, Customers, Subscriptions (bereits oben dokumentiert)
- **Paddle** - Products, Transactions, Subscriptions
- **Chargebee** - Subscriptions, Customers, Invoices
- **InvoiceNinja** - Invoices, Clients, Payments
- **Gumroad** - Products, Sales, Customers
- **Square** - Payments, Orders, Customers
- **Squareup** - Payments, Orders, Customers

#### Analytics & Monitoring (15+ APIs)
- **Google Analytics** - Reports, Properties, Events
- **PostHog** - Events, Insights, Feature Flags
- **Mixpanel** - Events, Funnels, Cohorts
- **Segment** - Events, Users, Destinations
- **Metabase** - Queries, Dashboards, Cards
- **Grafana** - Dashboards, Alerts, Data Sources
- **UptimeRobot** - Monitors, Alerts, Status Pages
- **SentryIo** - Issues, Events, Projects
- **SecurityScorecard** - Scores, Findings, Companies
- **Postmark** - Bounces, Opens, Deliveries (bereits oben)
- **Mailgun** - Events, Stats (bereits oben)

#### Development & DevOps (20+ APIs)
- **GitLab** - Projects, Issues, Merge Requests, Pipelines
- **Bitbucket** - Repositories, Pull Requests, Commits
- **Jenkins** - Jobs, Builds, Nodes
- **CircleCI** - Pipelines, Jobs, Workflows
- **TravisCI** - Builds, Jobs, Repositories
- **GitHub** - Repositories, Issues, Pull Requests (bereits oben dokumentiert)
- **Git** - Local Git Operations
- **Npm** - Packages, Search
- **Docker** - Containers, Images, Volumes
- **Kubernetes** - Pods, Services, Deployments
- **Rundeck** - Jobs, Executions, Projects
- **Netlify** - Sites, Deploys, Functions
- **Vercel** - Deployments, Projects, Domains


---

## Priorisierungsvorschlag für Implementierung

### Phase 1: Top 10 APIs (Höchste Priorität)
1. **Pipedrive** - CRM (bereits begonnen)
2. **Salesforce** - CRM
3. **Slack** - Communication
4. **HubSpot** - Marketing & CRM (bereits begonnen)
5. **Stripe** - Payment (bereits begonnen)
6. **Google Sheets** - Data Management (bereits begonnen)
7. **Jira** - Project Management (bereits begonnen)
8. **GitHub** - Development
9. **Zendesk** - Customer Support
10. **Mailchimp** - Email Marketing

### Phase 2: Weitere wichtige APIs (Mittlere Priorität)
11. **Airtable** - Database
12. **Notion** - Documentation & Notes
13. **Trello** - Project Management
14. **Asana** - Project Management
15. **ClickUp** - Project Management
16. **Monday.com** - Project Management
17. **Twilio** - SMS & Voice
18. **SendGrid** - Email
19. **Intercom** - Customer Support
20. **Zoom** - Video Conferencing

### Phase 3: Spezialisierte APIs (Niedrigere Priorität)
- Discord, Telegram, WhatsApp
- Shopify, WooCommerce, Magento
- Microsoft Services (Teams, Outlook, etc.)
- Weitere Payment APIs (PayPal, etc.)
- Weitere CRM APIs
- Analytics & Monitoring APIs

---

## Nächste Schritte

1. **Für jede API in Phase 1:**
   - Analysiere die API-Dokumentation für vollständige Endpoint-Details
   - Erstelle vollständige `endpoints` Array in `registry.json`
   - Definiere `bodySchema` für alle POST/PUT/PATCH Requests
   - Teste jeden Endpoint

2. **Systematische Implementierung:**
   - Beginne mit den wichtigsten Endpoints pro API (Create, Get, Get All, Update)
   - Erweitere schrittweise um weitere Operationen (Delete, Search, etc.)
   - Dokumentiere alle Implementierungen

3. **Qualitätssicherung:**
   - Validiere Request/Response Strukturen
   - Teste Authentifizierung
   - Prüfe Error-Handling

---

## Zusammenfassung

### Vollständig dokumentierte APIs: **223 APIs**

Diese APIs haben vollständige Dokumentation mit Base URLs, Authentifizierungsmethoden, Ressourcen und Operationen:

1. Pipedrive, 2. Salesforce, 3. Slack, 4. HubSpot, 5. Shopify, 6. Stripe, 7. Google Sheets, 8. Jira, 9. Airtable, 10. Notion, 11. Zendesk, 12. Twilio, 13. GitHub, 14. Trello, 15. Asana, 16. Mailchimp, 17. Zoom, 18. ClickUp, 19. Monday.com, 20. Intercom, 21. SendGrid, 22. Discord, 23. Telegram, 24. WooCommerce, 25. PayPal, 26. Linear, 27. MongoDB, 28. PostgreSQL, 29. MySQL, 30. Twitter (X), 31. LinkedIn, 32. Microsoft Teams, 33. Microsoft Outlook, 34. Microsoft OneDrive, 35. Microsoft SharePoint, 36. WhatsApp, 37. MessageBird, 38. Vonage (Nexmo), 39. Mattermost, 40. Copper, 41. Freshworks CRM, 42. ActiveCampaign, 43. Salesmate, 44. Keap (Infusionsoft), 45. Mailgun, 46. Postmark, 47. Supabase, 48. QuickBooks Online, 49. Xero, 50. HelpScout, 51. ServiceNow, 52. Todoist, 53. Harvest, 54. Clockify, 55. Toggl, 56. Magento 2, 57. Gumroad, 58. Paddle, 59. Chargebee, 60. Brevo (Sendinblue), 61. ConvertKit, 62. Freshdesk, 63. Freshservice, 64. GitLab, 65. Bitbucket, 66. Typeform, 67. JotForm, 68. Calendly, 69. AWS S3, 70. Google Drive, 71. Dropbox, 72. Box, 73. Google Analytics, 74. PostHog, 75. Segment, 76. Contentful, 77. Storyblok, 78. Strapi, 79. Ghost, 80. WordPress, 81. Webflow, 82. OpenAI, 83. Mistral AI, 84. DeepL, 85. Zoho CRM, 86. Okta, 87. Odoo, 88. Coda, 89. Bannerbear, 90. Mindee, 91. Baserow, 92. Microsoft Excel, 93. Microsoft ToDo, 94. Microsoft Entra, 95. Microsoft Dynamics, 96. Azure Cosmos DB, 97. Azure Storage, 98. Redis, 99. Jenkins, 100. Netlify, 101. Google Calendar, 102. Grafana, 103. Sentry.io, 104. Facebook Graph API, 105. Facebook Lead Ads, 106. CircleCI, 107. TravisCI, 108. UptimeRobot, 109. SecurityScorecard, 110. Wise, 111. Invoice Ninja, 112. RocketChat, 113. Line, 114. Reddit, 115. Medium, 116. Hacker News, 117. Metabase, 118. Mandrill, 119. Mailjet, 120. NextCloud, 121. Grist, 122. SeaTable, 123. NocoDB, 124. Stackby, 125. Taiga, 126. Wekan, 127. Kitemaker, 128. Orbit, 129. ProfitWell, 130. Tapfiliate, 131. Formstack, 132. Form.io, 133. Wufoo, 134. SurveyMonkey, 135. KoBoToolbox, 136. Acuity Scheduling, 137. GoToWebinar, 138. Eventbrite, 139. Zammad, 140. Gong, 141. ERPNext, 142. QuickBase, 143. FileMaker, 144. Perplexity, 145. Jina AI, 146. Humantic AI, 147. Rundeck, 148. Unleashed Software, 149. Sms77 (seven), 150. Mocean, 151. CrateDB, 152. QuestDB, 153. TimescaleDB, 154. Spontit, 155. Pushbullet, 156. Pushover, 157. Gotify, 158. Matrix, 159. Cal, 160. Microsoft Graph Security, 161. Affinity, 162. Agile CRM, 163. Autopilot, 164. E-goi (Egoi), 165. GetResponse, 166. Lemlist, 167. MailerLite, 168. Sendy, 169. Mautic, 170. MISP, 171. TheHive, 172. Cortex, 173. Elastic Security, 174. Cisco Webex, 175. One Simple API, 176. TheHive 5, 177. Cockpit, 178. Adalo, 179. Bubble, 180. uProc, 181. Customer.io, 182. Google Docs, 183. Google Translate, 184. Airtop, 185. Flow, 186. Kafka, 187. Bitwarden, 188. Zulip, 189. Beeminder, 190. Onfleet, 191. Google Chat, 192. Google BigQuery, 193. Google G Suite Admin, 194. Google YouTube, 195. Figma, 196. Spotify, 197. Snowflake, 198. PagerDuty, 199. RabbitMQ, 200. Strava, 201. Splunk, 202. Workable, 203. BambooHR, 204. Iterable, 205. Drift, 206. Discourse, 207. Disqus, 208. HighLevel, 209. Hunter.io, 210. Clearbit, 211. Brandfetch, 212. Dropcontact, 213. Uplead, 214. Emelia, 215. NocoDB, 216. Baserow, 217. SeaTable, 218. Grist, 219. Stackby, 220. Supabase, 221. CrateDB, 222. QuestDB, 223. TimescaleDB

### Kategorisierte API-Übersicht: **150+ APIs**

Die Dokumentation enthält eine vollständige Kategorisierung aller verfügbaren APIs:

- **Microsoft Services:** 11 APIs
- **Communication & Messaging:** 10+ APIs
- **CRM & Sales:** 20+ APIs
- **Project Management:** 10+ APIs
- **E-Commerce:** 10+ APIs
- **Email Marketing:** 15+ APIs
- **Database & Storage:** 20+ APIs
- **Social Media:** 10+ APIs
- **Payment & Finance:** 15+ APIs
- **Analytics & Monitoring:** 15+ APIs
- **Development & DevOps:** 20+ APIs
- **Forms & Surveys:** 10+ APIs
- **Calendar & Scheduling:** 10+ APIs
- **Customer Support & Helpdesk:** 15+ APIs
- **Business & ERP:** 10+ APIs
- **AI & Machine Learning:** 10+ APIs
- **File Processing & Media:** 10+ APIs
- **Content Management & Headless CMS:** 10+ APIs

### Gesamt: **223 APIs** vollständig dokumentiert

Diese Dokumentation dient als vollständige Referenz für die Implementierung von API-Integrationen in `shared/registry.json`. Jede API kann schrittweise hinzugefügt werden, wenn sie benötigt wird.

