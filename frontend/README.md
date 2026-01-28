# MonshyFlow Frontend

AI-Powered Workflow Automation Platform - Frontend

React + TypeScript + React Flow Workflow Builder

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start development server
pnpm dev

# Build for production
pnpm build
```

## ⚙️ Requirements

- **Node.js**: >= 18.x (recommended: 20.x LTS)
- **Package Manager**: pnpm (or npm/yarn)
- **Browsers**: Modern browsers (Chrome/Chromium, Firefox, Safari, Edge)
  - E2E tests are run with Playwright (Chromium, Firefox, WebKit)

## 📦 Tech Stack

- **React** - UI Framework
- **TypeScript** - Type Safety
- **React Flow** - Workflow Builder
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP Client

## 🌐 Environment Variables

Copy `.env.example` to `.env` and adjust the values:

```env
VITE_API_URL=http://localhost:5000
VITE_DEBUG=false
VITE_LOG_LEVEL=info
```

See `.env.example` for all available options.

## 📁 Project Structure

```
src/
├── components/
│   ├── WorkflowBuilder/     # Main workflow builder components
│   │   ├── NodeTypes/       # Custom node components
│   │   ├── NodeConfigPanel/ # Node configuration UI
│   │   ├── Toolbar.tsx      # Node toolbar
│   │   └── WorkflowCanvas.tsx  # Main canvas
│   ├── DebugPanel/          # Debug console with variable tree
│   ├── ExecutionMonitor/    # Real-time execution monitoring
│   ├── WorkflowList/        # Workflow list view
│   └── ProtectedRoute.tsx   # Route protection
├── pages/
│   ├── HomePage.tsx
│   ├── WorkflowEditorPage.tsx
│   ├── PublicWorkflowsPage.tsx
│   ├── LoginPage.tsx
│   └── ...                  # Additional pages (Admin, Secrets, etc.)
├── services/
│   ├── api.ts               # Axios instance
│   ├── workflowService.ts   # Workflow API calls
│   ├── authService.ts       # Authentication
│   └── ...                  # Additional services
├── types/
│   ├── workflow.ts          # Workflow types
│   ├── apiIntegrations.ts   # API integration types
│   └── ...                  # Additional type definitions
├── config/
│   └── apiIntegrations.ts   # API integration configuration
└── App.tsx                  # Main app with routing
```

## 🏗️ Architecture

### Workflow Builder

The Workflow Builder is the core component of the frontend, built with React Flow:

- **`WorkflowCanvas`**: Main canvas component that renders nodes and edges, handles user interactions (drag, drop, select, connect)
- **`nodeRegistry`**: Central registry that maps node types to their React components and metadata
- **`NodeConfigPanel`**: Configuration UI for editing node properties (fields, expressions, API integrations)
- **`WorkflowSettingsPanel`**: Workflow-level settings (name, description, tags, visibility)
- **`NodeTypes/`**: Individual node component implementations (Start, Agent, LLM, HTTP, etc.)
- **`hooks/`**: Custom React hooks for workflow state management, undo/redo, clipboard operations, etc.

The builder supports real-time execution monitoring via Server-Sent Events (SSE) and provides a debug panel for inspecting node inputs/outputs during workflow execution.

## 🎨 Features

- ✅ Drag & Drop Workflow Builder
- ✅ 15+ Node Types (Start, End, Agent, LLM, HTTP Request, Code, Variable, Transform, Email, If/Else, While, ForEach, and Tool variants)
- ✅ Real-time Workflow Execution Monitoring (SSE)
- ✅ Debug Panel with Variable Tree
- ✅ Expression Editor with Template Engine
- ✅ Auto-Layout & Auto-Save
- ✅ Multi-Select, Copy/Paste, Undo/Redo
- ✅ Secrets Management Integration
- ✅ Multi-Tenant Support
- ✅ Beautiful UI with Tailwind CSS

## 🔗 API Integration

Frontend connects to the backend API gateway at `http://localhost:5000`:

- `GET /api/workflows` - Get all workflows
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `POST /api/execute/:workflowId` - Execute workflow

## 🎯 Development

The app runs on http://localhost:5173 in development mode.

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:coverage
```

## 📝 Notes

- Make sure the backend services are running before starting the frontend
- The API URL can be configured via `VITE_API_URL` environment variable
- See `e2e/README.md` for E2E test setup instructions

## 🔒 Security & Best Practices

- **No secrets in the frontend**: Never commit real API keys, access tokens, client secrets or passwords. Use environment variables and server-side configuration instead.
- **Environment configuration**: Configure the backend URL and debug flags via a local `.env` file (created from `.env.example`). Only `VITE_API_URL`, `VITE_DEBUG`, `VITE_LOG_LEVEL` and similar non‑secret values should be present in the frontend `.env`. The `.env` file is not committed to the repository.
- **Shared API integrations**: Files in `shared/apiIntegrations` only contain **secret names** (e.g. `OPENAI_API_KEY`, `LINKEDIN_CLIENT_SECRET`) and must not contain real secret values. Make sure any custom integrations you add follow the same pattern.
- **Production builds**: In production builds, keep `VITE_DEBUG` disabled to avoid verbose client-side logging.

## 👤 Test Users

- The test users documented in `e2e/TEST_USERS.md` are **purely for local development and seed data**.
- They are not real users and should never be reused in real/production environments.

## 🤝 Contributing

When contributing to the frontend, please read **[CONTRIBUTING.md](./CONTRIBUTING.md)** first. It covers important systems you need to understand:

- **Node Registry System**: How nodes are defined and code is generated
- **Animation System**: How workflow execution animation works
- **Auto-Layout System**: How nodes are automatically arranged
- **API Integration System**: How external APIs are integrated

### Quick Checklist

1. **Before submitting a PR**:
   - Run `pnpm lint` to check for code style issues
   - Run `pnpm test` to ensure all unit tests pass
   - Run `pnpm test:e2e` to ensure E2E tests pass (if applicable)
   - If you modified `shared/registry.json`, run `pnpm run generate:registry` in `shared/`
   - Make sure your changes don't break existing functionality

2. **Code Style**:
   - Follow the existing TypeScript/React patterns
   - Use ESLint configuration provided in the project
   - Prefer functional components with hooks

3. **Testing**:
   - Add unit tests for new features
   - Update E2E tests if UI flows change

4. **Documentation**:
   - Update README.md if you add new features or change setup requirements
   - Add JSDoc comments for new public functions/components

## 📄 License

MIT License - see LICENSE file for details
