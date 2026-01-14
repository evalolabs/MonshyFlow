# API Integrations - Authentication Categories

Diese Datei kategorisiert alle API-Integrationen nach ihrem Authentication-Typ, um zu wissen, welche API welche Art von Authentication benötigt.

## Authentication-Typen

### 1. Header Authentication (Standard)
**Beschreibung:** Token wird im HTTP-Header gesendet (meist `Authorization: Bearer {token}`)

**Beispiele:**
- Slack - `Authorization: Bearer {token}`
- Bubble - `Authorization: Bearer {token}`
- MailerLite - `Authorization: Bearer {token}`
- TheHive5 - `Authorization: Bearer {token}`

**Konfiguration:**
```json
{
  "authentication": {
    "type": "apiKey" | "bearer",
    "headerName": "Authorization",
    "headerFormat": "Bearer {apiKey}",
    "secretKey": "API_KEY_NAME"
  }
}
```

**Status:** ✅ Vollständig implementiert

---

### 2. Query Parameter Authentication
**Beschreibung:** Token wird als Query-Parameter in der URL gesendet (z.B. `?api_token=...`)

**Beispiele:**
- Pipedrive - `?api_token={token}`
- Hunter.io - `?api_key={token}`

**Konfiguration:**
```json
{
  "authentication": {
    "type": "apiKey",
    "location": "query",
    "parameterName": "api_token",
    "secretKey": "API_KEY_NAME"
  }
}
```

**Status:** ✅ Vollständig implementiert

---

### 3. URL Placeholder Authentication
**Beschreibung:** Token wird direkt im URL-Pfad verwendet (z.B. `/bot{token}/`)

**Beispiele:**
- Telegram - `https://api.telegram.org/bot{token}/getUpdates`

**Konfiguration:**
```json
{
  "authentication": {
    "type": "apiKey",
    "secretKey": "API_KEY_NAME",
    "urlPlaceholder": "{token}"
  },
  "baseUrl": "https://api.example.com/bot{token}"
}
```

**Status:** ✅ Vollständig implementiert

**Hinweis:** Aktuell nur Telegram verwendet diese Methode. Andere APIs, die Token im URL-Pfad benötigen, können diese Konfiguration nutzen.

---

### 4. Basic Authentication
**Beschreibung:** HTTP Basic Authentication (Base64-encoded `username:password`)

**Beispiele:**
- Customer.io - `Authorization: Basic {base64(email:apiToken)}`

**Konfiguration:**
```json
{
  "authentication": {
    "type": "basic",
    "headerName": "Authorization",
    "headerFormat": "Basic {apiKey}",
    "secretKey": "API_KEY_NAME"
  }
}
```

**Status:** ✅ Vollständig implementiert

---

### 5. OAuth2 Authentication
**Beschreibung:** OAuth2 Flow mit Access Token

**Beispiele:**
- (Noch nicht implementiert, aber vorbereitet)

**Konfiguration:**
```json
{
  "authentication": {
    "type": "oauth2",
    "secretKey": "OAUTH2_ACCESS_TOKEN"
  }
}
```

**Status:** ⚠️ Vorbereitet, aber noch nicht vollständig implementiert

---

### 6. AWS Signature Authentication
**Beschreibung:** AWS Signature Version 4 für AWS Services

**Beispiele:**
- AWS S3
- AWS Lambda

**Konfiguration:**
```json
{
  "authentication": {
    "type": "aws",
    "secretKey": "AWS_SECRET_ACCESS_KEY",
    "accessKeyIdSecretKey": "AWS_ACCESS_KEY_ID",
    "regionSecretKey": "AWS_REGION"
  }
}
```

**Status:** ✅ Vollständig implementiert

---

### 7. Multi-Secret Authentication
**Beschreibung:** APIs, die mehrere Secrets benötigen (z.B. API Key + User Key)

**Beispiele:**
- Pushover - benötigt `api_token` und `user` als Query-Parameter

**Konfiguration:**
```json
{
  "authentication": {
    "type": "apiKey",
    "location": "query",
    "parameterName": "token",
    "secretKey": "PUSHOVER_API_TOKEN",
    "usernameSecretKey": "PUSHOVER_USER_KEY",
    "userParamName": "user"
  }
}
```

**Status:** ✅ Vollständig implementiert

---


# API Integrations - Complete Categorization

**Generated:** 2025-12-26T16:36:51.283Z

**Total APIs:** 212

---

## Header Authentication (Bearer Token)

**Count:** 87

| API Name | ID | Details |
|----------|----|---------|
| Adalo | `adalo` | Header: Authorization (Bearer) |
| Airtable | `airtable` | Header: Authorization (Bearer) |
| Airtop | `airtop` | Header: Authorization (Bearer) |
| Asana | `asana` | Header: Authorization (Bearer) |
| Azure Storage | `azure-storage` | Header: Authorization (Bearer) |
| Bannerbear | `bannerbear` | Header: Authorization (Bearer) |
| Baserow | `baserow` | Header: Authorization (Bearer) |
| Brandfetch | `brandfetch` | Header: Authorization (Bearer) |
| Bubble | `bubble` | Header: Authorization (Bearer) |
| Cal | `cal` | Header: Authorization (Bearer) |
| Calendly | `calendly` | Header: Authorization (Bearer) |
| Cisco Webex | `cisco-webex` | Header: Authorization (Bearer) |
| Clearbit | `clearbit` | Header: Authorization (Bearer) |
| Coda | `coda` | Header: Authorization (Bearer) |
| Cortex | `cortex` | Header: Authorization (Bearer) |
| Drift | `drift` | Header: Authorization (Bearer) |
| Dropbox | `dropbox` | Header: Authorization (Bearer) |
| Eventbrite | `eventbrite` | Header: Authorization (Bearer) |
| Facebook Graph API | `facebook-graph` | Header: Authorization (Bearer) |
| Facebook Lead Ads | `facebook-lead-ads` | Header: Authorization (Bearer) |
| FileMaker | `filemaker` | Header: Authorization (Bearer) |
| Form.io | `formio` | Header: x-jwt-token (Bearer) |
| Formstack | `formstack` | Header: Authorization (Bearer) |
| GitHub | `github` | Header: Authorization (Bearer) |
| GitLab | `gitlab` | Header: Authorization (Bearer) |
| Gong | `gong` | Header: Authorization (Bearer) |
| Google BigQuery | `google-bigquery` | Header: Authorization (Bearer) |
| Google Calendar | `google-calendar` | Header: Authorization (Bearer) |
| Google Chat | `google-chat` | Header: Authorization (Bearer) |
| Google Docs | `google-docs` | Header: Authorization (Bearer) |
| Google G Suite Admin | `google-gsuite-admin` | Header: Authorization (Bearer) |
| Google Translate | `google-translate` | Header: Authorization (Bearer) |
| Google YouTube | `google-youtube` | Header: Authorization (Bearer) |
| GoToWebinar | `gotowebinar` | Header: Authorization (Bearer) |
| Grafana | `grafana` | Header: Authorization (Bearer) |
| Grist | `grist` | Header: Authorization (Bearer) |
| Harvest | `harvest` | Header: Authorization (Bearer) |
| HighLevel | `highlevel` | Header: Authorization (Bearer) |
| HubSpot | `hubspot` | Header: Authorization (Bearer) |
| Intercom | `intercom` | Header: Authorization (Bearer) |
| Kitemaker | `kitemaker` | Header: Authorization (Bearer) |
| KoBoToolbox | `kobotoolbox` | Header: Authorization (Bearer) |
| Line (LINE Notify) | `line-notify` | Header: Authorization (Bearer) |
| Linear | `linear` | Header: Authorization (Bearer) |
| Magento 2 | `magento2` | Header: Authorization (Bearer) |
| Mailchimp | `mailchimp` | Header: Authorization (Bearer) |
| MailerLite | `mailerlite` | Header: Authorization (Bearer) |
| Matrix | `matrix` | Header: Authorization (Bearer) |
| Mattermost | `mattermost` | Header: Authorization (Bearer) |
| Mautic | `mautic` | Header: Authorization (Bearer) |
| Medium | `medium` | Header: Authorization (Bearer) |
| Microsoft Dynamics CRM | `microsoft-dynamics-crm` | Header: Authorization (Bearer) |
| Microsoft Entra (Azure AD) | `microsoft-entra` | Header: Authorization (Bearer) |
| Microsoft Excel | `microsoft-excel` | Header: Authorization (Bearer) |
| Microsoft Graph Security | `microsoft-graph-security` | Header: Authorization (Bearer) |
| Microsoft ToDo | `microsoft-todo` | Header: Authorization (Bearer) |
| Mistral AI | `mistral-ai` | Header: Authorization (Bearer) |
| Netlify | `netlify` | Header: Authorization (Bearer) |
| NextCloud | `nextcloud` | Header: Authorization (Bearer) |
| Notion | `notion` | Header: Authorization (Bearer) |
| Okta | `okta` | Header: Authorization (Bearer) |
| OpenAI | `openai` | Header: Authorization (Bearer) |
| Orbit | `orbit` | Header: Authorization (Bearer) |
| Perplexity | `perplexity` | Header: Authorization (Bearer) |
| Pushbullet | `pushbullet` | Header: Authorization (Bearer) |
| Reddit | `reddit` | Header: Authorization (Bearer) |
| SecurityScorecard | `securityscorecard` | Header: Authorization (Bearer) |
| SendGrid | `sendgrid` | Header: Authorization (Bearer) |
| Sentry.io | `sentry` | Header: Authorization (Bearer) |
| Slack | `slack` | Header: Authorization (Bearer) |
| Spotify | `spotify` | Header: Authorization (Bearer) |
| Strava | `strava` | Header: Authorization (Bearer) |
| Stripe | `stripe` | Header: Authorization (Bearer) |
| Supabase | `supabase` | Header: Authorization (Bearer) |
| SurveyMonkey | `surveymonkey` | Header: Authorization (Bearer) |
| TheHive | `thehive` | Header: Authorization (Bearer) |
| TheHive 5 (TheHiveProject) | `thehive5` | Header: Authorization (Bearer) |
| Todoist | `todoist` | Header: Authorization (Bearer) |
| Typeform | `typeform` | Header: Authorization (Bearer) |
| Vonage (Nexmo) | `vonage` | Header: Authorization (Bearer) |
| Webflow | `webflow` | Header: Authorization (Bearer) |
| WhatsApp | `whatsapp` | Header: Authorization (Bearer) |
| Wise (TransferWise) | `wise` | Header: Authorization (Bearer) |
| Workable | `workable` | Header: Authorization (Bearer) |
| Zammad | `zammad` | Header: Authorization (Bearer) |
| Zoho CRM | `zoho-crm` | Header: Authorization (Bearer) |
| Zoom | `zoom` | Header: Authorization (Bearer) |

## Header Authentication (Standard)

**Count:** 45

| API Name | ID | Details |
|----------|----|---------|
| ActiveCampaign | `activecampaign` | Header: Api-Token ({apiKey}) |
| Autopilot | `autopilot` | Header: autopilotapikey (standard) |
| Azure Cosmos DB | `azure-cosmos-db` | Header: Authorization ({signature}) |
| Brevo (Sendinblue) | `brevo` | Header: api-key ({apiKey}) |
| CircleCI | `circleci` | Header: Circle-Token ({apiKey}) |
| ClickUp | `clickup` | Header: Authorization ({apiKey}) |
| Clockify | `clockify` | Header: X-Api-Key ({apiKey}) |
| DeepL | `deepl` | Header: Authorization (DeepL-Auth-Key {apiKey}) |
| Discord | `discord` | Header: Authorization (Bot {apiKey}) |
| Discourse | `discourse` | Header: Api-Key ({apiKey}) |
| Dropcontact | `dropcontact` | Header: Authorization ({apiKey}) |
| E-goi (Egoi) | `egoi` | Header: Apikey (standard) |
| Emelia | `emelia` | Header: Authorization ({apiKey}) |
| Figma | `figma` | Header: X-Figma-Token ({apiKey}) |
| Freshworks CRM | `freshworks-crm` | Header: Authorization (Token token={apiKey}) |
| GetResponse | `getresponse` | Header: X-Auth-Token (api-key {apiKey}) |
| Gotify | `gotify` | Header: X-Gotify-Key (standard) |
| Hacker News | `hacker-news` | API Key (assumed header: unknown) |
| Invoice Ninja | `invoice-ninja` | Header: X-API-TOKEN ({apiKey}) |
| Iterable | `iterable` | Header: Api-Key ({apiKey}) |
| Jina AI | `jina-ai` | Header: X-API-Key (standard) |
| JotForm | `jotform` | Header: APIKEY ({apiKey}) |
| Mandrill | `mandrill` | API Key (assumed header: MANDRILL_API_KEY) |
| MessageBird | `messagebird` | Header: Authorization (AccessKey {apiKey}) |
| MISP | `misp` | Header: Authorization ({apiKey}) |
| Monday.com | `monday` | Header: Authorization ({apiKey}) |
| MongoDB | `mongodb` | Header: api-key ({apiKey}) |
| NocoDB | `nocodb` | Header: xc-token ({apiKey}) |
| PagerDuty | `pagerduty` | Header: Authorization (Token token={apiKey}) |
| Postmark | `postmark` | Header: X-Postmark-Server-Token ({apiKey}) |
| ProfitWell | `profitwell` | Header: Authorization ({apiKey}) |
| QuickBase | `quickbase` | Header: QB-User-Token (standard) |
| Rundeck | `rundeck` | Header: X-Rundeck-Auth-Token (standard) |
| SeaTable | `seatable` | Header: Authorization (Token {token}) |
| Sendy | `sendy` | API Key (assumed header: SENDY_API_KEY) |
| Shopify | `shopify` | Header: X-Shopify-Access-Token ({apiKey}) |
| Sms77 (seven) | `sms77` | Header: SentWith (standard) |
| Stackby | `stackby` | Header: api-key ({apiKey}) |
| Tapfiliate | `tapfiliate` | Header: Api-Key ({apiKey}) |
| TravisCI | `travisci` | Header: Authorization (token {apiKey}) |
| Trello | `trello` | Header: Authorization (OAuth {apiKey}) |
| Unleashed Software | `unleashed-software` | Header: api-auth-id (standard) |
| Uplead | `uplead` | Header: Authorization ({apiKey}) |
| uProc | `uproc` | Header: Authorization ({apiKey}) |
| UptimeRobot | `uptimerobot` | Header: Content-Type (application/x-www-form-urlencoded) |

## Header Authentication (Basic)

**Count:** 41

| API Name | ID | Details |
|----------|----|---------|
| Acuity Scheduling | `acuity-scheduling` | HTTP Basic Authentication |
| Affinity | `affinity` | HTTP Basic Authentication |
| Agile CRM | `agile-crm` | HTTP Basic Authentication |
| BambooHR | `bamboohr` | HTTP Basic Authentication |
| Bitbucket | `bitbucket` | HTTP Basic Authentication |
| Chargebee | `chargebee` | HTTP Basic Authentication |
| CrateDB | `cratedb` | HTTP Basic Authentication |
| Customer.io | `customerio` | HTTP Basic Authentication |
| Elastic Security | `elastic-security` | HTTP Basic Authentication |
| ERPNext | `erpnext` | HTTP Basic Authentication |
| Flow | `flow` | HTTP Basic Authentication |
| Freshdesk | `freshdesk` | HTTP Basic Authentication |
| Freshservice | `freshservice` | HTTP Basic Authentication |
| Jenkins | `jenkins` | HTTP Basic Authentication |
| Jira | `jira` | HTTP Basic Authentication |
| Lemlist | `lemlist` | HTTP Basic Authentication |
| Mailgun | `mailgun` | HTTP Basic Authentication |
| Mailjet | `mailjet` | HTTP Basic Authentication |
| Metabase | `metabase` | HTTP Basic Authentication |
| Mindee | `mindee` | HTTP Basic Authentication |
| Mocean | `mocean` | HTTP Basic Authentication |
| MySQL | `mysql` | HTTP Basic Authentication |
| Odoo | `odoo` | HTTP Basic Authentication |
| Onfleet | `onfleet` | HTTP Basic Authentication |
| PostgreSQL | `postgresql` | HTTP Basic Authentication |
| QuestDB | `questdb` | HTTP Basic Authentication |
| Segment | `segment` | HTTP Basic Authentication |
| ServiceNow | `servicenow` | HTTP Basic Authentication |
| Snowflake | `snowflake` | HTTP Basic Authentication |
| Splunk | `splunk` | HTTP Basic Authentication |
| Strapi | `strapi` | HTTP Basic Authentication |
| Taiga | `taiga` | HTTP Basic Authentication |
| TimescaleDB | `timescaledb` | HTTP Basic Authentication |
| Toggl | `toggl` | HTTP Basic Authentication |
| Twilio | `twilio` | HTTP Basic Authentication |
| Wekan | `wekan` | HTTP Basic Authentication |
| WooCommerce | `woocommerce` | HTTP Basic Authentication |
| WordPress | `wordpress` | HTTP Basic Authentication |
| Wufoo | `wufoo` | HTTP Basic Authentication |
| Zendesk | `zendesk` | HTTP Basic Authentication |
| Zulip | `zulip` | HTTP Basic Authentication |

## Query Parameter Authentication

**Count:** 13

| API Name | ID | Details |
|----------|----|---------|
| Beeminder | `beeminder` | Query parameter: auth_token |
| Cockpit | `cockpit` | Query parameter: token |
| Contentful | `contentful` | Query parameter: access_token |
| ConvertKit | `convertkit` | Query parameter: api_secret |
| Disqus | `disqus` | Query parameter: api_key |
| Ghost | `ghost` | Query parameter: key |
| Gumroad | `gumroad` | Query parameter: access_token |
| Humantic AI | `humantic-ai` | Query parameter: apikey |
| Hunter.io | `hunter` | Query parameter: api_key |
| One Simple API | `one-simple-api` | Query parameter: token |
| Pipedrive | `pipedrive` | Query parameter: api_token |
| PostHog | `posthog` | Query parameter: api_key |
| Storyblok | `storyblok` | Query parameter: token |

## URL Placeholder Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| Telegram | `telegram` | Token in URL path (placeholder: {token}) |

## AWS Signature Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| AWS S3 | `aws-s3` | AWS Signature v4 |

## Multi-Secret Authentication

**Count:** 6

| API Name | ID | Details |
|----------|----|---------|
| Copper | `copper` | Header: X-PW-AccessToken (multiple secrets) |
| Paddle | `paddle` | Header: Authorization (multiple secrets) |
| Pushover | `pushover` | Query parameter: token (multi-secret) |
| RocketChat | `rocketchat` | Header: X-Auth-Token (multiple secrets) |
| Salesmate | `salesmate` | Header: sessionToken (multiple secrets) |
| Spontit | `spontit` | Header: X-Authorization (multiple secrets) |

## OAuth2 Authentication

**Count:** 17

| API Name | ID | Details |
|----------|----|---------|
| Bitwarden | `bitwarden` | OAuth2 authentication |
| Box | `box` | OAuth2 authentication |
| Google Analytics | `google-analytics` | OAuth2 authentication |
| Google Drive | `google-drive` | OAuth2 authentication |
| Google Sheets | `google-sheets` | OAuth2 authentication |
| HelpScout | `helpscout` | OAuth2 authentication |
| Keap (Infusionsoft) | `keap` | OAuth2 authentication |
| LinkedIn | `linkedin` | OAuth2 authentication |
| Microsoft OneDrive | `microsoft-onedrive` | OAuth2 authentication |
| Microsoft Outlook | `microsoft-outlook` | OAuth2 authentication |
| Microsoft SharePoint | `microsoft-sharepoint` | OAuth2 authentication |
| Microsoft Teams | `microsoft-teams` | OAuth2 authentication |
| PayPal | `paypal` | OAuth2 authentication |
| QuickBooks Online | `quickbooks-online` | OAuth2 authentication |
| Salesforce | `salesforce` | OAuth2 authentication |
| Twitter (X) | `twitter` | OAuth2 authentication |
| Xero | `xero` | OAuth2 authentication |

## Unknown/No Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| undefined | `undefined` | No authentication configured |



# API Integrations - Complete Categorization

**Generated:** 2025-12-26T16:40:16.362Z

**Total APIs:** 212

---

## Header Authentication (Bearer Token)

**Count:** 87

| API Name | ID | Details |
|----------|----|---------|
| Adalo | `adalo` | Header: Authorization (Bearer) |
| Airtable | `airtable` | Header: Authorization (Bearer) |
| Airtop | `airtop` | Header: Authorization (Bearer) |
| Asana | `asana` | Header: Authorization (Bearer) |
| Azure Storage | `azure-storage` | Header: Authorization (Bearer) |
| Bannerbear | `bannerbear` | Header: Authorization (Bearer) |
| Baserow | `baserow` | Header: Authorization (Bearer) |
| Brandfetch | `brandfetch` | Header: Authorization (Bearer) |
| Bubble | `bubble` | Header: Authorization (Bearer) |
| Cal | `cal` | Header: Authorization (Bearer) |
| Calendly | `calendly` | Header: Authorization (Bearer) |
| Cisco Webex | `cisco-webex` | Header: Authorization (Bearer) |
| Clearbit | `clearbit` | Header: Authorization (Bearer) |
| Coda | `coda` | Header: Authorization (Bearer) |
| Cortex | `cortex` | Header: Authorization (Bearer) |
| Drift | `drift` | Header: Authorization (Bearer) |
| Dropbox | `dropbox` | Header: Authorization (Bearer) |
| Eventbrite | `eventbrite` | Header: Authorization (Bearer) |
| Facebook Graph API | `facebook-graph` | Header: Authorization (Bearer) |
| Facebook Lead Ads | `facebook-lead-ads` | Header: Authorization (Bearer) |
| FileMaker | `filemaker` | Header: Authorization (Bearer) |
| Form.io | `formio` | Header: x-jwt-token (Bearer) |
| Formstack | `formstack` | Header: Authorization (Bearer) |
| GitHub | `github` | Header: Authorization (Bearer) |
| GitLab | `gitlab` | Header: Authorization (Bearer) |
| Gong | `gong` | Header: Authorization (Bearer) |
| Google BigQuery | `google-bigquery` | Header: Authorization (Bearer) |
| Google Calendar | `google-calendar` | Header: Authorization (Bearer) |
| Google Chat | `google-chat` | Header: Authorization (Bearer) |
| Google Docs | `google-docs` | Header: Authorization (Bearer) |
| Google G Suite Admin | `google-gsuite-admin` | Header: Authorization (Bearer) |
| Google Translate | `google-translate` | Header: Authorization (Bearer) |
| Google YouTube | `google-youtube` | Header: Authorization (Bearer) |
| GoToWebinar | `gotowebinar` | Header: Authorization (Bearer) |
| Grafana | `grafana` | Header: Authorization (Bearer) |
| Grist | `grist` | Header: Authorization (Bearer) |
| Harvest | `harvest` | Header: Authorization (Bearer) |
| HighLevel | `highlevel` | Header: Authorization (Bearer) |
| HubSpot | `hubspot` | Header: Authorization (Bearer) |
| Intercom | `intercom` | Header: Authorization (Bearer) |
| Kitemaker | `kitemaker` | Header: Authorization (Bearer) |
| KoBoToolbox | `kobotoolbox` | Header: Authorization (Bearer) |
| Line (LINE Notify) | `line-notify` | Header: Authorization (Bearer) |
| Linear | `linear` | Header: Authorization (Bearer) |
| Magento 2 | `magento2` | Header: Authorization (Bearer) |
| Mailchimp | `mailchimp` | Header: Authorization (Bearer) |
| MailerLite | `mailerlite` | Header: Authorization (Bearer) |
| Matrix | `matrix` | Header: Authorization (Bearer) |
| Mattermost | `mattermost` | Header: Authorization (Bearer) |
| Mautic | `mautic` | Header: Authorization (Bearer) |
| Medium | `medium` | Header: Authorization (Bearer) |
| Microsoft Dynamics CRM | `microsoft-dynamics-crm` | Header: Authorization (Bearer) |
| Microsoft Entra (Azure AD) | `microsoft-entra` | Header: Authorization (Bearer) |
| Microsoft Excel | `microsoft-excel` | Header: Authorization (Bearer) |
| Microsoft Graph Security | `microsoft-graph-security` | Header: Authorization (Bearer) |
| Microsoft ToDo | `microsoft-todo` | Header: Authorization (Bearer) |
| Mistral AI | `mistral-ai` | Header: Authorization (Bearer) |
| Netlify | `netlify` | Header: Authorization (Bearer) |
| NextCloud | `nextcloud` | Header: Authorization (Bearer) |
| Notion | `notion` | Header: Authorization (Bearer) |
| Okta | `okta` | Header: Authorization (Bearer) |
| OpenAI | `openai` | Header: Authorization (Bearer) |
| Orbit | `orbit` | Header: Authorization (Bearer) |
| Perplexity | `perplexity` | Header: Authorization (Bearer) |
| Pushbullet | `pushbullet` | Header: Authorization (Bearer) |
| Reddit | `reddit` | Header: Authorization (Bearer) |
| SecurityScorecard | `securityscorecard` | Header: Authorization (Bearer) |
| SendGrid | `sendgrid` | Header: Authorization (Bearer) |
| Sentry.io | `sentry` | Header: Authorization (Bearer) |
| Slack | `slack` | Header: Authorization (Bearer) |
| Spotify | `spotify` | Header: Authorization (Bearer) |
| Strava | `strava` | Header: Authorization (Bearer) |
| Stripe | `stripe` | Header: Authorization (Bearer) |
| Supabase | `supabase` | Header: Authorization (Bearer) |
| SurveyMonkey | `surveymonkey` | Header: Authorization (Bearer) |
| TheHive | `thehive` | Header: Authorization (Bearer) |
| TheHive 5 (TheHiveProject) | `thehive5` | Header: Authorization (Bearer) |
| Todoist | `todoist` | Header: Authorization (Bearer) |
| Typeform | `typeform` | Header: Authorization (Bearer) |
| Vonage (Nexmo) | `vonage` | Header: Authorization (Bearer) |
| Webflow | `webflow` | Header: Authorization (Bearer) |
| WhatsApp | `whatsapp` | Header: Authorization (Bearer) |
| Wise (TransferWise) | `wise` | Header: Authorization (Bearer) |
| Workable | `workable` | Header: Authorization (Bearer) |
| Zammad | `zammad` | Header: Authorization (Bearer) |
| Zoho CRM | `zoho-crm` | Header: Authorization (Bearer) |
| Zoom | `zoom` | Header: Authorization (Bearer) |

## Header Authentication (Standard)

**Count:** 45

| API Name | ID | Details |
|----------|----|---------|
| ActiveCampaign | `activecampaign` | Header: Api-Token ({apiKey}) |
| Autopilot | `autopilot` | Header: autopilotapikey (standard) |
| Azure Cosmos DB | `azure-cosmos-db` | Header: Authorization ({signature}) |
| Brevo (Sendinblue) | `brevo` | Header: api-key ({apiKey}) |
| CircleCI | `circleci` | Header: Circle-Token ({apiKey}) |
| ClickUp | `clickup` | Header: Authorization ({apiKey}) |
| Clockify | `clockify` | Header: X-Api-Key ({apiKey}) |
| DeepL | `deepl` | Header: Authorization (DeepL-Auth-Key {apiKey}) |
| Discord | `discord` | Header: Authorization (Bot {apiKey}) |
| Discourse | `discourse` | Header: Api-Key ({apiKey}) |
| Dropcontact | `dropcontact` | Header: Authorization ({apiKey}) |
| E-goi (Egoi) | `egoi` | Header: Apikey (standard) |
| Emelia | `emelia` | Header: Authorization ({apiKey}) |
| Figma | `figma` | Header: X-Figma-Token ({apiKey}) |
| Freshworks CRM | `freshworks-crm` | Header: Authorization (Token token={apiKey}) |
| GetResponse | `getresponse` | Header: X-Auth-Token (api-key {apiKey}) |
| Gotify | `gotify` | Header: X-Gotify-Key (standard) |
| Hacker News | `hacker-news` | API Key (assumed header: unknown) |
| Invoice Ninja | `invoice-ninja` | Header: X-API-TOKEN ({apiKey}) |
| Iterable | `iterable` | Header: Api-Key ({apiKey}) |
| Jina AI | `jina-ai` | Header: X-API-Key (standard) |
| JotForm | `jotform` | Header: APIKEY ({apiKey}) |
| Mandrill | `mandrill` | API Key (assumed header: MANDRILL_API_KEY) |
| MessageBird | `messagebird` | Header: Authorization (AccessKey {apiKey}) |
| MISP | `misp` | Header: Authorization ({apiKey}) |
| Monday.com | `monday` | Header: Authorization ({apiKey}) |
| MongoDB | `mongodb` | Header: api-key ({apiKey}) |
| NocoDB | `nocodb` | Header: xc-token ({apiKey}) |
| PagerDuty | `pagerduty` | Header: Authorization (Token token={apiKey}) |
| Postmark | `postmark` | Header: X-Postmark-Server-Token ({apiKey}) |
| ProfitWell | `profitwell` | Header: Authorization ({apiKey}) |
| QuickBase | `quickbase` | Header: QB-User-Token (standard) |
| Rundeck | `rundeck` | Header: X-Rundeck-Auth-Token (standard) |
| SeaTable | `seatable` | Header: Authorization (Token {token}) |
| Sendy | `sendy` | API Key (assumed header: SENDY_API_KEY) |
| Shopify | `shopify` | Header: X-Shopify-Access-Token ({apiKey}) |
| Sms77 (seven) | `sms77` | Header: SentWith (standard) |
| Stackby | `stackby` | Header: api-key ({apiKey}) |
| Tapfiliate | `tapfiliate` | Header: Api-Key ({apiKey}) |
| TravisCI | `travisci` | Header: Authorization (token {apiKey}) |
| Trello | `trello` | Header: Authorization (OAuth {apiKey}) |
| Unleashed Software | `unleashed-software` | Header: api-auth-id (standard) |
| Uplead | `uplead` | Header: Authorization ({apiKey}) |
| uProc | `uproc` | Header: Authorization ({apiKey}) |
| UptimeRobot | `uptimerobot` | Header: Content-Type (application/x-www-form-urlencoded) |

## Header Authentication (Basic)

**Count:** 41

| API Name | ID | Details |
|----------|----|---------|
| Acuity Scheduling | `acuity-scheduling` | HTTP Basic Authentication |
| Affinity | `affinity` | HTTP Basic Authentication |
| Agile CRM | `agile-crm` | HTTP Basic Authentication |
| BambooHR | `bamboohr` | HTTP Basic Authentication |
| Bitbucket | `bitbucket` | HTTP Basic Authentication |
| Chargebee | `chargebee` | HTTP Basic Authentication |
| CrateDB | `cratedb` | HTTP Basic Authentication |
| Customer.io | `customerio` | HTTP Basic Authentication |
| Elastic Security | `elastic-security` | HTTP Basic Authentication |
| ERPNext | `erpnext` | HTTP Basic Authentication |
| Flow | `flow` | HTTP Basic Authentication |
| Freshdesk | `freshdesk` | HTTP Basic Authentication |
| Freshservice | `freshservice` | HTTP Basic Authentication |
| Jenkins | `jenkins` | HTTP Basic Authentication |
| Jira | `jira` | HTTP Basic Authentication |
| Lemlist | `lemlist` | HTTP Basic Authentication |
| Mailgun | `mailgun` | HTTP Basic Authentication |
| Mailjet | `mailjet` | HTTP Basic Authentication |
| Metabase | `metabase` | HTTP Basic Authentication |
| Mindee | `mindee` | HTTP Basic Authentication |
| Mocean | `mocean` | HTTP Basic Authentication |
| MySQL | `mysql` | HTTP Basic Authentication |
| Odoo | `odoo` | HTTP Basic Authentication |
| Onfleet | `onfleet` | HTTP Basic Authentication |
| PostgreSQL | `postgresql` | HTTP Basic Authentication |
| QuestDB | `questdb` | HTTP Basic Authentication |
| Segment | `segment` | HTTP Basic Authentication |
| ServiceNow | `servicenow` | HTTP Basic Authentication |
| Snowflake | `snowflake` | HTTP Basic Authentication |
| Splunk | `splunk` | HTTP Basic Authentication |
| Strapi | `strapi` | HTTP Basic Authentication |
| Taiga | `taiga` | HTTP Basic Authentication |
| TimescaleDB | `timescaledb` | HTTP Basic Authentication |
| Toggl | `toggl` | HTTP Basic Authentication |
| Twilio | `twilio` | HTTP Basic Authentication |
| Wekan | `wekan` | HTTP Basic Authentication |
| WooCommerce | `woocommerce` | HTTP Basic Authentication |
| WordPress | `wordpress` | HTTP Basic Authentication |
| Wufoo | `wufoo` | HTTP Basic Authentication |
| Zendesk | `zendesk` | HTTP Basic Authentication |
| Zulip | `zulip` | HTTP Basic Authentication |

## Query Parameter Authentication

**Count:** 13

| API Name | ID | Details |
|----------|----|---------|
| Beeminder | `beeminder` | Query parameter: auth_token |
| Cockpit | `cockpit` | Query parameter: token |
| Contentful | `contentful` | Query parameter: access_token |
| ConvertKit | `convertkit` | Query parameter: api_secret |
| Disqus | `disqus` | Query parameter: api_key |
| Ghost | `ghost` | Query parameter: key |
| Gumroad | `gumroad` | Query parameter: access_token |
| Humantic AI | `humantic-ai` | Query parameter: apikey |
| Hunter.io | `hunter` | Query parameter: api_key |
| One Simple API | `one-simple-api` | Query parameter: token |
| Pipedrive | `pipedrive` | Query parameter: api_token |
| PostHog | `posthog` | Query parameter: api_key |
| Storyblok | `storyblok` | Query parameter: token |

## URL Placeholder Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| Telegram | `telegram` | Token in URL path (placeholder: {token}) |

## AWS Signature Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| AWS S3 | `aws-s3` | AWS Signature v4 |

## Multi-Secret Authentication

**Count:** 6

| API Name | ID | Details |
|----------|----|---------|
| Copper | `copper` | Header: X-PW-AccessToken (multiple secrets) |
| Paddle | `paddle` | Header: Authorization (multiple secrets) |
| Pushover | `pushover` | Query parameter: token (multi-secret) |
| RocketChat | `rocketchat` | Header: X-Auth-Token (multiple secrets) |
| Salesmate | `salesmate` | Header: sessionToken (multiple secrets) |
| Spontit | `spontit` | Header: X-Authorization (multiple secrets) |

## OAuth2 Authentication

**Count:** 17

| API Name | ID | Details |
|----------|----|---------|
| Bitwarden | `bitwarden` | OAuth2 authentication |
| Box | `box` | OAuth2 authentication |
| Google Analytics | `google-analytics` | OAuth2 authentication |
| Google Drive | `google-drive` | OAuth2 authentication |
| Google Sheets | `google-sheets` | OAuth2 authentication |
| HelpScout | `helpscout` | OAuth2 authentication |
| Keap (Infusionsoft) | `keap` | OAuth2 authentication |
| LinkedIn | `linkedin` | OAuth2 authentication |
| Microsoft OneDrive | `microsoft-onedrive` | OAuth2 authentication |
| Microsoft Outlook | `microsoft-outlook` | OAuth2 authentication |
| Microsoft SharePoint | `microsoft-sharepoint` | OAuth2 authentication |
| Microsoft Teams | `microsoft-teams` | OAuth2 authentication |
| PayPal | `paypal` | OAuth2 authentication |
| QuickBooks Online | `quickbooks-online` | OAuth2 authentication |
| Salesforce | `salesforce` | OAuth2 authentication |
| Twitter (X) | `twitter` | OAuth2 authentication |
| Xero | `xero` | OAuth2 authentication |

## Unknown/No Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| undefined | `undefined` | No authentication configured |



# API Integrations - Complete Categorization

**Generated:** 2025-12-26T16:40:35.865Z

**Total APIs:** 212

---

## Header Authentication (Bearer Token)

**Count:** 87

| API Name | ID | Details |
|----------|----|---------|
| Adalo | `adalo` | Header: Authorization (Bearer) |
| Airtable | `airtable` | Header: Authorization (Bearer) |
| Airtop | `airtop` | Header: Authorization (Bearer) |
| Asana | `asana` | Header: Authorization (Bearer) |
| Azure Storage | `azure-storage` | Header: Authorization (Bearer) |
| Bannerbear | `bannerbear` | Header: Authorization (Bearer) |
| Baserow | `baserow` | Header: Authorization (Bearer) |
| Brandfetch | `brandfetch` | Header: Authorization (Bearer) |
| Bubble | `bubble` | Header: Authorization (Bearer) |
| Cal | `cal` | Header: Authorization (Bearer) |
| Calendly | `calendly` | Header: Authorization (Bearer) |
| Cisco Webex | `cisco-webex` | Header: Authorization (Bearer) |
| Clearbit | `clearbit` | Header: Authorization (Bearer) |
| Coda | `coda` | Header: Authorization (Bearer) |
| Cortex | `cortex` | Header: Authorization (Bearer) |
| Drift | `drift` | Header: Authorization (Bearer) |
| Dropbox | `dropbox` | Header: Authorization (Bearer) |
| Eventbrite | `eventbrite` | Header: Authorization (Bearer) |
| Facebook Graph API | `facebook-graph` | Header: Authorization (Bearer) |
| Facebook Lead Ads | `facebook-lead-ads` | Header: Authorization (Bearer) |
| FileMaker | `filemaker` | Header: Authorization (Bearer) |
| Form.io | `formio` | Header: x-jwt-token (Bearer) |
| Formstack | `formstack` | Header: Authorization (Bearer) |
| GitHub | `github` | Header: Authorization (Bearer) |
| GitLab | `gitlab` | Header: Authorization (Bearer) |
| Gong | `gong` | Header: Authorization (Bearer) |
| Google BigQuery | `google-bigquery` | Header: Authorization (Bearer) |
| Google Calendar | `google-calendar` | Header: Authorization (Bearer) |
| Google Chat | `google-chat` | Header: Authorization (Bearer) |
| Google Docs | `google-docs` | Header: Authorization (Bearer) |
| Google G Suite Admin | `google-gsuite-admin` | Header: Authorization (Bearer) |
| Google Translate | `google-translate` | Header: Authorization (Bearer) |
| Google YouTube | `google-youtube` | Header: Authorization (Bearer) |
| GoToWebinar | `gotowebinar` | Header: Authorization (Bearer) |
| Grafana | `grafana` | Header: Authorization (Bearer) |
| Grist | `grist` | Header: Authorization (Bearer) |
| Harvest | `harvest` | Header: Authorization (Bearer) |
| HighLevel | `highlevel` | Header: Authorization (Bearer) |
| HubSpot | `hubspot` | Header: Authorization (Bearer) |
| Intercom | `intercom` | Header: Authorization (Bearer) |
| Kitemaker | `kitemaker` | Header: Authorization (Bearer) |
| KoBoToolbox | `kobotoolbox` | Header: Authorization (Bearer) |
| Line (LINE Notify) | `line-notify` | Header: Authorization (Bearer) |
| Linear | `linear` | Header: Authorization (Bearer) |
| Magento 2 | `magento2` | Header: Authorization (Bearer) |
| Mailchimp | `mailchimp` | Header: Authorization (Bearer) |
| MailerLite | `mailerlite` | Header: Authorization (Bearer) |
| Matrix | `matrix` | Header: Authorization (Bearer) |
| Mattermost | `mattermost` | Header: Authorization (Bearer) |
| Mautic | `mautic` | Header: Authorization (Bearer) |
| Medium | `medium` | Header: Authorization (Bearer) |
| Microsoft Dynamics CRM | `microsoft-dynamics-crm` | Header: Authorization (Bearer) |
| Microsoft Entra (Azure AD) | `microsoft-entra` | Header: Authorization (Bearer) |
| Microsoft Excel | `microsoft-excel` | Header: Authorization (Bearer) |
| Microsoft Graph Security | `microsoft-graph-security` | Header: Authorization (Bearer) |
| Microsoft ToDo | `microsoft-todo` | Header: Authorization (Bearer) |
| Mistral AI | `mistral-ai` | Header: Authorization (Bearer) |
| Netlify | `netlify` | Header: Authorization (Bearer) |
| NextCloud | `nextcloud` | Header: Authorization (Bearer) |
| Notion | `notion` | Header: Authorization (Bearer) |
| Okta | `okta` | Header: Authorization (Bearer) |
| OpenAI | `openai` | Header: Authorization (Bearer) |
| Orbit | `orbit` | Header: Authorization (Bearer) |
| Perplexity | `perplexity` | Header: Authorization (Bearer) |
| Pushbullet | `pushbullet` | Header: Authorization (Bearer) |
| Reddit | `reddit` | Header: Authorization (Bearer) |
| SecurityScorecard | `securityscorecard` | Header: Authorization (Bearer) |
| SendGrid | `sendgrid` | Header: Authorization (Bearer) |
| Sentry.io | `sentry` | Header: Authorization (Bearer) |
| Slack | `slack` | Header: Authorization (Bearer) |
| Spotify | `spotify` | Header: Authorization (Bearer) |
| Strava | `strava` | Header: Authorization (Bearer) |
| Stripe | `stripe` | Header: Authorization (Bearer) |
| Supabase | `supabase` | Header: Authorization (Bearer) |
| SurveyMonkey | `surveymonkey` | Header: Authorization (Bearer) |
| TheHive | `thehive` | Header: Authorization (Bearer) |
| TheHive 5 (TheHiveProject) | `thehive5` | Header: Authorization (Bearer) |
| Todoist | `todoist` | Header: Authorization (Bearer) |
| Typeform | `typeform` | Header: Authorization (Bearer) |
| Vonage (Nexmo) | `vonage` | Header: Authorization (Bearer) |
| Webflow | `webflow` | Header: Authorization (Bearer) |
| WhatsApp | `whatsapp` | Header: Authorization (Bearer) |
| Wise (TransferWise) | `wise` | Header: Authorization (Bearer) |
| Workable | `workable` | Header: Authorization (Bearer) |
| Zammad | `zammad` | Header: Authorization (Bearer) |
| Zoho CRM | `zoho-crm` | Header: Authorization (Bearer) |
| Zoom | `zoom` | Header: Authorization (Bearer) |

## Header Authentication (Standard)

**Count:** 45

| API Name | ID | Details |
|----------|----|---------|
| ActiveCampaign | `activecampaign` | Header: Api-Token ({apiKey}) |
| Autopilot | `autopilot` | Header: autopilotapikey (standard) |
| Azure Cosmos DB | `azure-cosmos-db` | Header: Authorization ({signature}) |
| Brevo (Sendinblue) | `brevo` | Header: api-key ({apiKey}) |
| CircleCI | `circleci` | Header: Circle-Token ({apiKey}) |
| ClickUp | `clickup` | Header: Authorization ({apiKey}) |
| Clockify | `clockify` | Header: X-Api-Key ({apiKey}) |
| DeepL | `deepl` | Header: Authorization (DeepL-Auth-Key {apiKey}) |
| Discord | `discord` | Header: Authorization (Bot {apiKey}) |
| Discourse | `discourse` | Header: Api-Key ({apiKey}) |
| Dropcontact | `dropcontact` | Header: Authorization ({apiKey}) |
| E-goi (Egoi) | `egoi` | Header: Apikey (standard) |
| Emelia | `emelia` | Header: Authorization ({apiKey}) |
| Figma | `figma` | Header: X-Figma-Token ({apiKey}) |
| Freshworks CRM | `freshworks-crm` | Header: Authorization (Token token={apiKey}) |
| GetResponse | `getresponse` | Header: X-Auth-Token (api-key {apiKey}) |
| Gotify | `gotify` | Header: X-Gotify-Key (standard) |
| Hacker News | `hacker-news` | API Key (assumed header: unknown) |
| Invoice Ninja | `invoice-ninja` | Header: X-API-TOKEN ({apiKey}) |
| Iterable | `iterable` | Header: Api-Key ({apiKey}) |
| Jina AI | `jina-ai` | Header: X-API-Key (standard) |
| JotForm | `jotform` | Header: APIKEY ({apiKey}) |
| Mandrill | `mandrill` | API Key (assumed header: MANDRILL_API_KEY) |
| MessageBird | `messagebird` | Header: Authorization (AccessKey {apiKey}) |
| MISP | `misp` | Header: Authorization ({apiKey}) |
| Monday.com | `monday` | Header: Authorization ({apiKey}) |
| MongoDB | `mongodb` | Header: api-key ({apiKey}) |
| NocoDB | `nocodb` | Header: xc-token ({apiKey}) |
| PagerDuty | `pagerduty` | Header: Authorization (Token token={apiKey}) |
| Postmark | `postmark` | Header: X-Postmark-Server-Token ({apiKey}) |
| ProfitWell | `profitwell` | Header: Authorization ({apiKey}) |
| QuickBase | `quickbase` | Header: QB-User-Token (standard) |
| Rundeck | `rundeck` | Header: X-Rundeck-Auth-Token (standard) |
| SeaTable | `seatable` | Header: Authorization (Token {token}) |
| Sendy | `sendy` | API Key (assumed header: SENDY_API_KEY) |
| Shopify | `shopify` | Header: X-Shopify-Access-Token ({apiKey}) |
| Sms77 (seven) | `sms77` | Header: SentWith (standard) |
| Stackby | `stackby` | Header: api-key ({apiKey}) |
| Tapfiliate | `tapfiliate` | Header: Api-Key ({apiKey}) |
| TravisCI | `travisci` | Header: Authorization (token {apiKey}) |
| Trello | `trello` | Header: Authorization (OAuth {apiKey}) |
| Unleashed Software | `unleashed-software` | Header: api-auth-id (standard) |
| Uplead | `uplead` | Header: Authorization ({apiKey}) |
| uProc | `uproc` | Header: Authorization ({apiKey}) |
| UptimeRobot | `uptimerobot` | Header: Content-Type (application/x-www-form-urlencoded) |

## Header Authentication (Basic)

**Count:** 41

| API Name | ID | Details |
|----------|----|---------|
| Acuity Scheduling | `acuity-scheduling` | HTTP Basic Authentication |
| Affinity | `affinity` | HTTP Basic Authentication |
| Agile CRM | `agile-crm` | HTTP Basic Authentication |
| BambooHR | `bamboohr` | HTTP Basic Authentication |
| Bitbucket | `bitbucket` | HTTP Basic Authentication |
| Chargebee | `chargebee` | HTTP Basic Authentication |
| CrateDB | `cratedb` | HTTP Basic Authentication |
| Customer.io | `customerio` | HTTP Basic Authentication |
| Elastic Security | `elastic-security` | HTTP Basic Authentication |
| ERPNext | `erpnext` | HTTP Basic Authentication |
| Flow | `flow` | HTTP Basic Authentication |
| Freshdesk | `freshdesk` | HTTP Basic Authentication |
| Freshservice | `freshservice` | HTTP Basic Authentication |
| Jenkins | `jenkins` | HTTP Basic Authentication |
| Jira | `jira` | HTTP Basic Authentication |
| Lemlist | `lemlist` | HTTP Basic Authentication |
| Mailgun | `mailgun` | HTTP Basic Authentication |
| Mailjet | `mailjet` | HTTP Basic Authentication |
| Metabase | `metabase` | HTTP Basic Authentication |
| Mindee | `mindee` | HTTP Basic Authentication |
| Mocean | `mocean` | HTTP Basic Authentication |
| MySQL | `mysql` | HTTP Basic Authentication |
| Odoo | `odoo` | HTTP Basic Authentication |
| Onfleet | `onfleet` | HTTP Basic Authentication |
| PostgreSQL | `postgresql` | HTTP Basic Authentication |
| QuestDB | `questdb` | HTTP Basic Authentication |
| Segment | `segment` | HTTP Basic Authentication |
| ServiceNow | `servicenow` | HTTP Basic Authentication |
| Snowflake | `snowflake` | HTTP Basic Authentication |
| Splunk | `splunk` | HTTP Basic Authentication |
| Strapi | `strapi` | HTTP Basic Authentication |
| Taiga | `taiga` | HTTP Basic Authentication |
| TimescaleDB | `timescaledb` | HTTP Basic Authentication |
| Toggl | `toggl` | HTTP Basic Authentication |
| Twilio | `twilio` | HTTP Basic Authentication |
| Wekan | `wekan` | HTTP Basic Authentication |
| WooCommerce | `woocommerce` | HTTP Basic Authentication |
| WordPress | `wordpress` | HTTP Basic Authentication |
| Wufoo | `wufoo` | HTTP Basic Authentication |
| Zendesk | `zendesk` | HTTP Basic Authentication |
| Zulip | `zulip` | HTTP Basic Authentication |

## Query Parameter Authentication

**Count:** 13

| API Name | ID | Details |
|----------|----|---------|
| Beeminder | `beeminder` | Query parameter: auth_token |
| Cockpit | `cockpit` | Query parameter: token |
| Contentful | `contentful` | Query parameter: access_token |
| ConvertKit | `convertkit` | Query parameter: api_secret |
| Disqus | `disqus` | Query parameter: api_key |
| Ghost | `ghost` | Query parameter: key |
| Gumroad | `gumroad` | Query parameter: access_token |
| Humantic AI | `humantic-ai` | Query parameter: apikey |
| Hunter.io | `hunter` | Query parameter: api_key |
| One Simple API | `one-simple-api` | Query parameter: token |
| Pipedrive | `pipedrive` | Query parameter: api_token |
| PostHog | `posthog` | Query parameter: api_key |
| Storyblok | `storyblok` | Query parameter: token |

## URL Placeholder Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| Telegram | `telegram` | Token in URL path (placeholder: {token}) |

## AWS Signature Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| AWS S3 | `aws-s3` | AWS Signature v4 |

## Multi-Secret Authentication

**Count:** 6

| API Name | ID | Details |
|----------|----|---------|
| Copper | `copper` | Header: X-PW-AccessToken (multiple secrets) |
| Paddle | `paddle` | Header: Authorization (multiple secrets) |
| Pushover | `pushover` | Query parameter: token (multi-secret) |
| RocketChat | `rocketchat` | Header: X-Auth-Token (multiple secrets) |
| Salesmate | `salesmate` | Header: sessionToken (multiple secrets) |
| Spontit | `spontit` | Header: X-Authorization (multiple secrets) |

## OAuth2 Authentication

**Count:** 17

| API Name | ID | Details |
|----------|----|---------|
| Bitwarden | `bitwarden` | OAuth2 authentication |
| Box | `box` | OAuth2 authentication |
| Google Analytics | `google-analytics` | OAuth2 authentication |
| Google Drive | `google-drive` | OAuth2 authentication |
| Google Sheets | `google-sheets` | OAuth2 authentication |
| HelpScout | `helpscout` | OAuth2 authentication |
| Keap (Infusionsoft) | `keap` | OAuth2 authentication |
| LinkedIn | `linkedin` | OAuth2 authentication |
| Microsoft OneDrive | `microsoft-onedrive` | OAuth2 authentication |
| Microsoft Outlook | `microsoft-outlook` | OAuth2 authentication |
| Microsoft SharePoint | `microsoft-sharepoint` | OAuth2 authentication |
| Microsoft Teams | `microsoft-teams` | OAuth2 authentication |
| PayPal | `paypal` | OAuth2 authentication |
| QuickBooks Online | `quickbooks-online` | OAuth2 authentication |
| Salesforce | `salesforce` | OAuth2 authentication |
| Twitter (X) | `twitter` | OAuth2 authentication |
| Xero | `xero` | OAuth2 authentication |

## Unknown/No Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| undefined | `undefined` | No authentication configured |



# API Integrations - Complete Categorization

**Generated:** 2025-12-26T16:41:15.219Z

**Total APIs:** 212

---

## Header Authentication (Bearer Token)

**Count:** 87

| API Name | ID | Details |
|----------|----|---------|
| Adalo | `adalo` | Header: Authorization (Bearer) |
| Airtable | `airtable` | Header: Authorization (Bearer) |
| Airtop | `airtop` | Header: Authorization (Bearer) |
| Asana | `asana` | Header: Authorization (Bearer) |
| Azure Storage | `azure-storage` | Header: Authorization (Bearer) |
| Bannerbear | `bannerbear` | Header: Authorization (Bearer) |
| Baserow | `baserow` | Header: Authorization (Bearer) |
| Brandfetch | `brandfetch` | Header: Authorization (Bearer) |
| Bubble | `bubble` | Header: Authorization (Bearer) |
| Cal | `cal` | Header: Authorization (Bearer) |
| Calendly | `calendly` | Header: Authorization (Bearer) |
| Cisco Webex | `cisco-webex` | Header: Authorization (Bearer) |
| Clearbit | `clearbit` | Header: Authorization (Bearer) |
| Coda | `coda` | Header: Authorization (Bearer) |
| Cortex | `cortex` | Header: Authorization (Bearer) |
| Drift | `drift` | Header: Authorization (Bearer) |
| Dropbox | `dropbox` | Header: Authorization (Bearer) |
| Eventbrite | `eventbrite` | Header: Authorization (Bearer) |
| Facebook Graph API | `facebook-graph` | Header: Authorization (Bearer) |
| Facebook Lead Ads | `facebook-lead-ads` | Header: Authorization (Bearer) |
| FileMaker | `filemaker` | Header: Authorization (Bearer) |
| Form.io | `formio` | Header: x-jwt-token (Bearer) |
| Formstack | `formstack` | Header: Authorization (Bearer) |
| GitHub | `github` | Header: Authorization (Bearer) |
| GitLab | `gitlab` | Header: Authorization (Bearer) |
| Gong | `gong` | Header: Authorization (Bearer) |
| Google BigQuery | `google-bigquery` | Header: Authorization (Bearer) |
| Google Calendar | `google-calendar` | Header: Authorization (Bearer) |
| Google Chat | `google-chat` | Header: Authorization (Bearer) |
| Google Docs | `google-docs` | Header: Authorization (Bearer) |
| Google G Suite Admin | `google-gsuite-admin` | Header: Authorization (Bearer) |
| Google Translate | `google-translate` | Header: Authorization (Bearer) |
| Google YouTube | `google-youtube` | Header: Authorization (Bearer) |
| GoToWebinar | `gotowebinar` | Header: Authorization (Bearer) |
| Grafana | `grafana` | Header: Authorization (Bearer) |
| Grist | `grist` | Header: Authorization (Bearer) |
| Harvest | `harvest` | Header: Authorization (Bearer) |
| HighLevel | `highlevel` | Header: Authorization (Bearer) |
| HubSpot | `hubspot` | Header: Authorization (Bearer) |
| Intercom | `intercom` | Header: Authorization (Bearer) |
| Kitemaker | `kitemaker` | Header: Authorization (Bearer) |
| KoBoToolbox | `kobotoolbox` | Header: Authorization (Bearer) |
| Line (LINE Notify) | `line-notify` | Header: Authorization (Bearer) |
| Linear | `linear` | Header: Authorization (Bearer) |
| Magento 2 | `magento2` | Header: Authorization (Bearer) |
| Mailchimp | `mailchimp` | Header: Authorization (Bearer) |
| MailerLite | `mailerlite` | Header: Authorization (Bearer) |
| Matrix | `matrix` | Header: Authorization (Bearer) |
| Mattermost | `mattermost` | Header: Authorization (Bearer) |
| Mautic | `mautic` | Header: Authorization (Bearer) |
| Medium | `medium` | Header: Authorization (Bearer) |
| Microsoft Dynamics CRM | `microsoft-dynamics-crm` | Header: Authorization (Bearer) |
| Microsoft Entra (Azure AD) | `microsoft-entra` | Header: Authorization (Bearer) |
| Microsoft Excel | `microsoft-excel` | Header: Authorization (Bearer) |
| Microsoft Graph Security | `microsoft-graph-security` | Header: Authorization (Bearer) |
| Microsoft ToDo | `microsoft-todo` | Header: Authorization (Bearer) |
| Mistral AI | `mistral-ai` | Header: Authorization (Bearer) |
| Netlify | `netlify` | Header: Authorization (Bearer) |
| NextCloud | `nextcloud` | Header: Authorization (Bearer) |
| Notion | `notion` | Header: Authorization (Bearer) |
| Okta | `okta` | Header: Authorization (Bearer) |
| OpenAI | `openai` | Header: Authorization (Bearer) |
| Orbit | `orbit` | Header: Authorization (Bearer) |
| Perplexity | `perplexity` | Header: Authorization (Bearer) |
| Pushbullet | `pushbullet` | Header: Authorization (Bearer) |
| Reddit | `reddit` | Header: Authorization (Bearer) |
| SecurityScorecard | `securityscorecard` | Header: Authorization (Bearer) |
| SendGrid | `sendgrid` | Header: Authorization (Bearer) |
| Sentry.io | `sentry` | Header: Authorization (Bearer) |
| Slack | `slack` | Header: Authorization (Bearer) |
| Spotify | `spotify` | Header: Authorization (Bearer) |
| Strava | `strava` | Header: Authorization (Bearer) |
| Stripe | `stripe` | Header: Authorization (Bearer) |
| Supabase | `supabase` | Header: Authorization (Bearer) |
| SurveyMonkey | `surveymonkey` | Header: Authorization (Bearer) |
| TheHive | `thehive` | Header: Authorization (Bearer) |
| TheHive 5 (TheHiveProject) | `thehive5` | Header: Authorization (Bearer) |
| Todoist | `todoist` | Header: Authorization (Bearer) |
| Typeform | `typeform` | Header: Authorization (Bearer) |
| Vonage (Nexmo) | `vonage` | Header: Authorization (Bearer) |
| Webflow | `webflow` | Header: Authorization (Bearer) |
| WhatsApp | `whatsapp` | Header: Authorization (Bearer) |
| Wise (TransferWise) | `wise` | Header: Authorization (Bearer) |
| Workable | `workable` | Header: Authorization (Bearer) |
| Zammad | `zammad` | Header: Authorization (Bearer) |
| Zoho CRM | `zoho-crm` | Header: Authorization (Bearer) |
| Zoom | `zoom` | Header: Authorization (Bearer) |

## Header Authentication (Standard)

**Count:** 45

| API Name | ID | Details |
|----------|----|---------|
| ActiveCampaign | `activecampaign` | Header: Api-Token ({apiKey}) |
| Autopilot | `autopilot` | Header: autopilotapikey (standard) |
| Azure Cosmos DB | `azure-cosmos-db` | Header: Authorization ({signature}) |
| Brevo (Sendinblue) | `brevo` | Header: api-key ({apiKey}) |
| CircleCI | `circleci` | Header: Circle-Token ({apiKey}) |
| ClickUp | `clickup` | Header: Authorization ({apiKey}) |
| Clockify | `clockify` | Header: X-Api-Key ({apiKey}) |
| DeepL | `deepl` | Header: Authorization (DeepL-Auth-Key {apiKey}) |
| Discord | `discord` | Header: Authorization (Bot {apiKey}) |
| Discourse | `discourse` | Header: Api-Key ({apiKey}) |
| Dropcontact | `dropcontact` | Header: Authorization ({apiKey}) |
| E-goi (Egoi) | `egoi` | Header: Apikey (standard) |
| Emelia | `emelia` | Header: Authorization ({apiKey}) |
| Figma | `figma` | Header: X-Figma-Token ({apiKey}) |
| Freshworks CRM | `freshworks-crm` | Header: Authorization (Token token={apiKey}) |
| GetResponse | `getresponse` | Header: X-Auth-Token (api-key {apiKey}) |
| Gotify | `gotify` | Header: X-Gotify-Key (standard) |
| Hacker News | `hacker-news` | API Key (assumed header: unknown) |
| Invoice Ninja | `invoice-ninja` | Header: X-API-TOKEN ({apiKey}) |
| Iterable | `iterable` | Header: Api-Key ({apiKey}) |
| Jina AI | `jina-ai` | Header: X-API-Key (standard) |
| JotForm | `jotform` | Header: APIKEY ({apiKey}) |
| Mandrill | `mandrill` | API Key (assumed header: MANDRILL_API_KEY) |
| MessageBird | `messagebird` | Header: Authorization (AccessKey {apiKey}) |
| MISP | `misp` | Header: Authorization ({apiKey}) |
| Monday.com | `monday` | Header: Authorization ({apiKey}) |
| MongoDB | `mongodb` | Header: api-key ({apiKey}) |
| NocoDB | `nocodb` | Header: xc-token ({apiKey}) |
| PagerDuty | `pagerduty` | Header: Authorization (Token token={apiKey}) |
| Postmark | `postmark` | Header: X-Postmark-Server-Token ({apiKey}) |
| ProfitWell | `profitwell` | Header: Authorization ({apiKey}) |
| QuickBase | `quickbase` | Header: QB-User-Token (standard) |
| Rundeck | `rundeck` | Header: X-Rundeck-Auth-Token (standard) |
| SeaTable | `seatable` | Header: Authorization (Token {token}) |
| Sendy | `sendy` | API Key (assumed header: SENDY_API_KEY) |
| Shopify | `shopify` | Header: X-Shopify-Access-Token ({apiKey}) |
| Sms77 (seven) | `sms77` | Header: SentWith (standard) |
| Stackby | `stackby` | Header: api-key ({apiKey}) |
| Tapfiliate | `tapfiliate` | Header: Api-Key ({apiKey}) |
| TravisCI | `travisci` | Header: Authorization (token {apiKey}) |
| Trello | `trello` | Header: Authorization (OAuth {apiKey}) |
| Unleashed Software | `unleashed-software` | Header: api-auth-id (standard) |
| Uplead | `uplead` | Header: Authorization ({apiKey}) |
| uProc | `uproc` | Header: Authorization ({apiKey}) |
| UptimeRobot | `uptimerobot` | Header: Content-Type (application/x-www-form-urlencoded) |

## Header Authentication (Basic)

**Count:** 41

| API Name | ID | Details |
|----------|----|---------|
| Acuity Scheduling | `acuity-scheduling` | HTTP Basic Authentication |
| Affinity | `affinity` | HTTP Basic Authentication |
| Agile CRM | `agile-crm` | HTTP Basic Authentication |
| BambooHR | `bamboohr` | HTTP Basic Authentication |
| Bitbucket | `bitbucket` | HTTP Basic Authentication |
| Chargebee | `chargebee` | HTTP Basic Authentication |
| CrateDB | `cratedb` | HTTP Basic Authentication |
| Customer.io | `customerio` | HTTP Basic Authentication |
| Elastic Security | `elastic-security` | HTTP Basic Authentication |
| ERPNext | `erpnext` | HTTP Basic Authentication |
| Flow | `flow` | HTTP Basic Authentication |
| Freshdesk | `freshdesk` | HTTP Basic Authentication |
| Freshservice | `freshservice` | HTTP Basic Authentication |
| Jenkins | `jenkins` | HTTP Basic Authentication |
| Jira | `jira` | HTTP Basic Authentication |
| Lemlist | `lemlist` | HTTP Basic Authentication |
| Mailgun | `mailgun` | HTTP Basic Authentication |
| Mailjet | `mailjet` | HTTP Basic Authentication |
| Metabase | `metabase` | HTTP Basic Authentication |
| Mindee | `mindee` | HTTP Basic Authentication |
| Mocean | `mocean` | HTTP Basic Authentication |
| MySQL | `mysql` | HTTP Basic Authentication |
| Odoo | `odoo` | HTTP Basic Authentication |
| Onfleet | `onfleet` | HTTP Basic Authentication |
| PostgreSQL | `postgresql` | HTTP Basic Authentication |
| QuestDB | `questdb` | HTTP Basic Authentication |
| Segment | `segment` | HTTP Basic Authentication |
| ServiceNow | `servicenow` | HTTP Basic Authentication |
| Snowflake | `snowflake` | HTTP Basic Authentication |
| Splunk | `splunk` | HTTP Basic Authentication |
| Strapi | `strapi` | HTTP Basic Authentication |
| Taiga | `taiga` | HTTP Basic Authentication |
| TimescaleDB | `timescaledb` | HTTP Basic Authentication |
| Toggl | `toggl` | HTTP Basic Authentication |
| Twilio | `twilio` | HTTP Basic Authentication |
| Wekan | `wekan` | HTTP Basic Authentication |
| WooCommerce | `woocommerce` | HTTP Basic Authentication |
| WordPress | `wordpress` | HTTP Basic Authentication |
| Wufoo | `wufoo` | HTTP Basic Authentication |
| Zendesk | `zendesk` | HTTP Basic Authentication |
| Zulip | `zulip` | HTTP Basic Authentication |

## Query Parameter Authentication

**Count:** 13

| API Name | ID | Details |
|----------|----|---------|
| Beeminder | `beeminder` | Query parameter: auth_token |
| Cockpit | `cockpit` | Query parameter: token |
| Contentful | `contentful` | Query parameter: access_token |
| ConvertKit | `convertkit` | Query parameter: api_secret |
| Disqus | `disqus` | Query parameter: api_key |
| Ghost | `ghost` | Query parameter: key |
| Gumroad | `gumroad` | Query parameter: access_token |
| Humantic AI | `humantic-ai` | Query parameter: apikey |
| Hunter.io | `hunter` | Query parameter: api_key |
| One Simple API | `one-simple-api` | Query parameter: token |
| Pipedrive | `pipedrive` | Query parameter: api_token |
| PostHog | `posthog` | Query parameter: api_key |
| Storyblok | `storyblok` | Query parameter: token |

## URL Placeholder Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| Telegram | `telegram` | Token in URL path (placeholder: {token}) |

## AWS Signature Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| AWS S3 | `aws-s3` | AWS Signature v4 |

## Multi-Secret Authentication

**Count:** 6

| API Name | ID | Details |
|----------|----|---------|
| Copper | `copper` | Header: X-PW-AccessToken (multiple secrets) |
| Paddle | `paddle` | Header: Authorization (multiple secrets) |
| Pushover | `pushover` | Query parameter: token (multi-secret) |
| RocketChat | `rocketchat` | Header: X-Auth-Token (multiple secrets) |
| Salesmate | `salesmate` | Header: sessionToken (multiple secrets) |
| Spontit | `spontit` | Header: X-Authorization (multiple secrets) |

## OAuth2 Authentication

**Count:** 17

| API Name | ID | Details |
|----------|----|---------|
| Bitwarden | `bitwarden` | OAuth2 authentication |
| Box | `box` | OAuth2 authentication |
| Google Analytics | `google-analytics` | OAuth2 authentication |
| Google Drive | `google-drive` | OAuth2 authentication |
| Google Sheets | `google-sheets` | OAuth2 authentication |
| HelpScout | `helpscout` | OAuth2 authentication |
| Keap (Infusionsoft) | `keap` | OAuth2 authentication |
| LinkedIn | `linkedin` | OAuth2 authentication |
| Microsoft OneDrive | `microsoft-onedrive` | OAuth2 authentication |
| Microsoft Outlook | `microsoft-outlook` | OAuth2 authentication |
| Microsoft SharePoint | `microsoft-sharepoint` | OAuth2 authentication |
| Microsoft Teams | `microsoft-teams` | OAuth2 authentication |
| PayPal | `paypal` | OAuth2 authentication |
| QuickBooks Online | `quickbooks-online` | OAuth2 authentication |
| Salesforce | `salesforce` | OAuth2 authentication |
| Twitter (X) | `twitter` | OAuth2 authentication |
| Xero | `xero` | OAuth2 authentication |

## Unknown/No Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| undefined | `undefined` | No authentication configured |



# API Integrations - Complete Categorization

**Generated:** 2025-12-26T16:41:34.620Z

**Total APIs:** 211

---

## Header Authentication (Bearer Token)

**Count:** 87

| API Name | ID | Details |
|----------|----|---------|
| Adalo | `adalo` | Header: Authorization (Bearer) |
| Airtable | `airtable` | Header: Authorization (Bearer) |
| Airtop | `airtop` | Header: Authorization (Bearer) |
| Asana | `asana` | Header: Authorization (Bearer) |
| Azure Storage | `azure-storage` | Header: Authorization (Bearer) |
| Bannerbear | `bannerbear` | Header: Authorization (Bearer) |
| Baserow | `baserow` | Header: Authorization (Bearer) |
| Brandfetch | `brandfetch` | Header: Authorization (Bearer) |
| Bubble | `bubble` | Header: Authorization (Bearer) |
| Cal | `cal` | Header: Authorization (Bearer) |
| Calendly | `calendly` | Header: Authorization (Bearer) |
| Cisco Webex | `cisco-webex` | Header: Authorization (Bearer) |
| Clearbit | `clearbit` | Header: Authorization (Bearer) |
| Coda | `coda` | Header: Authorization (Bearer) |
| Cortex | `cortex` | Header: Authorization (Bearer) |
| Drift | `drift` | Header: Authorization (Bearer) |
| Dropbox | `dropbox` | Header: Authorization (Bearer) |
| Eventbrite | `eventbrite` | Header: Authorization (Bearer) |
| Facebook Graph API | `facebook-graph` | Header: Authorization (Bearer) |
| Facebook Lead Ads | `facebook-lead-ads` | Header: Authorization (Bearer) |
| FileMaker | `filemaker` | Header: Authorization (Bearer) |
| Form.io | `formio` | Header: x-jwt-token (Bearer) |
| Formstack | `formstack` | Header: Authorization (Bearer) |
| GitHub | `github` | Header: Authorization (Bearer) |
| GitLab | `gitlab` | Header: Authorization (Bearer) |
| Gong | `gong` | Header: Authorization (Bearer) |
| Google BigQuery | `google-bigquery` | Header: Authorization (Bearer) |
| Google Calendar | `google-calendar` | Header: Authorization (Bearer) |
| Google Chat | `google-chat` | Header: Authorization (Bearer) |
| Google Docs | `google-docs` | Header: Authorization (Bearer) |
| Google G Suite Admin | `google-gsuite-admin` | Header: Authorization (Bearer) |
| Google Translate | `google-translate` | Header: Authorization (Bearer) |
| Google YouTube | `google-youtube` | Header: Authorization (Bearer) |
| GoToWebinar | `gotowebinar` | Header: Authorization (Bearer) |
| Grafana | `grafana` | Header: Authorization (Bearer) |
| Grist | `grist` | Header: Authorization (Bearer) |
| Harvest | `harvest` | Header: Authorization (Bearer) |
| HighLevel | `highlevel` | Header: Authorization (Bearer) |
| HubSpot | `hubspot` | Header: Authorization (Bearer) |
| Intercom | `intercom` | Header: Authorization (Bearer) |
| Kitemaker | `kitemaker` | Header: Authorization (Bearer) |
| KoBoToolbox | `kobotoolbox` | Header: Authorization (Bearer) |
| Line (LINE Notify) | `line-notify` | Header: Authorization (Bearer) |
| Linear | `linear` | Header: Authorization (Bearer) |
| Magento 2 | `magento2` | Header: Authorization (Bearer) |
| Mailchimp | `mailchimp` | Header: Authorization (Bearer) |
| MailerLite | `mailerlite` | Header: Authorization (Bearer) |
| Matrix | `matrix` | Header: Authorization (Bearer) |
| Mattermost | `mattermost` | Header: Authorization (Bearer) |
| Mautic | `mautic` | Header: Authorization (Bearer) |
| Medium | `medium` | Header: Authorization (Bearer) |
| Microsoft Dynamics CRM | `microsoft-dynamics-crm` | Header: Authorization (Bearer) |
| Microsoft Entra (Azure AD) | `microsoft-entra` | Header: Authorization (Bearer) |
| Microsoft Excel | `microsoft-excel` | Header: Authorization (Bearer) |
| Microsoft Graph Security | `microsoft-graph-security` | Header: Authorization (Bearer) |
| Microsoft ToDo | `microsoft-todo` | Header: Authorization (Bearer) |
| Mistral AI | `mistral-ai` | Header: Authorization (Bearer) |
| Netlify | `netlify` | Header: Authorization (Bearer) |
| NextCloud | `nextcloud` | Header: Authorization (Bearer) |
| Notion | `notion` | Header: Authorization (Bearer) |
| Okta | `okta` | Header: Authorization (Bearer) |
| OpenAI | `openai` | Header: Authorization (Bearer) |
| Orbit | `orbit` | Header: Authorization (Bearer) |
| Perplexity | `perplexity` | Header: Authorization (Bearer) |
| Pushbullet | `pushbullet` | Header: Authorization (Bearer) |
| Reddit | `reddit` | Header: Authorization (Bearer) |
| SecurityScorecard | `securityscorecard` | Header: Authorization (Bearer) |
| SendGrid | `sendgrid` | Header: Authorization (Bearer) |
| Sentry.io | `sentry` | Header: Authorization (Bearer) |
| Slack | `slack` | Header: Authorization (Bearer) |
| Spotify | `spotify` | Header: Authorization (Bearer) |
| Strava | `strava` | Header: Authorization (Bearer) |
| Stripe | `stripe` | Header: Authorization (Bearer) |
| Supabase | `supabase` | Header: Authorization (Bearer) |
| SurveyMonkey | `surveymonkey` | Header: Authorization (Bearer) |
| TheHive | `thehive` | Header: Authorization (Bearer) |
| TheHive 5 (TheHiveProject) | `thehive5` | Header: Authorization (Bearer) |
| Todoist | `todoist` | Header: Authorization (Bearer) |
| Typeform | `typeform` | Header: Authorization (Bearer) |
| Vonage (Nexmo) | `vonage` | Header: Authorization (Bearer) |
| Webflow | `webflow` | Header: Authorization (Bearer) |
| WhatsApp | `whatsapp` | Header: Authorization (Bearer) |
| Wise (TransferWise) | `wise` | Header: Authorization (Bearer) |
| Workable | `workable` | Header: Authorization (Bearer) |
| Zammad | `zammad` | Header: Authorization (Bearer) |
| Zoho CRM | `zoho-crm` | Header: Authorization (Bearer) |
| Zoom | `zoom` | Header: Authorization (Bearer) |

## Header Authentication (Standard)

**Count:** 45

| API Name | ID | Details |
|----------|----|---------|
| ActiveCampaign | `activecampaign` | Header: Api-Token ({apiKey}) |
| Autopilot | `autopilot` | Header: autopilotapikey (standard) |
| Azure Cosmos DB | `azure-cosmos-db` | Header: Authorization ({signature}) |
| Brevo (Sendinblue) | `brevo` | Header: api-key ({apiKey}) |
| CircleCI | `circleci` | Header: Circle-Token ({apiKey}) |
| ClickUp | `clickup` | Header: Authorization ({apiKey}) |
| Clockify | `clockify` | Header: X-Api-Key ({apiKey}) |
| DeepL | `deepl` | Header: Authorization (DeepL-Auth-Key {apiKey}) |
| Discord | `discord` | Header: Authorization (Bot {apiKey}) |
| Discourse | `discourse` | Header: Api-Key ({apiKey}) |
| Dropcontact | `dropcontact` | Header: Authorization ({apiKey}) |
| E-goi (Egoi) | `egoi` | Header: Apikey (standard) |
| Emelia | `emelia` | Header: Authorization ({apiKey}) |
| Figma | `figma` | Header: X-Figma-Token ({apiKey}) |
| Freshworks CRM | `freshworks-crm` | Header: Authorization (Token token={apiKey}) |
| GetResponse | `getresponse` | Header: X-Auth-Token (api-key {apiKey}) |
| Gotify | `gotify` | Header: X-Gotify-Key (standard) |
| Hacker News | `hacker-news` | API Key (assumed header: unknown) |
| Invoice Ninja | `invoice-ninja` | Header: X-API-TOKEN ({apiKey}) |
| Iterable | `iterable` | Header: Api-Key ({apiKey}) |
| Jina AI | `jina-ai` | Header: X-API-Key (standard) |
| JotForm | `jotform` | Header: APIKEY ({apiKey}) |
| Mandrill | `mandrill` | API Key (assumed header: MANDRILL_API_KEY) |
| MessageBird | `messagebird` | Header: Authorization (AccessKey {apiKey}) |
| MISP | `misp` | Header: Authorization ({apiKey}) |
| Monday.com | `monday` | Header: Authorization ({apiKey}) |
| MongoDB | `mongodb` | Header: api-key ({apiKey}) |
| NocoDB | `nocodb` | Header: xc-token ({apiKey}) |
| PagerDuty | `pagerduty` | Header: Authorization (Token token={apiKey}) |
| Postmark | `postmark` | Header: X-Postmark-Server-Token ({apiKey}) |
| ProfitWell | `profitwell` | Header: Authorization ({apiKey}) |
| QuickBase | `quickbase` | Header: QB-User-Token (standard) |
| Rundeck | `rundeck` | Header: X-Rundeck-Auth-Token (standard) |
| SeaTable | `seatable` | Header: Authorization (Token {token}) |
| Sendy | `sendy` | API Key (assumed header: SENDY_API_KEY) |
| Shopify | `shopify` | Header: X-Shopify-Access-Token ({apiKey}) |
| Sms77 (seven) | `sms77` | Header: SentWith (standard) |
| Stackby | `stackby` | Header: api-key ({apiKey}) |
| Tapfiliate | `tapfiliate` | Header: Api-Key ({apiKey}) |
| TravisCI | `travisci` | Header: Authorization (token {apiKey}) |
| Trello | `trello` | Header: Authorization (OAuth {apiKey}) |
| Unleashed Software | `unleashed-software` | Header: api-auth-id (standard) |
| Uplead | `uplead` | Header: Authorization ({apiKey}) |
| uProc | `uproc` | Header: Authorization ({apiKey}) |
| UptimeRobot | `uptimerobot` | Header: Content-Type (application/x-www-form-urlencoded) |

## Header Authentication (Basic)

**Count:** 41

| API Name | ID | Details |
|----------|----|---------|
| Acuity Scheduling | `acuity-scheduling` | HTTP Basic Authentication |
| Affinity | `affinity` | HTTP Basic Authentication |
| Agile CRM | `agile-crm` | HTTP Basic Authentication |
| BambooHR | `bamboohr` | HTTP Basic Authentication |
| Bitbucket | `bitbucket` | HTTP Basic Authentication |
| Chargebee | `chargebee` | HTTP Basic Authentication |
| CrateDB | `cratedb` | HTTP Basic Authentication |
| Customer.io | `customerio` | HTTP Basic Authentication |
| Elastic Security | `elastic-security` | HTTP Basic Authentication |
| ERPNext | `erpnext` | HTTP Basic Authentication |
| Flow | `flow` | HTTP Basic Authentication |
| Freshdesk | `freshdesk` | HTTP Basic Authentication |
| Freshservice | `freshservice` | HTTP Basic Authentication |
| Jenkins | `jenkins` | HTTP Basic Authentication |
| Jira | `jira` | HTTP Basic Authentication |
| Lemlist | `lemlist` | HTTP Basic Authentication |
| Mailgun | `mailgun` | HTTP Basic Authentication |
| Mailjet | `mailjet` | HTTP Basic Authentication |
| Metabase | `metabase` | HTTP Basic Authentication |
| Mindee | `mindee` | HTTP Basic Authentication |
| Mocean | `mocean` | HTTP Basic Authentication |
| MySQL | `mysql` | HTTP Basic Authentication |
| Odoo | `odoo` | HTTP Basic Authentication |
| Onfleet | `onfleet` | HTTP Basic Authentication |
| PostgreSQL | `postgresql` | HTTP Basic Authentication |
| QuestDB | `questdb` | HTTP Basic Authentication |
| Segment | `segment` | HTTP Basic Authentication |
| ServiceNow | `servicenow` | HTTP Basic Authentication |
| Snowflake | `snowflake` | HTTP Basic Authentication |
| Splunk | `splunk` | HTTP Basic Authentication |
| Strapi | `strapi` | HTTP Basic Authentication |
| Taiga | `taiga` | HTTP Basic Authentication |
| TimescaleDB | `timescaledb` | HTTP Basic Authentication |
| Toggl | `toggl` | HTTP Basic Authentication |
| Twilio | `twilio` | HTTP Basic Authentication |
| Wekan | `wekan` | HTTP Basic Authentication |
| WooCommerce | `woocommerce` | HTTP Basic Authentication |
| WordPress | `wordpress` | HTTP Basic Authentication |
| Wufoo | `wufoo` | HTTP Basic Authentication |
| Zendesk | `zendesk` | HTTP Basic Authentication |
| Zulip | `zulip` | HTTP Basic Authentication |

## Query Parameter Authentication

**Count:** 13

| API Name | ID | Details |
|----------|----|---------|
| Beeminder | `beeminder` | Query parameter: auth_token |
| Cockpit | `cockpit` | Query parameter: token |
| Contentful | `contentful` | Query parameter: access_token |
| ConvertKit | `convertkit` | Query parameter: api_secret |
| Disqus | `disqus` | Query parameter: api_key |
| Ghost | `ghost` | Query parameter: key |
| Gumroad | `gumroad` | Query parameter: access_token |
| Humantic AI | `humantic-ai` | Query parameter: apikey |
| Hunter.io | `hunter` | Query parameter: api_key |
| One Simple API | `one-simple-api` | Query parameter: token |
| Pipedrive | `pipedrive` | Query parameter: api_token |
| PostHog | `posthog` | Query parameter: api_key |
| Storyblok | `storyblok` | Query parameter: token |

## URL Placeholder Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| Telegram | `telegram` | Token in URL path (placeholder: {token}) |

## AWS Signature Authentication

**Count:** 1

| API Name | ID | Details |
|----------|----|---------|
| AWS S3 | `aws-s3` | AWS Signature v4 |

## Multi-Secret Authentication

**Count:** 6

| API Name | ID | Details |
|----------|----|---------|
| Copper | `copper` | Header: X-PW-AccessToken (multiple secrets) |
| Paddle | `paddle` | Header: Authorization (multiple secrets) |
| Pushover | `pushover` | Query parameter: token (multi-secret) |
| RocketChat | `rocketchat` | Header: X-Auth-Token (multiple secrets) |
| Salesmate | `salesmate` | Header: sessionToken (multiple secrets) |
| Spontit | `spontit` | Header: X-Authorization (multiple secrets) |

## OAuth2 Authentication

**Count:** 17

| API Name | ID | Details |
|----------|----|---------|
| Bitwarden | `bitwarden` | OAuth2 authentication |
| Box | `box` | OAuth2 authentication |
| Google Analytics | `google-analytics` | OAuth2 authentication |
| Google Drive | `google-drive` | OAuth2 authentication |
| Google Sheets | `google-sheets` | OAuth2 authentication |
| HelpScout | `helpscout` | OAuth2 authentication |
| Keap (Infusionsoft) | `keap` | OAuth2 authentication |
| LinkedIn | `linkedin` | OAuth2 authentication |
| Microsoft OneDrive | `microsoft-onedrive` | OAuth2 authentication |
| Microsoft Outlook | `microsoft-outlook` | OAuth2 authentication |
| Microsoft SharePoint | `microsoft-sharepoint` | OAuth2 authentication |
| Microsoft Teams | `microsoft-teams` | OAuth2 authentication |
| PayPal | `paypal` | OAuth2 authentication |
| QuickBooks Online | `quickbooks-online` | OAuth2 authentication |
| Salesforce | `salesforce` | OAuth2 authentication |
| Twitter (X) | `twitter` | OAuth2 authentication |
| Xero | `xero` | OAuth2 authentication |

