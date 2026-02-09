# Multi-stage build for MonshyFlow Frontend
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files from frontend
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy shared directory first (needed for apiIntegrations)
# Must be at ../shared relative to frontend
COPY shared/ ../shared/

# Copy frontend source code
COPY frontend/ ./

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_LOGO_PATH
ARG VITE_APP_NAME

# Set environment variables for build
# Default to empty string for production (relative URLs via Nginx)
# For local development, set VITE_API_URL=http://localhost:5000 explicitly
ENV VITE_API_URL=${VITE_API_URL:-}
ENV VITE_LOGO_PATH=${VITE_LOGO_PATH:-/logo.png}
ENV VITE_APP_NAME=${VITE_APP_NAME:-Monshy}

# Build application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ 2>&1 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

