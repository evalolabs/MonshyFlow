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
│   ├── WorkflowBuilder/
│   │   ├── NodeTypes/       # Custom node components
│   │   ├── Toolbar.tsx      # Node toolbar
│   │   └── WorkflowCanvas.tsx  # Main canvas
│   └── WorkflowList/        # Workflow list view
├── pages/
│   ├── HomePage.tsx
│   └── WorkflowEditorPage.tsx
├── services/
│   ├── api.ts               # Axios instance
│   └── workflowService.ts   # API calls
├── types/
│   └── workflow.ts          # TypeScript types
└── App.tsx                  # Main app with routing
```

## 🎨 Features

- ✅ Drag & Drop Workflow Builder
- ✅ 13+ Node Types (Start, Agent, LLM, HTTP, If/Else, While, ForEach, etc.)
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

## 📄 License

MIT License - see LICENSE file for details
