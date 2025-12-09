# Agent Builder Frontend

React + TypeScript + React Flow Workflow Builder

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📦 Tech Stack

- **React** - UI Framework
- **TypeScript** - Type Safety
- **React Flow** - Workflow Builder
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP Client

## 🌐 Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

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
- ✅ Custom Node Types (Start, Agent, If/Else, Tool, Note)
- ✅ Real-time Workflow Editing
- ✅ Workflow Execution
- ✅ Workflow Management (CRUD)
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

## 📝 Notes

- Make sure the backend services are running before starting the frontend
- The API URL can be configured via environment variables
