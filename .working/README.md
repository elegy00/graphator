# Working Directory

This directory contains work-in-progress documentation and requirements for ongoing development.

## Current Work: Database Migration

### Main Document
**[requirements.md](./requirements.md)** - Complete requirements for migrating to 3-container PostgreSQL architecture

**Status**: Planning phase

**Key Points**:
- Migrate from in-memory storage to PostgreSQL (NO TimescaleDB)
- Split into 3 containers: web, worker, database
- Reuse existing sensor discovery and HA API client code
- Target: Raspberry Pi 3 (ARMv7) compatibility
- Data retention: 30 days with hourly cleanup job

**Implementation Order**:
1. Database layer (repositories)
2. Database schema (migration SQL)
3. Worker container
4. Web container updates
5. Docker configuration
6. Cleanup and testing

### Files in This Directory

- `requirements.md` - Detailed migration requirements (current)
- (more files will be added as work progresses)

## Usage

This directory is for:
- Active work documentation
- Requirements gathering
- Implementation planning
- Temporary files during development

Once work is complete and merged, relevant documentation should be moved to:
- `docs/` - For permanent documentation
- `.ai/` - For architecture decisions
- Project root - For user-facing docs
