# 🚀 MonshyFlow

**AI-Powered Workflow Automation Platform**

MonshyFlow is an open-source, visual workflow automation platform that combines the power of AI agents with traditional workflow automation. Build complex workflows using a drag-and-drop interface, integrate with 50+ APIs, and leverage AI agents to automate your business processes.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)

---

## ✨ Features

### 🎨 Visual Workflow Builder
- **Drag & Drop Interface** - Intuitive visual workflow editor
- **13+ Node Types** - Start, Agent, LLM, HTTP, If/Else, While, ForEach, and more
- **Real-time Execution** - Monitor workflow execution with live updates
- **Debug Panel** - VS Code-inspired debugging with variable tree
- **Expression Editor** - Template engine with `{{variable}}` syntax
- **Auto-Layout & Auto-Save** - Smart workflow management

### 🤖 AI Integration
- **AI Agents** - Build powerful AI agents with tool integration
- **LLM Nodes** - Support for GPT-4, GPT-3.5, Claude 3, and more
- **Agent SDK** - Unique selling proposition for complex AI orchestration
- **Tool Integration** - Connect tools to agents for extended capabilities

### 🔗 Integrations
- **50+ API Integrations** - Pre-built integrations for popular services
- **HTTP Request Node** - Custom API calls
- **Email Integration** - SMTP email sending
- **Webhook Support** - Trigger workflows via webhooks
- **Schedule Support** - Time-based workflow triggers

### 🏢 Enterprise Features
- **Multi-Tenant Support** - Built-in tenant isolation
- **Secrets Management** - Secure credential storage
- **User Management** - Role-based access control
- **API Keys** - Programmatic access
- **Execution Monitoring** - Track workflow runs

### 🛠️ Developer Experience
- **TypeScript** - Full type safety
- **Auto-Discovery** - Automatic node and tool discovery
- **Node Registry** - Extensible node system
- **Testing** - E2E tests with Playwright, Unit tests with Vitest
- **Hot Reload** - Fast development iteration

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **pnpm** (or npm/yarn)
- **MongoDB** (or Azure Cosmos DB)
- **Redis** (optional, for caching)
- **RabbitMQ** (optional, for message queue)

### Installation

```bash
# Clone the repository
git clone https://github.com/evalolabs/MonshyFlow.git
cd MonshyFlow

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Start all services
pnpm dev
```

The frontend will be available at `http://localhost:5173` and the API gateway at `http://localhost:5000`.

### Docker (Recommended)

```bash
# Start all services with Docker Compose
docker-compose up
```

See [Deployment Guide](./azure-deployment/README.md) for more details.

---

## 📁 Project Structure

```
MonshyFlow/
├── frontend/              # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/    # React Components
│   │   ├── pages/         # Route Pages
│   │   ├── services/      # API Services
│   │   └── utils/         # Utilities
│   └── e2e/               # E2E Tests (Playwright)
│
├── packages/              # Monorepo Packages
│   ├── api-service/       # API Gateway Service
│   ├── auth-service/      # Authentication Service
│   ├── execution-service/ # Workflow Execution Engine
│   ├── scheduler-service/ # Workflow Scheduler
│   ├── secrets-service/   # Secrets Management
│   └── shared/            # Shared Types & Utilities
│
├── kong/                  # Kong API Gateway Configuration
├── azure-deployment/      # Azure Deployment Scripts
└── analysis/             # System Analysis Documentation
```

---

## 🏗️ Architecture

MonshyFlow follows a **microservices architecture** optimized for Azure Container Apps:

- **API Gateway** (Kong) - Single entry point, rate limiting, authentication
- **Auth Service** - JWT-based authentication, user management
- **Execution Service** - Workflow execution engine with SSE for real-time updates
- **Scheduler Service** - Time-based workflow triggers
- **Secrets Service** - Secure credential storage with encryption
- **Frontend** - React 19 + TypeScript + React Flow

See [Analysis Documentation](./analysis/README.md) for detailed system analysis.

---

## 🎯 Use Cases

- **Business Process Automation** - Automate repetitive tasks
- **AI-Powered Workflows** - Combine AI agents with traditional automation
- **API Orchestration** - Connect multiple services in complex workflows
- **Data Processing** - Transform and process data between systems
- **Scheduled Tasks** - Run workflows on a schedule
- **Webhook Handlers** - Process incoming webhooks

---

## 📚 Documentation

- **[Frontend README](./frontend/README.md)** - Frontend setup and development
- **[Architecture](./ARCHITECTURE.md)** - System architecture overview
- **[Security](./SECURITY.md)** - Security features and best practices
- **[Deployment Guide](./azure-deployment/README.md)** - Deployment instructions
- **[Analysis](./analysis/README.md)** - System analysis documentation

---

## 🧪 Testing

```bash
# Frontend unit tests
cd frontend
pnpm test

# Frontend E2E tests
pnpm test:e2e

# Backend tests (if available)
cd packages/api-service
pnpm test
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) (coming soon) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [React Flow](https://reactflow.dev/) for the visual workflow editor
- Inspired by workflow automation platforms like n8n, Activepieces, and Zapier
- Powered by modern web technologies

---

## 📊 Status

**Current Version:** `0.1.0-alpha`

This is an **alpha release**. Some features may be incomplete or subject to change.

### Known Limitations

- If/Else Node UX could be improved
- Agent Tools/Functions documentation is incomplete
- Some advanced features are still in development

See [ALPHA_LAUNCH_CHECKLIST.md](./ALPHA_LAUNCH_CHECKLIST.md) for the current development status.

---

## 🔗 Links

- **GitHub Repository:** [https://github.com/evalolabs/MonshyFlow](https://github.com/evalolabs/MonshyFlow)
- **Issues:** [GitHub Issues](https://github.com/evalolabs/MonshyFlow/issues)
- **Discussions:** [GitHub Discussions](https://github.com/evalolabs/MonshyFlow/discussions) (coming soon)

---

**Made with ❤️ by the MonshyFlow Team**

