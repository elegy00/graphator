# Docker Deployment Guide

This guide explains how to build and run Graphator using Docker, with support for both **x64 (AMD64)** and **ARM** architectures.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Building Docker Images](#building-docker-images)
   - [Single Architecture Builds](#single-architecture-builds)
   - [Multi-Architecture Builds](#multi-architecture-builds)
4. [Running the Container](#running-the-container)
5. [Docker Compose](#docker-compose)
6. [Environment Variables](#environment-variables)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Quick Start

```bash
# Build for your current architecture
docker build -t graphator:latest .

# Run the container
docker run -d \
  --name graphator \
  -p 3000:3000 \
  --env-file .env \
  graphator:latest
```

Access the application at `http://localhost:3000`

---

## Prerequisites

### Required
- **Docker**: Version 20.10 or higher
- **Docker Buildx**: For multi-architecture builds (included in Docker Desktop)

### Check Your Installation
```bash
# Check Docker version
docker --version

# Check if buildx is available
docker buildx version
```

---

## Building Docker Images

### Single Architecture Builds

Build for your **current system architecture** (faster, recommended for development):

```bash
# Build for current architecture
docker build -t graphator:latest .

# Build with specific tag
docker build -t graphator:1.0.0 .

# Build with custom name
docker build -t myregistry/graphator:latest .
```

**Build for specific architecture explicitly:**

```bash
# For x64/AMD64 systems
docker build --platform linux/amd64 -t graphator:amd64 .

# For ARM systems (Raspberry Pi, Apple Silicon, etc.)
docker build --platform linux/arm64 -t graphator:arm64 .
```

---

### Multi-Architecture Builds

Build images that work on **both x64 and ARM** systems using Docker Buildx.

#### Step 1: Create a Buildx Builder

```bash
# Create a new builder instance (one-time setup)
docker buildx create --name graphator-builder --use

# Verify the builder
docker buildx inspect graphator-builder --bootstrap
```

#### Step 2: Build Multi-Architecture Images

**Option A: Build and Load Locally (Single Architecture)**

You can only load one architecture at a time to your local Docker:

```bash
# Build for your current architecture and load to Docker
docker buildx build --platform linux/amd64 --load -t graphator:latest .
```

**Option B: Build and Push to Registry (Multi-Architecture)**

Build for multiple architectures and push to a registry:

```bash
# Build for both x64 and ARM, push to Docker Hub
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t yourusername/graphator:latest \
  -t yourusername/graphator:1.0.0 \
  --push \
  .
```

**Option C: Build and Export to Local Files**

Build for multiple architectures and save as tar files:

```bash
# Build for both architectures and export
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t graphator:latest \
  --output type=docker,dest=./graphator-images.tar \
  .

# Load the image
docker load -i graphator-images.tar
```

---

### Build Arguments and Optimization

**Using build cache for faster builds:**

```bash
# Enable inline cache
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --cache-from type=registry,ref=yourusername/graphator:buildcache \
  --cache-to type=registry,ref=yourusername/graphator:buildcache,mode=max \
  -t yourusername/graphator:latest \
  --push \
  .
```

**No-cache build (clean build):**

```bash
docker build --no-cache -t graphator:latest .
```

---

## Running the Container

### Basic Run

```bash
docker run -d \
  --name graphator \
  -p 3000:3000 \
  graphator:latest
```

### Run with Environment Variables

**Option 1: Using .env file**

Create a `.env` file:
```env
HOME_ASSISTANT_URL=http://homeassistant.local:8123
HOME_ASSISTANT_TOKEN=your_bearer_token_here
PORT=3000
```

Run with env file:
```bash
docker run -d \
  --name graphator \
  -p 3000:3000 \
  --env-file .env \
  graphator:latest
```

**Option 2: Using -e flags**

```bash
docker run -d \
  --name graphator \
  -p 3000:3000 \
  -e HOME_ASSISTANT_URL=http://homeassistant.local:8123 \
  -e HOME_ASSISTANT_TOKEN=your_token \
  graphator:latest
```

### Run with Custom Port

```bash
# Map container port 3000 to host port 8080
docker run -d \
  --name graphator \
  -p 8080:3000 \
  graphator:latest
```

### Run with Restart Policy

```bash
docker run -d \
  --name graphator \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env \
  graphator:latest
```

---

## Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  graphator:
    build:
      context: .
      dockerfile: Dockerfile
    image: graphator:latest
    container_name: graphator
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - HOME_ASSISTANT_URL=${HOME_ASSISTANT_URL}
      - HOME_ASSISTANT_TOKEN=${HOME_ASSISTANT_TOKEN}
    # Or use env_file:
    # env_file:
    #   - .env
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

### Docker Compose Commands

```bash
# Build and start
docker compose up -d

# Build without cache
docker compose build --no-cache

# View logs
docker compose logs -f graphator

# Stop
docker compose down

# Stop and remove volumes
docker compose down -v
```

---

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Node environment | `production` | No |
| `PORT` | Server port | `3000` | No |
| `HOME_ASSISTANT_URL` | Home Assistant instance URL | - | Yes |
| `HOME_ASSISTANT_TOKEN` | Home Assistant API token | - | Yes |

### Example .env File

```env
# Home Assistant Configuration
HOME_ASSISTANT_URL=http://192.168.1.100:8123
HOME_ASSISTANT_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# Application Configuration
PORT=3000
NODE_ENV=production
```

---

## Useful Docker Commands

### Container Management

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# Stop container
docker stop graphator

# Start container
docker start graphator

# Restart container
docker restart graphator

# Remove container
docker rm graphator

# Remove container forcefully
docker rm -f graphator
```

### Logs and Debugging

```bash
# View logs
docker logs graphator

# Follow logs in real-time
docker logs -f graphator

# View last 100 lines
docker logs --tail 100 graphator

# Execute command in running container
docker exec -it graphator sh

# Check container health
docker inspect --format='{{.State.Health.Status}}' graphator
```

### Image Management

```bash
# List images
docker images

# Remove image
docker rmi graphator:latest

# Remove unused images
docker image prune

# Remove all unused data
docker system prune -a
```

---

## Pushing to Docker Registries

### Docker Hub

```bash
# Login
docker login

# Tag image
docker tag graphator:latest yourusername/graphator:latest
docker tag graphator:latest yourusername/graphator:1.0.0

# Push
docker push yourusername/graphator:latest
docker push yourusername/graphator:1.0.0

# Push multi-arch (using buildx)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t yourusername/graphator:latest \
  --push \
  .
```

### GitHub Container Registry

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag
docker tag graphator:latest ghcr.io/username/graphator:latest

# Push
docker push ghcr.io/username/graphator:latest

# Push multi-arch
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/username/graphator:latest \
  --push \
  .
```

### Private Registry

```bash
# Login
docker login registry.example.com

# Tag
docker tag graphator:latest registry.example.com/graphator:latest

# Push
docker push registry.example.com/graphator:latest
```

---

## Troubleshooting

### Build Fails

**Problem**: Dependencies fail to install

```bash
# Try clean build without cache
docker build --no-cache -t graphator:latest .

# Check if package-lock.json exists
ls -la package-lock.json
```

**Problem**: Buildx not found

```bash
# Install buildx (if not included in Docker)
docker buildx install

# Or use Docker Desktop which includes buildx
```

### Container Won't Start

**Check logs:**
```bash
docker logs graphator
```

**Common issues:**
- Missing environment variables
- Port already in use
- Incorrect Home Assistant URL/token

**Check if port is in use:**
```bash
# Linux/Mac
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

### Multi-Architecture Issues

**Problem**: Image doesn't work on ARM/x64

```bash
# Check image architecture
docker inspect graphator:latest | grep Architecture

# Verify you built for correct platform
docker buildx imagetools inspect yourusername/graphator:latest
```

### Performance Issues

**ARM builds are slow:**
- ARM builds on x64 systems use QEMU emulation and are slower
- Build natively on ARM hardware when possible
- Use a registry and pull pre-built images

---

## Best Practices

### Security

1. **Never commit .env files** with real credentials
2. **Use secrets management** for production:
   ```bash
   docker secret create ha_token ./token.txt
   ```
3. **Scan images for vulnerabilities**:
   ```bash
   docker scan graphator:latest
   ```

### Performance

1. **Use specific Node version tags** (e.g., `node:20.11-alpine`)
2. **Leverage build cache** by copying package files first
3. **Use .dockerignore** to exclude unnecessary files
4. **Use multi-stage builds** to keep final image small

### Production Deployment

1. **Always use restart policy**:
   ```yaml
   restart: unless-stopped
   ```

2. **Set resource limits**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 512M
   ```

3. **Health checks are critical**:
   ```yaml
   healthcheck:
     test: ["CMD", "node", "-e", "..."]
   ```

4. **Use specific version tags**, not `latest`:
   ```bash
   docker pull graphator:1.0.0
   ```

---

## Architecture Support

### Supported Platforms

| Platform | Architecture | Status | Use Case |
|----------|-------------|--------|----------|
| `linux/amd64` | x86_64 | ✅ Fully Supported | Standard servers, desktops |
| `linux/arm64` | ARM 64-bit | ✅ Fully Supported | Raspberry Pi 4, Apple Silicon, AWS Graviton |
| `linux/arm/v7` | ARM 32-bit | ⚠️ Untested | Raspberry Pi 3, older ARM devices |

### Testing Multi-Architecture

```bash
# Build for specific platform
docker buildx build --platform linux/arm64 -t graphator:arm64 --load .

# Run with platform specification
docker run --platform linux/arm64 graphator:arm64
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Image

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: |
            yourusername/graphator:latest
            yourusername/graphator:${{ github.ref_name }}
```

---

## Support

For issues or questions:
- Check logs: `docker logs graphator`
- Review environment variables
- Verify network connectivity to Home Assistant
- Check Docker version compatibility

---

## License

This Docker configuration is part of the Graphator project.
