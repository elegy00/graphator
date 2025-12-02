# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🔴 CRITICAL: Required Reading

**Before starting ANY work, you MUST read and follow these files:**

### `docs/ENGINEERING_PRACTICES.MD` 🔒 DO NOT EDIT
**When**: Read BEFORE writing any code, tests, or documentation
**Purpose**: Defines how to write code, tests, comments, and debug issues in this project

**Contains**:
- Test Driven Development (TDD) - REQUIRED for all features/bugfixes
- Code quality standards (YAGNI, simplicity, avoid duplication)
- Naming conventions (no implementation details, no temporal references)
- Comment rules (ABOUTME headers, no "new"/"old"/"improved" language)
- Systematic debugging process (ALWAYS find root cause)
- TodoWrite usage requirements

**⚠️ You are NOT ALLOWED to edit this file - only follow its rules**

### `docs/RELATIONSHIP.md` 🔒 DO NOT EDIT
**When**: Read at the start of every session
**Purpose**: Defines collaboration style and relationship rules specific to this project

**Currently**: Empty - reserved for future relationship guidelines

**⚠️ You are NOT ALLOWED to edit this file - only follow its rules**

---

## 📚 Additional Documentation (Read as Needed)

### `docs/TARGET_ENVIRONMENT.md`
**When to read**:
- Before making dependency changes (adding/updating npm packages)
- When deploying to Raspberry Pi 3/3+
- When troubleshooting memory issues
- When encountering ARM compatibility errors
- When considering TailwindCSS upgrades

**Purpose**: Raspberry Pi 3/3+ deployment constraints and optimizations

**Contains**: Hardware specs (1GB RAM, ARMv7), memory limits, compatible packages, PostgreSQL tuning, storage optimization

### `docs/CI_CD.md`
**When to read**:
- Before modifying Dockerfiles
- When adding new containers to the architecture
- When build pipeline fails
- When setting up deployment automation
- Before creating multi-architecture builds

**Purpose**: GitHub Actions pipeline and Docker builds

**Contains**: Multi-arch build process, workflow triggers, deployment options, troubleshooting

### `docs/README.md`
**When to read**: When you need to understand the documentation structure

**Purpose**: Index of all documentation with clear descriptions

## Project Overview

Graphator is a real-time sensor monitoring application that fetches temperature and humidity data from Home Assistant and displays current sensor values.

**Architecture**: 3-container microservices (web, worker, database)
**Target Platform**: Raspberry Pi 3/3+ (ARMv7)
**Framework**: React Router v7 with SSR
**Database**: PostgreSQL 15 + TimescaleDB

## Quick Start

```bash
# Development
npm install
npm run dev              # http://localhost:5173

# Type checking
npm run typecheck

# Testing
npm test
npm run test:ui

# Docker
docker compose up -d     # Start all 3 containers
docker compose logs -f   # View logs
```

## Architecture Overview

### 3-Container Design

1. **graphator-web** - React Router v7 SSR application serving UI and API
2. **graphator-worker** - Background service collecting sensor data every 60s
3. **graphator-db** - PostgreSQL + TimescaleDB with persistent volumes

**Data Flow**: Worker → Database ← Web Server → Users

### Database Schema

**Sensors table**: Stores sensor metadata (id, friendly_name, type, unit, status)
**Sensor readings table**: TimescaleDB hypertable with 30-day retention (sensor_id, timestamp, temperature, humidity)

**See full details**: Architecture diagram and schema in CLAUDE.md (this file, section removed - refer to git history if needed)

## Project Structure

```
app/
├── components/          # React components
├── routes/              # React Router routes with loaders
├── services/
│   ├── api/            # Home Assistant API client
│   ├── database/       # PostgreSQL repositories (TO BE CREATED)
│   ├── storage/        # In-memory stores (DEPRECATED - being replaced)
│   └── backgroundDataCollection.server.ts
├── types/              # TypeScript definitions
├── worker/             # Worker container entry point (TO BE CREATED)
└── root.tsx            # Web container entry point
```

## Environment Variables

**Web**: `DATABASE_URL`, `PORT`, `NODE_ENV`
**Worker**: `HOME_ASSISTANT_URL`, `HOME_ASSISTANT_TOKEN`, `DATABASE_URL`, `COLLECTION_INTERVAL_MS`
**Database**: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

## Technology Stack

**Web**: React Router v7, TypeScript, TailwindCSS v3, TanStack Query
**Worker**: Node.js 20, TypeScript, node-postgres
**Database**: PostgreSQL 15 (standard, no TimescaleDB)
**Testing**: Vitest, @testing-library/react

## Key Development Patterns

### Server-Side Code
- Files with `.server.ts` suffix are server-only (never sent to client)
- Use database repositories for all data access (replacing in-memory `serverDataStore`)
- Worker runs independently - shares database with web container

### Database Layer
- All queries through repository pattern (`app/services/database/`)
- Use parameterized queries (prevent SQL injection)
- Connection pooling managed by `postgresClient.ts`

### Adding Features
1. Add route in `app/routes/` with loader using database queries
2. Create/update database repositories as needed
3. Handle errors gracefully with user-friendly messages
4. Test worker separately from web container

### Data Display
- Sensor cards show current temperature and humidity values
- Auto-refresh every 10 seconds via loader revalidation
- Grid layout responsive to screen size

## Docker Commands

```bash
# All containers
docker compose up -d
docker compose down
docker compose logs -f

# Specific containers
docker compose logs -f graphator-worker
docker compose logs -f graphator-web
docker compose restart graphator-worker

# Build for Raspberry Pi 3
npm run docker:build:armv7
```

## Raspberry Pi 3 Deployment

**Critical Constraints**:
- All images must use `platform: linux/arm/v7`
- Total memory budget: ~900MB (256+256+384)
- TailwindCSS v3 ONLY (v4 incompatible with ARMv7)
- PostgreSQL must be tuned for 1GB RAM

**📖 Full details**: See [docs/TARGET_ENVIRONMENT.md](docs/TARGET_ENVIRONMENT.md)

## CI/CD

GitHub Actions automatically builds multi-arch images (amd64, arm64, armv7) on push to main or tags.

**📖 Full details**: See [docs/CI_CD.md](docs/CI_CD.md)

## File Naming Conventions

- `*.server.ts` - Server-only code
- `*.test.ts` - Vitest tests
- `*.tsx` - React components
- `+types/*.ts` - Generated route types

## Common Tasks

**Run single test**: `npm test -- path/to/test.test.ts`
**Type check**: `npm run typecheck` (runs typegen + tsc)
**View logs**: Check prefixes - `[Worker]`, `[DataCollection]`, `[SensorDiscovery]`, `[Database]`

## Complete Documentation Index

### 🔒 Required Reading (ALWAYS Follow, NEVER Edit)
| File | When to Read | Purpose |
|------|-------------|---------|
| **`docs/ENGINEERING_PRACTICES.MD`** | Before ANY code/test/doc work | Code standards, TDD requirements, naming, debugging |
| **`docs/RELATIONSHIP.md`** | Start of every session | Collaboration and relationship rules |

### 📋 Architecture & Requirements (Read When Implementing Features)
| File | When to Read | Purpose |
|------|-------------|---------|
| `.ai/requirements.md` | Before implementing features | Detailed functional requirements and acceptance criteria |
| `README.md` | For project overview | Quick start guide and feature list |

### 🚀 Deployment & Operations (Read When Deploying or Changing Infrastructure)
| File | When to Read | Purpose |
|------|-------------|---------|
| **`docs/TARGET_ENVIRONMENT.md`** | Before adding dependencies, deploying to Pi, memory issues | Pi 3 constraints, compatible packages, memory limits |
| **`docs/CI_CD.md`** | Before modifying Dockerfiles, fixing builds, deployment setup | GitHub Actions workflow, multi-arch builds |
| `DOCKER.md` | When setting up Docker deployment | Comprehensive Docker deployment guide |
| **`docs/README.md`** | When navigating documentation | Index and overview of all docs |

## Project-Specific Guidelines

**Sensor Discovery**: Auto-discovered from Home Assistant `/api/states`, filtered by device_class (temperature/humidity). Re-discovery every 5 minutes.

**Data Retention**: PostgreSQL with 30-day window. TimescaleDB handles automatic retention. Fallback: worker runs hourly cleanup.

**SSR**: Enabled in `react-router.config.ts`. Use loaders for data fetching, not `useEffect`. Handle hydration correctly.

**Testing**: Vitest with jsdom. Setup in `app/test/setup.ts`. **MUST follow TDD practices** per `docs/ENGINEERING_PRACTICES.MD`.

---

## 📖 How to Use This Documentation

**Every time you start work:**
1. ✅ Read `docs/ENGINEERING_PRACTICES.MD` - Follow ALL rules (TDD, naming, comments, debugging)
2. ✅ Read `docs/RELATIONSHIP.md` - Follow collaboration guidelines
3. 📋 Check relevant docs from tables above based on your task
4. 🚀 Refer to this CLAUDE.md for quick reference during work

**Remember**: `ENGINEERING_PRACTICES.MD` and `RELATIONSHIP.md` are **ALWAYS required** - all other docs are task-specific.
