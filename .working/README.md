# Working Directory

This directory contains work-in-progress documentation and requirements for ongoing development.

## Current Work: Database Migration to 3-Container Architecture

**Status**: 📋 Planning Complete - Ready for Implementation

## 📚 Documentation Files

### Core Documents

1. **[requirements.md](./requirements.md)** (14KB)
   - Complete technical requirements
   - Database schema design
   - Container responsibilities
   - API specifications
   - Success criteria

2. **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** (777 lines) ⭐ **START HERE**
   - 5-phase implementation plan
   - Detailed verification steps for each phase
   - Timeline estimates (8-13 hours total)
   - Rollback procedures
   - Clear checkpoints for review

3. **[PHASE_CHECKLIST.md](./PHASE_CHECKLIST.md)**
   - Quick progress tracker
   - Checkbox lists for each phase
   - Files to create/modify/delete
   - Status tracking

4. **[CHANGELOG.md](./CHANGELOG.md)**
   - Recharts removal log
   - Changes made to simplify app
   - Historical reference

## 🎯 Quick Start

**To begin implementation**:

1. Read `IMPLEMENTATION_PLAN.md` - understand the 5 phases
2. Use `PHASE_CHECKLIST.md` - track your progress
3. Refer to `requirements.md` - for technical details
4. Start with **Phase 1: Database Foundation**

## 📊 Implementation Phases

| Phase | Focus | Duration | Checkpoint |
|-------|-------|----------|------------|
| **1** | Database layer & repositories | 2-3h | Repositories work with test DB |
| **2** | Worker container (standalone) | 2-3h | Worker writes to DB |
| **3** | Web reads from DB | 1.5-2h | Web displays DB data |
| **4** | Docker integration | 2-3h | Full stack in docker-compose |
| **5** | Cleanup & documentation | 1-2h | Production-ready |

**Total**: 8-13 hours

## 🎯 Key Decisions

- ✅ NO TimescaleDB (keep it simple)
- ✅ Reuse existing sensor discovery code
- ✅ PostgreSQL 15 standard
- ✅ 30-day retention with hourly cleanup
- ✅ ARMv7 compatible (Raspberry Pi 3)
- ✅ Memory limits: 256MB web, 256MB worker, 384MB DB

## 📝 After Each Phase

Update `PHASE_CHECKLIST.md` with:
- ⬜ Not Started → 🔄 In Progress → ✅ Complete
- Check off completed items
- Note any blockers or issues
- Get review/approval before next phase

## 🗂️ File Organization

Once implementation is complete, move:
- Production docs → `../docs/`
- Architecture decisions → `../.ai/`
- User guides → `../README.md`
- Keep this directory for future work

## 💡 Usage Notes

This directory is for:
- ✅ Active work-in-progress
- ✅ Implementation planning
- ✅ Progress tracking
- ✅ Temporary development docs

NOT for:
- ❌ Production documentation
- ❌ Public-facing guides
- ❌ Long-term storage
