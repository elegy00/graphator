# Phase Completion Checklist

Quick reference for tracking progress through the implementation.

## Phase 1: Database Foundation ⏱️ 2-3 hours

**Status**: ✅ Complete

### Files to Create
- [x] `app/services/database/migrations/001_initial_schema.sql`
- [x] `app/services/database/postgresClient.ts`
- [x] `app/services/database/sensorRepository.ts`
- [x] `app/services/database/readingRepository.ts`
- [x] `app/services/database/migrate.ts`
- [x] `app/services/database/index.ts` (bonus - exports)
- [ ] `app/services/database/*.test.ts` (optional - can test manually first)

### Verification
- [x] PostgreSQL schema created (SQL file ready)
- [x] All repository methods implemented
- [x] TypeScript compilation passes
- [ ] Can insert/query via repositories (needs manual test)
- [x] No application code modified

**Checkpoint**: Can manually test repositories with local PostgreSQL

---

## Phase 2: Worker Container ⏱️ 2-3 hours

**Status**: ⬜ Not Started

### Files to Create
- [ ] `app/worker/index.ts`
- [ ] `.env.worker.example`
- [ ] Update `app/services/backgroundDataCollection.server.ts` (or create new version)

### Package.json Updates
- [ ] Add script: `"worker": "tsx app/worker/index.ts"`

### Verification
- [ ] Worker runs standalone
- [ ] Discovers sensors from HA
- [ ] Writes to `sensors` table
- [ ] Writes to `sensor_readings` table
- [ ] New readings every 60s
- [ ] Cleanup job works
- [ ] Graceful shutdown

**Checkpoint**: Worker runs standalone and populates database

---

## Phase 3: Web Container ⏱️ 1.5-2 hours

**Status**: ⬜ Not Started

### Files to Modify
- [ ] `app/routes/home.tsx` - Use repositories
- [ ] `app/routes/api.sensordata.$sensorId.ts` - Use repositories
- [ ] `.env.web.example` - Create

### Files to Mark Deprecated
- [ ] `app/services/storage/serverDataStore.server.ts` - Add DEPRECATED comment

### Verification
- [ ] Web displays sensors from DB
- [ ] Shows latest readings from DB
- [ ] Auto-refresh works
- [ ] API endpoints return DB data
- [ ] Works when worker stopped (stale data)
- [ ] New data when worker running
- [ ] No TypeScript errors

**Checkpoint**: Web reads from database, worker writes to database

---

## Phase 4: Docker Integration ⏱️ 2-3 hours

**Status**: ⬜ Not Started

### Files to Create
- [ ] `Dockerfile.worker`
- [ ] `Dockerfile.web`
- [ ] `docker-compose.yml`
- [ ] `docker/postgres/postgresql.conf`
- [ ] `docker/init-db.sh`
- [ ] `.env.example`
- [ ] `.dockerignore`

### Verification
- [ ] All 3 containers build
- [ ] Stack starts without errors
- [ ] Migrations run automatically
- [ ] Worker collects data
- [ ] Web serves data
- [ ] Data persists across restarts
- [ ] Memory limits respected
- [ ] Health checks pass
- [ ] Works on Pi 3 (if tested)

**Checkpoint**: Full 3-container stack works with docker-compose

---

## Phase 5: Cleanup & Documentation ⏱️ 1-2 hours

**Status**: ⬜ Not Started

### Files to Delete
- [ ] `app/services/storage/serverDataStore.server.ts`
- [ ] `app/services/storage/inMemoryStore.ts`
- [ ] `app/server.init.ts`

### Files to Update
- [ ] `CLAUDE.md` - Update architecture
- [ ] `README.md` - Update quick start
- [ ] `docs/TARGET_ENVIRONMENT.md` - Add PostgreSQL details
- [ ] `.gitignore` - Add .env patterns

### Files to Create
- [ ] `docs/DEPLOYMENT.md`
- [ ] `.working/TESTING_CHECKLIST.md`

### Verification
- [ ] No deprecated code used
- [ ] Documentation accurate
- [ ] All tests pass
- [ ] TypeScript compiles
- [ ] Fresh install works
- [ ] 24h stability test
- [ ] Performance acceptable
- [ ] Deployment guide complete

**Checkpoint**: Production-ready system with complete documentation

---

## Overall Progress

- [ ] Phase 1 Complete
- [ ] Phase 2 Complete
- [ ] Phase 3 Complete
- [ ] Phase 4 Complete
- [ ] Phase 5 Complete

**Total Phases Completed**: 0 / 5

---

## Final Success Criteria

From requirements.md - all must be checked:

- [ ] Worker discovers sensors from Home Assistant
- [ ] Worker writes sensor metadata to `sensors` table
- [ ] Worker collects readings every 60s and writes to `sensor_readings` table
- [ ] Worker re-discovers sensors every 5 minutes
- [ ] Worker deletes data older than 30 days every hour
- [ ] Web server displays all sensors in card grid
- [ ] Sensor cards show current temperature and humidity values
- [ ] Sensor cards auto-refresh every 10 seconds
- [ ] Data persists after `docker compose restart`
- [ ] All containers respect memory limits (Pi 3 compatible)
- [ ] Worker logs clearly show collection progress
- [ ] No TimescaleDB dependency
- [ ] Existing sensor discovery logic reused (not rewritten)

---

## Notes

Use this checklist to track progress. Update status as you complete each phase:
- ⬜ Not Started
- 🔄 In Progress
- ✅ Complete
- ❌ Blocked (note issue)
