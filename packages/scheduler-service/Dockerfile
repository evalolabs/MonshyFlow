# Scheduler Service Dockerfile für Azure Container Apps
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY .npmrc ./

# Copy package files
COPY packages/core/package.json ./packages/core/
COPY packages/database/package.json ./packages/database/
COPY packages/auth/package.json ./packages/auth/
COPY packages/scheduler-service/package.json ./packages/scheduler-service/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY packages/core ./packages/core
COPY packages/database ./packages/database
COPY packages/auth ./packages/auth
COPY packages/scheduler-service ./packages/scheduler-service

# Build packages
RUN pnpm --filter @monshy/core build
RUN pnpm --filter @monshy/database build
RUN pnpm --filter @monshy/auth build
RUN pnpm --filter @monshy/scheduler-service build

# Expose port
EXPOSE 80

# Set environment
ENV NODE_ENV=production
ENV PORT=80

# Start the application
CMD ["node", "packages/scheduler-service/dist/src/index.js"]

