# MonshyFlow Architecture

## Overview

MonshyFlow is a microservices-based workflow automation platform designed for scalability, maintainability, and cloud deployment.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                    http://localhost:5173                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Kong API Gateway                         │
│                    http://localhost:8000                    │
│              (Rate Limiting, Authentication)                 │
└───────────┬───────────┬───────────┬───────────┬────────────┘
            │           │           │           │
    ┌───────▼───┐ ┌─────▼────┐ ┌───▼────┐ ┌───▼──────┐
    │   API     │ │   Auth   │ │ Secrets│ │Scheduler │
    │  Service  │ │ Service  │ │ Service│ │ Service  │
    │  :5000    │ │  :5001   │ │ :5004  │ │  :5003   │
    └─────┬─────┘ └──────────┘ └────────┘ └──────────┘
          │
    ┌─────▼─────────────┐
    │  Execution        │
    │  Service          │
    │  :5002            │
    │  (SSE Streaming)  │
    └───────────────────┘
            │
    ┌───────┴───────────┐
    │                   │
┌───▼────┐        ┌─────▼────┐
│ MongoDB│        │  Redis   │
│ :27017 │        │  :6379   │
└────────┘        └──────────┘
```

## Microservices

### API Service
- **Port**: 5000
- **Purpose**: Main API gateway and workflow management
- **Responsibilities**:
  - Workflow CRUD operations
  - User management
  - Tenant management
  - Orchestrates other services

### Auth Service
- **Port**: 5001
- **Purpose**: Authentication and authorization
- **Responsibilities**:
  - JWT token generation/validation
  - User authentication
  - API key management
  - Role-based access control

### Execution Service
- **Port**: 5002
- **Purpose**: Workflow execution engine
- **Responsibilities**:
  - Executes workflows
  - Node processing
  - Real-time updates via SSE
  - Expression evaluation

### Scheduler Service
- **Port**: 5003
- **Purpose**: Time-based workflow triggers
- **Responsibilities**:
  - Cron job scheduling
  - Scheduled workflow execution
  - Timezone handling

### Secrets Service
- **Port**: 5004
- **Purpose**: Secure credential storage
- **Responsibilities**:
  - Encrypted secret storage
  - Tenant-isolated secrets
  - Secret retrieval for workflows

## Data Storage

### MongoDB
- Primary database for all services
- Stores: workflows, users, tenants, secrets, audit logs
- Multi-tenant isolation at application level

### Redis (Optional)
- Caching layer
- Session storage
- Rate limiting counters

### RabbitMQ (Optional)
- Message queue for async processing
- Workflow execution queue
- Event distribution

## Frontend

### Technology Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **React Flow** - Visual workflow editor
- **Vite** - Build tool
- **Tailwind CSS** - Styling

### Key Features
- Visual workflow builder
- Real-time execution monitoring
- Debug panel with variable tree
- Multi-tenant UI isolation

## Security

### Authentication
- JWT-based authentication
- Token expiration and refresh
- API key support

### Authorization
- Role-based access control (RBAC)
- Multi-tenant isolation
- Resource-level permissions

### Data Protection
- Secrets encryption at rest
- Tenant data isolation
- Secure inter-service communication

## Deployment

### Local Development
- Docker Compose for all services
- Hot reload for development
- Local MongoDB and Redis

### Production (Azure)
- Azure Container Apps
- Azure Cosmos DB (MongoDB API)
- Azure Redis Cache
- Azure Key Vault for secrets

## Communication Patterns

### Synchronous
- REST APIs for CRUD operations
- Direct service-to-service calls
- Request/Response pattern

### Asynchronous
- Server-Sent Events (SSE) for real-time updates
- Message queue for background jobs
- Event-driven architecture

## Scalability

### Horizontal Scaling
- Stateless services
- Load balancing via Kong
- Database sharding support

### Performance
- Redis caching
- Connection pooling
- Efficient database queries
- SSE for real-time updates

## Development

### Monorepo Structure
```
MonshyFlow/
├── frontend/          # React frontend
├── packages/          # Shared packages
│   ├── core/          # Core utilities
│   ├── database/      # Database models
│   ├── auth/          # Auth utilities
│   └── [services]/    # Microservices
├── shared/            # Shared resources
└── docs/              # Documentation
```

### Technology Choices
- **TypeScript** - Type safety across stack
- **pnpm** - Fast, efficient package management
- **Docker** - Containerization
- **Kong** - API Gateway

## Future Considerations

- GraphQL API (optional)
- WebSocket support for bi-directional communication
- Advanced caching strategies
- Multi-region deployment
- Service mesh (Istio/Linkerd)

---

For more details, see:
- [Deployment Guide](./azure-deployment/README.md)
- [Node Development Guide](./docs/NODE_DEVELOPMENT_GUIDE.md)
- [Main README](./README.md)

