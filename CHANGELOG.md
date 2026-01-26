# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub-like features for public workflows (stars, comments, author info)
- Master-detail layout for public workflows page
- WorkflowComment model for comments
- Star/unstar functionality for public workflows
- Comment system with add/delete capabilities
- Author information display in public workflows

### Fixed
- ObjectId validation in getPublicWorkflows to prevent MongoDB errors
- TypeScript errors in WorkflowService and WorkflowRepository

## [0.1.0-alpha] - 2025-01-XX

### Added
- Initial alpha release
- Visual workflow builder with drag & drop interface
- 13+ node types (Start, Agent, LLM, HTTP, If/Else, While, ForEach, etc.)
- Real-time workflow execution with SSE
- Debug panel with variable tree
- Multi-tenant support
- Secrets management
- User management with RBAC
- API key management
- 50+ API integrations
- Workflow scheduling
- Webhook support
- Public workflow sharing and cloning
- GitHub-like features (stars, comments)

### Features
- **Workflow Builder**: Intuitive visual editor powered by React Flow
- **AI Integration**: Support for GPT-4, GPT-3.5, Claude, and more
- **Agent SDK**: Unique AI agent orchestration capabilities
- **Expression Engine**: Template syntax with `{{variable}}` support
- **Auto-Layout**: Smart workflow node positioning
- **Auto-Save**: Automatic workflow persistence

### Infrastructure
- Microservices architecture
- Docker Compose support
- Azure Container Apps ready
- Kong API Gateway integration
- MongoDB/Cosmos DB support
- Redis caching (optional)
- RabbitMQ message queue (optional)

---

## Version History

- **0.1.0-alpha**: Initial alpha release with core features

---

For detailed feature documentation, see [README.md](./README.md) and [docs/](./docs/).

