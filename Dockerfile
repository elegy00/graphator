# Multi-architecture Dockerfile for Graphator
# Supports: linux/amd64 (x64) and linux/arm64 (ARM)
# Build with: docker buildx build --platform linux/amd64,linux/arm64 -t graphator:latest .

# Stage 1: Install development dependencies
FROM node:20-alpine AS development-dependencies-env
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
# Use fewer fetch retries and prefer offline cache for ARM builds
RUN npm ci --prefer-offline --no-audit --maxsockets=1

# Stage 2: Install production dependencies only
FROM node:20-alpine AS production-dependencies-env
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev --prefer-offline --no-audit --maxsockets=1

# Stage 3: Build the application
FROM node:20-alpine AS build-env
WORKDIR /app

# Copy source code
COPY . .

# Copy development dependencies from first stage
COPY --from=development-dependencies-env /app/node_modules ./node_modules

# Build the application
RUN npm run build

# Stage 4: Production runtime image
FROM node:20-alpine

# Set environment to production
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Copy production dependencies
COPY --from=production-dependencies-env /app/node_modules ./node_modules

# Copy built application
COPY --from=build-env /app/build ./build

# Copy any additional runtime configuration files if needed
# COPY .env.example .env.example

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["npm", "run", "start"]