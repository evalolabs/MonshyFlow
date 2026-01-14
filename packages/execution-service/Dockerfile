# Execution Service Dockerfile für Azure Container Apps
# Multi-stage build für optimale Größe

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY .npmrc ./

# Copy package files
COPY packages/core/package.json ./packages/core/
COPY packages/execution-service/package.json ./packages/execution-service/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY packages/core ./packages/core
COPY packages/execution-service ./packages/execution-service

# Build packages
RUN pnpm --filter @monshy/core build
RUN pnpm --filter execution-service build

# Stage 2: Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY .npmrc ./

# Copy package files
COPY packages/core/package.json ./packages/core/
COPY packages/execution-service/package.json ./packages/execution-service/

# Install pnpm
RUN npm install -g pnpm

# Copy the entire node_modules structure from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=builder /app/packages/execution-service/node_modules ./packages/execution-service/node_modules

# Copy built dist folders
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/execution-service/dist ./packages/execution-service/dist

# Expose port (docker-compose uses 5004, Azure Container Apps uses port 80)
EXPOSE 5004

# Set environment (PORT can be overridden by docker-compose)
ENV NODE_ENV=production
ENV PORT=5004

# Start the application
CMD ["node", "packages/execution-service/dist/index.js"]
