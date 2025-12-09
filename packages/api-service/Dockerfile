# API Service Dockerfile für Azure Container Apps
# Enthält: Workflow Management + Gateway Routing
# Multi-stage build für optimale Größe und korrekte native Module

# Stage 1: Build stage mit allen Build-Tools
FROM node:20-alpine AS builder

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY .npmrc ./

# Copy package files
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/auth/package.json ./packages/auth/
COPY packages/api-service/package.json ./packages/api-service/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Explicitly rebuild bcrypt to ensure native bindings are compiled
# Navigate to bcrypt package and rebuild it
RUN cd /app/node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt && \
    npm rebuild bcrypt || \
    (npm install --build-from-source || true)

# Copy source code
COPY packages/core ./packages/core
COPY packages/database ./packages/database
COPY packages/auth ./packages/auth
COPY packages/api-service ./packages/api-service

# Build packages
RUN pnpm --filter @monshy/core build
RUN pnpm --filter @monshy/database build
RUN pnpm --filter @monshy/auth build
RUN pnpm --filter @monshy/api-service build

# Stage 2: Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY .npmrc ./

# Copy package files
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/auth/package.json ./packages/auth/
COPY packages/api-service/package.json ./packages/api-service/

# Install pnpm
RUN npm install -g pnpm

# Copy the entire node_modules structure from builder
# This includes all compiled native modules (like bcrypt)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core/node_modules ./packages/core/node_modules
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=builder /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=builder /app/packages/api-service/node_modules ./packages/api-service/node_modules

# Copy built dist folders
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/auth/dist ./packages/auth/dist
COPY --from=builder /app/packages/api-service/dist ./packages/api-service/dist

# Expose port (Azure Container Apps uses port 80)
EXPOSE 80

# Set environment
ENV NODE_ENV=production
ENV PORT=80

# Start the application
CMD ["node", "packages/api-service/dist/src/index.js"]
