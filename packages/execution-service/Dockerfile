# Execution Service Dockerfile für Azure Container Apps
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY packages/execution-service/package*.json ./

# Install all dependencies (including dev for build step)
RUN npm ci

# Copy source code
COPY packages/execution-service/ .

# Build TypeScript
RUN npm run build

# Remove dev dependencies to keep runtime image slim
RUN npm prune --production

# Expose port
EXPOSE 5004

# Start the application
CMD ["npm", "start"]
