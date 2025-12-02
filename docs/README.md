# Graphator Documentation

This directory contains project documentation organized by purpose.

## 🔒 Project Guidelines (DO NOT EDIT)

### [ENGINEERING_PRACTICES.MD](./ENGINEERING_PRACTICES.MD)
**Code standards, development practices, and team processes**

**⚠️ Claude Code is NOT permitted to edit this file**

Contains project-specific rules for:
- Test Driven Development (TDD) requirements
- Code quality and simplicity standards
- Naming conventions (avoid implementation details, temporal references)
- Comment guidelines (ABOUTME headers, no temporal context)
- Systematic debugging process
- Issue tracking with TodoWrite
- Memory/journal management

**Read this** for understanding project standards and practices.

---

### [RELATIONSHIP.md](./RELATIONSHIP.md)
**Project-specific relationship rules and collaboration guidelines**

**⚠️ Claude Code is NOT permitted to edit this file**

Currently empty - reserved for relationship and collaboration rules specific to this project.

---

## 📚 Deployment & Operations

### [TARGET_ENVIRONMENT.md](./TARGET_ENVIRONMENT.md)
**Raspberry Pi 3/3+ Deployment Guide**

Complete reference for deploying to ARMv7 hardware:
- Hardware specs and constraints (1GB RAM, ARMv7)
- Docker platform configuration
- Memory optimization and PostgreSQL tuning
- Compatible vs incompatible npm packages
- Storage optimization (SD card vs SSD)
- Thermal management and performance expectations

**Read this when**:
- Deploying to Raspberry Pi 3/3+
- Troubleshooting ARM compatibility issues
- Choosing npm packages
- Understanding why TailwindCSS v4 is blocked

---

### [CI_CD.md](./CI_CD.md)
**GitHub Actions Multi-Architecture Builds**

Guide to automated Docker image pipeline:
- Multi-arch builds (amd64, arm64, armv7)
- Workflow triggers and tagging strategy
- Deployment automation options
- Local testing and troubleshooting

**Read this when**:
- Modifying the build pipeline
- Adding new containers
- Setting up deployment automation
- Debugging build failures

---

## Quick Links

**Main Documentation**
- [../CLAUDE.md](../CLAUDE.md) - Primary guide for Claude Code
- [../README.md](../README.md) - Project overview and quick start

**Architecture & Requirements**
- [../.ai/requirements.md](../.ai/requirements.md) - Detailed feature requirements

**Docker**
- [../DOCKER.md](../DOCKER.md) - Comprehensive Docker deployment guide
