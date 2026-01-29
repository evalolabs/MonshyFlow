# 🚀 MonshyFlow - Project Presentation

**AI-Powered Workflow Automation Platform**

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [How We Build It](#how-we-build-it)
5. [API Interactions](#api-interactions)
6. [Deployment](#deployment)
7. [Development Workflow](#development-workflow)

---

## 🎯 Project Overview

### What is MonshyFlow?

MonshyFlow is an **open-source, visual workflow automation platform** that combines the power of AI agents with traditional workflow automation. It enables users to build complex workflows using a drag-and-drop interface, integrate with 50+ APIs, and leverage AI agents to automate business processes.

### Key Features

- **Visual Workflow Builder** - Drag & drop interface with 13+ node types
- **AI Integration** - AI agents, LLM nodes (GPT-4, GPT-3.5, Claude 3), Agent SDK
- **50+ API Integrations** - Pre-built integrations for popular services
- **Multi-Tenant Support** - Built-in tenant isolation
- **Secrets Management** - Secure credential storage
- **Real-time Execution** - Monitor workflow execution with live updates
- **Debug Panel** - VS Code-inspired debugging with variable tree
- **Webhook Support** - Trigger workflows via webhooks
- **Schedule Support** - Time-based workflow triggers

### Target Audience

- **Business Users** - Non-technical users building automation workflows
- **Developers** - Technical users extending the platform
- **Enterprises** - Multi-tenant organizations requiring workflow automation

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.1 | UI Framework |
| **TypeScript** | 5.9.3 | Type Safety |
| **React Flow** | 12.8.6 | Visual Workflow Editor |
| **Vite** | 7.1.7 | Build Tool & Dev Server |
| **Tailwind CSS** | 3.4.1 | Styling |
| **Axios** | 1.12.2 | HTTP Client |
| **React Router** | 7.9.4 | Routing |
| **CodeMirror** | 6.2.4 | Expression Editor |
| **Vitest** | 2.1.9 | Unit Testing |
| **Playwright** | 1.57.0 | E2E Testing |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | >=20.0.0 | Runtime |
| **TypeScript** | 5.9.3 | Type Safety |
| **Express.js** | Latest | HTTP Framework |
| **MongoDB** | 8.19.1 | Primary Database (via Mongoose) |
| **Redis** | Latest | Caching & Session Storage |
| **RabbitMQ** | Latest | Message Queue |
| **JWT** | 9.0.2 | Authentication |
| **bcrypt** | 5.1.1 | Password Hashing |
| **Zod** | 3.25.76 | Schema Validation |
| **Pino** | 9.6.0 | Logging |
| **Helmet** | 8.0.0 | Security Headers |
| **express-rate-limit** | 7.4.1 | Rate Limiting |

### Infrastructure & DevOps

| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Local Development |
| **Kong Gateway** | API Gateway (Production) |
| **Azure Container Apps** | Production Deployment |
| **Azure Cosmos DB** | Production Database (MongoDB API) |
| **Azure Redis Cache** | Production Caching |
| **Azure Key Vault** | Secrets Management |
| **pnpm** | Package Management (Monorepo) |
| **GitHub Actions** | CI/CD |

### Development Tools

| Technology | Purpose |
|------------|---------|
| **TypeScript** | Type Safety |
| **ESLint** | Code Linting |
| **Prettier** | Code Formatting |
| **Vitest** | Unit Testing |
| **Playwright** | E2E Testing |
| **Swagger UI** | API Documentation (Development) |

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│                  http://localhost:5173                       │
│              - Visual Workflow Builder                      │
│              - Real-time Execution Monitoring                │
│              - Debug Panel                                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Kong API Gateway                         │
│                  http://localhost:8000                      │
│              (Rate Limiting, Authentication)                 │
└───────────┬───────────┬───────────┬───────────┬────────────┘
            │           │           │           │
    ┌───────▼───┐ ┌─────▼────┐ ┌───▼────┐ ┌───▼──────┐
    │   API     │ │   Auth   │ │ Secrets│ │Scheduler │
    │  Service  │ │ Service  │ │ Service│ │ Service  │
    │  :5000    │ │  :5002   │ │ :5003  │ │  :5005   │
    │           │ │          │ │        │ │          │
    │ Gateway   │ │ JWT      │ │ AES-   │ │ Cron     │
    │ Workflow  │ │ API Keys │ │ 256-GCM│ │ Jobs     │
    │ Management│ │          │ │        │ │          │
    └─────┬─────┘ └──────────┘ └────────┘ └──────────┘
          │
    ┌─────▼─────────────┐
    │  Execution        │
    │  Service          │
    │  :5004            │
    │  (SSE Streaming)  │
    │                   │
    │ - Node Processing │
    │ - Expression Eval │
    │ - AI Agents       │
    │ - Tool Integration│
    └───────────────────┘
            │
    ┌───────┴───────────┐
    │                   │
┌───▼────┐        ┌─────▼────┐      ┌──────────┐
│ MongoDB│        │  Redis   │      │ RabbitMQ │
│ :27017 │        │  :6379   │      │  :5672   │
│        │        │          │      │          │
│ Workflows│      │ Cache    │      │ Queue    │
│ Users    │      │ Sessions │      │ Events   │
│ Tenants │      │ Rate Lim │      │          │
│ Secrets │      │          │      │          │
└────────┘        └──────────┘      └──────────┘
```

### Microservices Architecture

#### 1. API Service (Port: 5000)
**Purpose:** Central API Gateway and Workflow Management

**Responsibilities:**
- Workflow CRUD operations
- User & Tenant Management
- Request routing to other services
- Admin functions (Statistics, Audit Logs)
- Public workflow marketplace
- Webhook endpoints

**Key Features:**
- Integrated Gateway (http-proxy-middleware)
- Rate Limiting (100 req/15min API, 5 req/15min Auth)
- Security Headers (Helmet)
- CORS Configuration
- Request ID Tracking

#### 2. Auth Service (Port: 5002)
**Purpose:** Authentication and Authorization

**Responsibilities:**
- JWT token generation/validation
- User authentication (login/register)
- API key management
- Role-based access control (RBAC)
- Token refresh

**Key Features:**
- JWT with configurable issuer/audience
- API Key hashing (SHA-256)
- Password hashing (bcrypt, rounds >= 10)
- Tenant-scoped authentication

#### 3. Execution Service (Port: 5004)
**Purpose:** Workflow Execution Engine

**Responsibilities:**
- Executes workflows node by node
- Node processing (13+ node types)
- Expression evaluation (`{{variable}}` syntax)
- AI Agent orchestration
- Tool integration (50+ APIs)
- Real-time updates via SSE
- Context management

**Key Features:**
- Professional API (`/v1/workflows/:id/runs`)
- Legacy API (`/api/execute/*`)
- SSE Streaming for real-time updates
- Node testing with context
- Schema validation
- OpenAI integration (Files, Vector Stores)
- MCP (Model Context Protocol) handlers
- Web search handlers

#### 4. Secrets Service (Port: 5003)
**Purpose:** Secure Credential Storage

**Responsibilities:**
- Encrypted secret storage (AES-256-GCM)
- Tenant-isolated secrets
- Secret retrieval for workflows
- Secret rotation support

**Key Features:**
- AES-256-GCM encryption
- Tenant isolation
- Service-to-service API
- Internal service authentication

#### 5. Scheduler Service (Port: 5005)
**Purpose:** Time-based Workflow Triggers

**Responsibilities:**
- Cron job scheduling
- Scheduled workflow execution
- Timezone handling
- Workflow registration/unregistration

**Key Features:**
- Cron expression support
- Automatic execution (checks every 1 minute)
- Timezone support
- Workflow status queries

### Shared Packages

#### `@monshy/core`
**Base Utilities Package**
- Logger (Pino-based)
- Error Classes (`AppError`, `ValidationError`, `NotFoundError`, etc.)
- Validation Utilities (Zod)
- Security Middleware (Helmet, Rate Limiting)
- Type Definitions (`ApiResponse`, `PaginatedResponse`, `AuthContext`, etc.)
- Constants (`HTTP_STATUS`, `ROLES`, `AUTH_METHODS`)
- Utils (`sleep`, `generateId`, `sanitizeObject`)

#### `@monshy/database`
**Database Package**
- Mongoose Models (User, Workflow, Tenant, ApiKey, Secret, AuditLog, etc.)
- Database Connection Management
- Azure Cosmos DB compatibility
- Repository Pattern (prepared)

#### `@monshy/auth`
**Authentication Package**
- JWT Token Generation & Verification
- API Key Management (generation, hashing, validation)
- Authentication Middleware
- Type Definitions (`JwtPayload`, `ApiKeyPayload`, `AuthRequest`)

### Data Storage

#### MongoDB
- **Primary Database** for all services
- **Stores:** Workflows, Users, Tenants, Secrets, Audit Logs, API Keys, Comments
- **Multi-tenant isolation** at application level
- **Indexes:** Optimized for tenant-scoped queries

#### Redis
- **Caching layer** for frequently accessed data
- **Session storage** for user sessions
- **Rate limiting counters** for DDoS protection

#### RabbitMQ
- **Message queue** for async processing
- **Workflow execution queue** for background jobs
- **Event distribution** across services

---

## 🔨 How We Build It

### Monorepo Structure

```
MonshyFlow/
├── frontend/              # React Frontend
│   ├── src/
│   │   ├── components/    # React Components
│   │   ├── pages/        # Page Components
│   │   ├── services/     # API Services
│   │   ├── contexts/     # React Contexts
│   │   └── utils/        # Utilities
│   └── e2e/              # E2E Tests (Playwright)
│
├── packages/              # Shared Packages & Services
│   ├── core/             # @monshy/core
│   ├── database/         # @monshy/database
│   ├── auth/             # @monshy/auth
│   ├── api-service/      # API Service (Port 5000)
│   ├── auth-service/     # Auth Service (Port 5002)
│   ├── execution-service/# Execution Service (Port 5004)
│   ├── secrets-service/  # Secrets Service (Port 5003)
│   └── scheduler-service/# Scheduler Service (Port 5005)
│
├── shared/               # Shared Resources
│   ├── registry.json     # Node Registry (Single Source of Truth)
│   └── apiIntegrations/  # 212 API Integration Definitions
│
├── seed/                 # Database Seeding Script
├── kong/                 # Kong Gateway Configuration
├── azure-deployment/     # Azure Deployment Scripts
└── docs/                 # Documentation
```

### Development Patterns

#### 1. Clean Architecture
- **Controllers** → Handle HTTP requests/responses
- **Services** → Business logic
- **Repositories** → Data access (prepared, currently using Models directly)
- **Middleware** → Cross-cutting concerns (auth, validation, logging)

#### 2. Dependency Injection (TSyringe)
- All services use **TSyringe** for dependency injection
- Enables easy testing and loose coupling
- Container-based service resolution

#### 3. Type Safety
- **TypeScript** throughout the entire stack
- **Zod schemas** for runtime validation
- **Type-safe API responses** (`ApiResponse<T>`)

#### 4. Error Handling
- **Standardized Error Classes** (`AppError`, `ValidationError`, etc.)
- **Structured Error Responses** with request IDs
- **Error Logging** with context

#### 5. Security Patterns
- **JWT Authentication** on all protected routes
- **API Key Support** for programmatic access
- **Tenant Isolation** at application level
- **Secrets Encryption** (AES-256-GCM)
- **Rate Limiting** (DDoS protection)
- **Security Headers** (Helmet)
- **CORS** configuration
- **Request ID Tracking** for audit

#### 6. Logging
- **Structured Logging** with Pino
- **JSON logs** in production
- **Pretty logs** in development
- **Request ID** in all logs for tracing

#### 7. Testing
- **Unit Tests** (Vitest) for business logic
- **E2E Tests** (Playwright) for critical user flows
- **Test Isolation** - Each test runs in separate context
- **Page Object Model** for E2E tests

### Node Registry System

**Single Source of Truth:** `shared/registry.json`

- **Node Metadata** - Name, icon, category, description
- **Frontend Configuration** - Config forms, fields, validation
- **Backend Processor References** - TypeScript processor classes
- **Schema Definitions** - Input/output schemas for each node

**Benefits:**
- Define once, use everywhere
- Automatic code generation
- Consistency across frontend and backend
- Easy to extend with new nodes

### API Integration System

**Location:** `shared/apiIntegrations/`

- **212 Pre-built API Integrations**
- **JSON-based definitions** for each API
- **Automatic tool generation** for AI agents
- **Categories:** CRM, Communication, Productivity, Database, Payment, etc.

**Integration Format:**
```json
{
  "name": "API Name",
  "description": "API Description",
  "baseUrl": "https://api.example.com",
  "authentication": {
    "type": "bearer",
    "header": "Authorization"
  },
  "resources": [
    {
      "name": "resource",
      "operations": ["list", "get", "create", "update", "delete"]
    }
  ]
}
```

### Workflow Execution Flow

1. **User triggers workflow** (via UI, API, Webhook, or Schedule)
2. **API Service** receives request and validates authentication
3. **Execution Service** receives workflow execution request
4. **Execution Engine** processes workflow:
   - Loads workflow definition
   - Creates execution context
   - Processes nodes sequentially (or in parallel where applicable)
   - Evaluates expressions (`{{variable}}` syntax)
   - Executes node processors
   - Updates context with node outputs
   - Sends real-time updates via SSE
5. **Node Processors** execute:
   - **Start Node** - Initializes workflow
   - **Agent Node** - Runs AI agent with tools
   - **LLM Node** - Calls LLM API (OpenAI, Claude, etc.)
   - **HTTP Node** - Makes HTTP requests
   - **Code Node** - Executes custom JavaScript
   - **Variable Node** - Sets/gets variables
   - **Transform Node** - Transforms data
   - **If/Else Node** - Conditional logic
   - **While Node** - Loops with conditions
   - **ForEach Node** - Iterates over arrays
   - **Email Node** - Sends emails
   - **End Node** - Finalizes workflow
6. **Results** are stored and returned to client

### Real-time Updates (SSE)

- **Server-Sent Events** for real-time execution monitoring
- **Event Types:**
  - `node-started` - Node execution started
  - `node-completed` - Node execution completed
  - `node-error` - Node execution error
  - `workflow-completed` - Workflow execution completed
  - `workflow-error` - Workflow execution error

---

## 🔌 API Interactions

### Internal API Endpoints

#### API Service (Port: 5000)

**Workflow Management:**
- `GET /api/workflows` - Get all workflows
- `GET /api/workflows/:id` - Get workflow by ID
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/workflows/:workflowId/execute` - Execute workflow
- `GET /api/workflows/:id/export` - Export workflow
- `POST /api/workflows/import` - Import workflow
- `POST /api/workflows/:workflowId/nodes/:nodeId/test-with-context` - Test node with context

**Public Workflows:**
- `GET /api/workflows/public` - Get public workflows
- `GET /api/workflows/public/:id` - Get public workflow
- `POST /api/workflows/public/:id/clone` - Clone public workflow
- `POST /api/workflows/public/:id/star` - Star workflow
- `GET /api/workflows/public/:id/comments` - Get comments
- `POST /api/workflows/public/:id/comments` - Add comment

**Admin:**
- `GET /api/admin/statistics` - Get statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `GET /api/admin/users/:id` - Get user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/tenants` - Get all tenants
- `POST /api/admin/tenants` - Create tenant
- `GET /api/admin/tenants/:id` - Get tenant
- `PUT /api/admin/tenants/:id` - Update tenant
- `DELETE /api/admin/tenants/:id` - Delete tenant

**Webhooks:**
- `POST /api/webhooks/:workflowId` - Public webhook endpoint

**Health:**
- `GET /health` - Health check

#### Auth Service (Port: 5002)

**Authentication:**
- `POST /api/auth/login` - Login (public)
- `POST /api/auth/register` - Register (public)
- `GET /api/auth/me` - Get current user (protected)
- `GET /api/auth/validate` - Validate token
- `POST /api/auth/validate-apikey` - Validate API key

**API Keys:**
- `GET /api/apikeys` - Get all API keys (protected)
- `POST /api/apikeys` - Create API key (protected)
- `POST /api/apikeys/:id/revoke` - Revoke API key (protected)
- `DELETE /api/apikeys/:id` - Delete API key (protected)

**Health:**
- `GET /health` - Health check

#### Execution Service (Port: 5004)

**Professional API:**
- `POST /v1/workflows/:workflowId/runs` - Create and start workflow run
- `GET /v1/workflows/:workflowId/runs` - Get workflow runs history
- `GET /v1/runs/:runId/status` - Get run status
- `POST /v1/runs/:runId/cancel` - Cancel run

**Legacy API:**
- `POST /api/execute/node` - Execute single node
- `POST /api/execute/test-node-with-context` - Execute node with full workflow context
- `POST /api/execute/:workflowId` - Execute workflow
- `GET /api/execute/:executionId/status` - Get execution status
- `POST /api/execute/:executionId/cancel` - Cancel execution

**Schemas:**
- `GET /api/schemas/:nodeType/:version` - Get node schema
- `GET /api/schemas/:nodeType/:version/:resource` - Get resource schema
- `GET /api/schemas/:nodeType/:version/:resource/:operation` - Get operation schema
- `GET /api/schemas/nodes` - Get all registered node types

**Events:**
- `GET /api/events/stream` - SSE stream for real-time updates

**Validation:**
- `POST /api/validate-schema` - Validate node schema

**Functions & Tools:**
- `GET /api/functions` - Get all functions
- `GET /api/mcp-handlers` - Get MCP handlers
- `GET /api/web-search-handlers` - Get web search handlers
- `GET /api/node-processors` - Get node processors
- `GET /api/tool-creators` - Get tool creators

**OpenAI Integration:**
- `GET /api/openai/files` - Get OpenAI files
- `POST /api/openai/files` - Upload file to OpenAI
- `GET /api/openai/files/:fileId` - Get OpenAI file
- `DELETE /api/openai/files/:fileId` - Delete OpenAI file
- `GET /api/openai/vector-stores` - Get vector stores
- `POST /api/openai/vector-stores` - Create vector store
- `GET /api/openai/vector-stores/:id` - Get vector store
- `DELETE /api/openai/vector-stores/:id` - Delete vector store

**Admin:**
- `POST /api/admin/cleanup` - Cleanup old executions

**Health:**
- `GET /health` - Health check

#### Secrets Service (Port: 5003)

**Secrets Management:**
- `GET /api/secrets` - Get all secrets (protected)
- `POST /api/secrets` - Create secret (protected)
- `GET /api/secrets/:id` - Get secret (protected)
- `PUT /api/secrets/:id` - Update secret (protected)
- `DELETE /api/secrets/:id` - Delete secret (protected)
- `POST /api/secrets/:id/decrypt` - Decrypt secret value (protected)

**Internal API:**
- `POST /api/internal/secrets/:id/decrypt` - Decrypt secret (service-to-service)

**Health:**
- `GET /health` - Health check

#### Scheduler Service (Port: 5005)

**Scheduling:**
- `POST /api/scheduler/register` - Register workflow for scheduling
- `DELETE /api/scheduler/unregister/:workflowId` - Unregister workflow
- `GET /api/scheduler/status/:workflowId` - Get schedule status
- `GET /api/scheduler/jobs` - Get all scheduled jobs

**Health:**
- `GET /health` - Health check

### External API Integrations (212 APIs)

#### CRM (Customer Relationship Management)
- **Pipedrive** - Sales CRM
- **Salesforce** - Enterprise CRM
- **HubSpot** - Inbound Marketing & Sales
- **Zoho CRM** - Cloud CRM
- **Copper** - CRM for Google Workspace
- **Freshworks CRM** - Modern CRM
- **Salesmate** - Sales Automation
- **Keap** - Small Business CRM
- **Microsoft Dynamics CRM** - Enterprise CRM
- **Affinity** - Relationship Intelligence
- **Agile CRM** - All-in-One CRM
- **Orbit** - Community CRM

#### Communication
- **Slack** - Team Communication
- **Discord** - Community Chat
- **Telegram** - Messaging
- **Microsoft Teams** - Enterprise Collaboration
- **WhatsApp** - Messaging (via API)
- **Twilio** - SMS & Voice
- **MessageBird** - Communication Platform
- **Vonage** - Communication APIs
- **Mattermost** - Open Source Slack Alternative
- **RocketChat** - Team Chat
- **Line Notify** - Line Messaging
- **Cisco WebEx** - Video Conferencing
- **Zoom** - Video Conferencing
- **Google Chat** - Team Chat
- **Zulip** - Team Chat
- **Discourse** - Discussion Platform
- **Disqus** - Commenting Platform

#### Project Management
- **Jira** - Issue Tracking
- **Trello** - Kanban Boards
- **Asana** - Project Management
- **ClickUp** - All-in-One Productivity
- **Monday.com** - Work Management
- **Linear** - Issue Tracking
- **Taiga** - Agile Project Management
- **Wekan** - Kanban Board
- **Kitemaker** - Product Development

#### Productivity
- **Notion** - All-in-One Workspace
- **Airtable** - Database & Spreadsheet
- **Google Sheets** - Spreadsheets
- **Google Docs** - Documents
- **Google Calendar** - Calendar
- **Microsoft Excel** - Spreadsheets
- **Microsoft Outlook** - Email
- **Microsoft OneDrive** - Cloud Storage
- **Microsoft SharePoint** - Collaboration
- **Microsoft Todo** - Task Management
- **Todoist** - Task Management
- **Coda** - All-in-One Doc
- **Baserow** - Open Source Airtable
- **Grist** - Spreadsheet Database
- **Seatable** - Collaborative Database
- **NocoDB** - Open Source Airtable
- **Stackby** - Database & Spreadsheet
- **Flow** - Productivity Platform
- **Beeminder** - Goal Tracking

#### Database
- **MongoDB** - NoSQL Database
- **PostgreSQL** - Relational Database
- **MySQL** - Relational Database
- **Supabase** - Open Source Firebase
- **Azure Cosmos DB** - Multi-Model Database
- **QuickBase** - Low-Code Database
- **FileMaker** - Database Platform
- **CrateDB** - Distributed SQL Database
- **QuestDB** - Time Series Database
- **TimescaleDB** - Time Series PostgreSQL
- **Snowflake** - Data Warehouse

#### E-Commerce
- **Shopify** - E-Commerce Platform
- **WooCommerce** - WordPress E-Commerce
- **Magento 2** - E-Commerce Platform
- **Gumroad** - Digital Products
- **Stripe** - Payment Processing
- **PayPal** - Payment Processing
- **Paddle** - Payment Processing
- **Chargebee** - Subscription Billing
- **Wise** - Money Transfer

#### Marketing
- **Mailchimp** - Email Marketing
- **SendGrid** - Email API
- **Brevo** - Email Marketing
- **ConvertKit** - Email Marketing
- **ActiveCampaign** - Marketing Automation
- **Mailgun** - Email API
- **Postmark** - Transactional Email
- **Mandrill** - Transactional Email
- **Mailjet** - Email Service
- **Sendy** - Self-Hosted Email Marketing
- **MailerLite** - Email Marketing
- **GetResponse** - Email Marketing
- **Autopilot** - Marketing Automation
- **Egoi** - Email Marketing
- **Lemlist** - Cold Email
- **Mautic** - Marketing Automation
- **Customer.io** - Customer Engagement
- **Iterable** - Marketing Automation
- **Drift** - Conversational Marketing
- **HighLevel** - Marketing Platform
- **Tapfiliate** - Affiliate Marketing
- **Emelia** - Email Outreach

#### Support & Helpdesk
- **Zendesk** - Customer Support
- **Intercom** - Customer Messaging
- **Freshdesk** - Customer Support
- **Freshservice** - IT Service Management
- **HelpScout** - Customer Support
- **Zammad** - Open Source Helpdesk
- **Servicenow** - IT Service Management

#### Development
- **GitHub** - Code Repository
- **GitLab** - Code Repository
- **Bitbucket** - Code Repository
- **Jenkins** - CI/CD
- **CircleCI** - CI/CD
- **TravisCI** - CI/CD
- **Netlify** - Web Hosting & CI/CD

#### Analytics & Monitoring
- **Google Analytics** - Web Analytics
- **PostHog** - Product Analytics
- **Segment** - Customer Data Platform
- **Metabase** - Business Intelligence
- **Grafana** - Monitoring & Observability
- **Sentry** - Error Tracking
- **Splunk** - Data Analytics
- **UptimeRobot** - Uptime Monitoring
- **ProfitWell** - Subscription Analytics

#### CMS (Content Management)
- **Contentful** - Headless CMS
- **Storyblok** - Headless CMS
- **Strapi** - Headless CMS
- **Ghost** - Blogging Platform
- **WordPress** - CMS
- **Webflow** - Web Design Platform
- **Cockpit** - Headless CMS

#### AI & Machine Learning
- **OpenAI** - AI Models (GPT-4, GPT-3.5, etc.)
- **Mistral AI** - AI Models
- **DeepL** - Translation
- **Google Translate** - Translation
- **Perplexity** - AI Search
- **Jina AI** - Neural Search
- **Humantic AI** - Personality AI
- **Mindee** - Document Parsing

#### Forms & Surveys
- **Typeform** - Online Forms
- **Jotform** - Form Builder
- **Formstack** - Form Builder
- **Formio** - Form Builder
- **Wufoo** - Form Builder
- **SurveyMonkey** - Surveys
- **Kobotoolbox** - Data Collection

#### Calendar & Scheduling
- **Calendly** - Scheduling
- **Acuity Scheduling** - Appointment Scheduling
- **Cal** - Open Source Calendly
- **GoToWebinar** - Webinars
- **Eventbrite** - Event Management

#### Storage & File Management
- **AWS S3** - Object Storage
- **Azure Storage** - Cloud Storage
- **Google Drive** - Cloud Storage
- **Dropbox** - Cloud Storage
- **Box** - Cloud Storage
- **Nextcloud** - Self-Hosted Storage

#### Social Media
- **Twitter** - Social Network
- **LinkedIn** - Professional Network
- **Facebook Graph** - Facebook API
- **Facebook Lead Ads** - Lead Generation
- **Reddit** - Social Network
- **Medium** - Publishing Platform
- **Hacker News** - Tech News

#### Design
- **Figma** - Design Tool
- **Bannerbear** - Image Generation

#### Time Tracking
- **Harvest** - Time Tracking
- **Clockify** - Time Tracking
- **Toggl** - Time Tracking

#### Accounting & Finance
- **QuickBooks Online** - Accounting
- **Xero** - Accounting
- **Invoice Ninja** - Invoicing

#### HR & Recruitment
- **Workable** - Recruitment
- **BambooHR** - HR Management

#### Security
- **Okta** - Identity Management
- **Microsoft Entra** - Identity Management
- **Microsoft Graph Security** - Security API
- **Bitwarden** - Password Manager
- **SecurityScorecard** - Security Ratings
- **TheHive** - Security Incident Response
- **TheHive 5** - Security Incident Response
- **Cortex** - Security Orchestration
- **Elastic Security** - Security Analytics
- **MISP** - Threat Intelligence

#### ERP (Enterprise Resource Planning)
- **Odoo** - ERP System
- **ERPNext** - Open Source ERP
- **Unleashed Software** - Inventory Management

#### DevOps & Infrastructure
- **PagerDuty** - Incident Management
- **Rundeck** - Runbook Automation

#### Other
- **One Simple API** - API Utilities
- **Uproc** - Document Processing
- **Strava** - Fitness Tracking
- **Spotify** - Music Streaming
- **Google YouTube** - Video Platform
- **Onfleet** - Delivery Management
- **Hunter** - Email Finder
- **Clearbit** - Data Enrichment
- **Brandfetch** - Brand Data
- **Dropcontact** - Contact Enrichment
- **Uplead** - B2B Data
- **Spontit** - Push Notifications
- **Pushbullet** - Push Notifications
- **Pushover** - Push Notifications
- **Gotify** - Push Notifications
- **Matrix** - Decentralized Communication
- **Adalo** - No-Code Platform
- **Bubble** - No-Code Platform
- **AirTop** - Automation Platform

---

## 🚀 Deployment

### Local Development

**Docker Compose Setup:**
```bash
# Start all services
docker-compose up -d monshyflow-mongodb redis rabbitmq api-service auth-service secrets-service execution-service scheduler-service kong

# Run database seed
pnpm --filter @monshy/seed seed

# Start frontend
cd frontend && pnpm dev
```

**Services:**
- MongoDB: `localhost:27019` (external) / `27017` (internal)
- Redis: `localhost:6379`
- RabbitMQ: `localhost:5672`
- Kong Gateway: `localhost:5000` (external) / `8000` (internal)
- API Service: `localhost:5000` (via Kong)
- Auth Service: `localhost:5002`
- Secrets Service: `localhost:5003`
- Execution Service: `localhost:5004`
- Scheduler Service: `localhost:5005`
- Frontend: `localhost:5173`

### Production (Azure)

**Azure Container Apps:**
- All services deployed as containerized applications
- Auto-scaling based on load
- Health checks and graceful shutdown

**Azure Cosmos DB:**
- MongoDB API compatibility
- Global distribution
- Automatic backups

**Azure Redis Cache:**
- Caching layer
- Session storage
- Rate limiting counters

**Azure Key Vault:**
- Secrets management
- Encryption keys
- API keys

**Kong Gateway:**
- API Gateway (optional, can use integrated gateway)
- Rate limiting
- Authentication
- Load balancing

---

## 💻 Development Workflow

### Getting Started

1. **Clone Repository**
   ```bash
   git clone https://github.com/evalolabs/MonshyFlow.git
   cd MonshyFlow
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   ```

3. **Start Docker Services**
   ```bash
   docker-compose up -d
   ```

4. **Seed Database**
   ```bash
   pnpm --filter @monshy/seed seed
   ```

5. **Start Frontend**
   ```bash
   cd frontend && pnpm dev
   ```

### Development Commands

**Build:**
```bash
pnpm build              # Build all packages
pnpm build:packages     # Build shared packages only
```

**Development:**
```bash
pnpm dev                # Start all services in watch mode
cd frontend && pnpm dev # Start frontend dev server
```

**Testing:**
```bash
pnpm test               # Run all tests
cd frontend && pnpm test:e2e  # Run E2E tests
```

**Docker:**
```bash
pnpm docker:build       # Build Docker images
pnpm docker:up         # Start Docker containers
pnpm docker:down       # Stop Docker containers
```

### Code Structure

**Frontend:**
- `src/components/` - React components
- `src/pages/` - Page components
- `src/services/` - API service clients
- `src/contexts/` - React contexts
- `src/utils/` - Utility functions

**Backend:**
- `src/controllers/` - HTTP request handlers
- `src/services/` - Business logic
- `src/repositories/` - Data access (prepared)
- `src/middleware/` - Express middleware
- `src/routes/` - Route definitions
- `src/config/` - Configuration

### Best Practices

1. **Type Safety** - Use TypeScript everywhere
2. **Validation** - Use Zod schemas for runtime validation
3. **Error Handling** - Use standardized error classes
4. **Logging** - Use structured logging with Pino
5. **Testing** - Write unit tests for business logic, E2E tests for critical flows
6. **Security** - Always validate authentication, sanitize inputs
7. **Documentation** - Keep READMEs up to date

---

## 📊 Project Statistics

- **Total Lines of Code:** ~50,000+
- **Services:** 5 microservices
- **Shared Packages:** 3 packages
- **API Integrations:** 212 integrations
- **Node Types:** 13+ node types
- **Frontend Components:** 100+ components
- **Test Coverage:** Unit tests + E2E tests

---

## 🎯 Future Roadmap

- **GraphQL API** (optional)
- **WebSocket Support** for bi-directional communication
- **Advanced Caching Strategies**
- **Multi-Region Deployment**
- **Service Mesh** (Istio/Linkerd)
- **More API Integrations** (target: 500+)
- **Visual Node Editor Improvements**
- **Workflow Templates Marketplace**
- **Advanced AI Agent Features**

---

**Last Updated:** January 2025
**Version:** 1.0.0-alpha
**License:** Apache License 2.0

