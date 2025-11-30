# CI/CD: Docker Image Building with GitHub Actions

## Overview

GitHub Actions automatically builds multi-architecture Docker images for all three platforms: `linux/amd64`, `linux/arm64`, and `linux/arm/v7` (Raspberry Pi 3).

## Workflow Location

`.github/workflows/docker-build.yml`

## Trigger Events

- **Push to main branch** → builds and tags as `latest`
- **Push to feature branches** → builds with branch name tag
- **Git tags** (e.g., `v1.0.0`) → creates semantic version tags
- **Manual dispatch** → can be triggered from GitHub UI

## Multi-Architecture Build

### Supported Platforms

1. **linux/amd64** - x86_64 systems
2. **linux/arm64** - ARM 64-bit (Pi 4, Apple Silicon)
3. **linux/arm/v7** - ARM 32-bit (Raspberry Pi 3) ⭐ Primary target

### How It Works

1. **QEMU** enables cross-platform emulation (builds ARM on x86 runners)
2. **Docker Buildx** handles multi-architecture builds
3. **GitHub Actions cache** speeds up subsequent builds (15min → 3-5min)
4. Single manifest created pointing to all architecture variants

### Required Secrets

Configure in GitHub repository settings:
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_TOKEN` - Docker Hub access token

## Image Tagging Strategy

- Push to `main`: `latest`, `main`
- Tag `v1.2.3`: `1.2.3`, `1.2`, `latest`
- Feature branch: `branch-name`
- Dedicated ARMv7 tag: `armv7`

## Adapting for 3-Container Architecture

Current workflow builds a single monolithic image. For the 3-container architecture:

### Option 1: Multi-Stage Dockerfile (Recommended)
Single Dockerfile with multiple build targets (web, worker). Update workflow to build each target separately with different tags.

### Option 2: Separate Dockerfiles
Create `Dockerfile.web` and `Dockerfile.worker`. Build each in separate workflow steps.

### Database Container
Use official TimescaleDB image - no custom build needed:
```yaml
image: timescale/timescaledb:latest-pg15
platform: linux/arm/v7
```

## Deployment Options

### Self-Hosted Runner on Pi
Install GitHub Actions runner on Raspberry Pi for automatic deployment after builds.

### SSH Deployment
Use GitHub Actions to SSH into Pi and pull latest images.

### Watchtower (Auto-Update)
Run Watchtower container on Pi to automatically pull and restart containers when new images are available.

## Local Testing

Test multi-arch builds locally before pushing:
```bash
docker buildx create --name builder --use
docker buildx build --platform linux/arm/v7 -t test:armv7 .
```

## Troubleshooting

**ARM build fails**: Check for ARM-incompatible npm packages
**Push fails**: Verify Docker Hub credentials in GitHub secrets
**Out of disk**: Add cleanup step: `docker system prune -af`

## Security

- Never commit credentials - use GitHub Secrets
- Consider adding Trivy vulnerability scanning
- Optional: Enable Docker Content Trust for image signing
