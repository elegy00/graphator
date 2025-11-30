# Target Environment: Raspberry Pi 3/3+ Deployment

## Hardware Specifications

| Component | Pi 3/3B+ | Impact |
|-----------|----------|--------|
| **CPU** | ARM Cortex-A53 ARMv7, 4-core @ 1.2-1.4 GHz | Must use `linux/arm/v7` images |
| **RAM** | 1 GB LPDDR2 | Strict memory limits required |
| **Architecture** | 32-bit ARMv7 | Limited npm package support |
| **Storage** | MicroSD or USB | I/O bottleneck - use fast storage |
| **Network** | 100 Mbps (3) / 300 Mbps (3B+) | Adequate for sensor monitoring |

## Recommended Hardware

- **Model**: Raspberry Pi 3B+ (better network/CPU than 3)
- **Storage**: Class 10 UHS-I (U3) microSD or external USB SSD
- **Power**: Official 2.5A supply (critical for stability)
- **Cooling**: Heatsinks or fan for 24/7 operation

## Docker Platform Configuration

**Critical**: All containers must explicitly specify ARMv7 platform:

```yaml
services:
  graphator-web:
    platform: linux/arm/v7
  graphator-worker:
    platform: linux/arm/v7
  graphator-db:
    platform: linux/arm/v7
```

Without explicit platform specification, Docker may pull wrong architecture images.

## Memory Constraints

Total available: 1GB. Recommended allocation:

| Container | Memory Limit | Reservation |
|-----------|--------------|-------------|
| Web | 256 MB | 128 MB |
| Worker | 256 MB | 128 MB |
| Database | 384 MB | 256 MB |
| **Total** | **896 MB** | **512 MB** |
| OS overhead | ~128 MB | - |

### PostgreSQL Configuration

Key settings for 1GB RAM environment:
- `shared_buffers = 128MB`
- `effective_cache_size = 256MB`
- `work_mem = 4MB`
- `max_connections = 20`

### Node.js Configuration

Set heap limits to prevent OOM:
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=192"
```

## Dependency Constraints

### ✅ Compatible Packages

- React, React Router, TanStack Query - Pure JavaScript
- Recharts - SVG-based, no native dependencies
- **TailwindCSS v3.x** - Works on ARM
- PostgreSQL client (pg) - Compiles on ARMv7
- Vite, TypeScript - Full ARM support

### ❌ Incompatible / Avoid

- **TailwindCSS v4.x** - Rust binaries don't support ARMv7
- `canvas` - Difficult to compile on ARM
- `puppeteer` - Chromium not available for ARMv7
- `bcrypt` - Use `bcryptjs` instead (pure JS)

### Native Dependencies

Prefer pure JavaScript alternatives:
- `bcrypt` → `bcryptjs`
- `node-sass` → `sass` (Dart Sass)

For packages with native bindings, use pre-built binaries or multi-stage builds.

## Storage Optimization

### MicroSD Card
- **Minimum**: Class 10, UHS-I (U1)
- **Recommended**: UHS-I (U3), A2 rated
- **Brands**: SanDisk Extreme, Samsung EVO Plus

### External SSD (Better)
10-50x faster random I/O. Mount to `/var/lib/docker/volumes` for better database performance.

### TimescaleDB Optimizations

- Enable compression for data older than 7 days
- Use continuous aggregates for hourly/daily summaries
- Reduces query load and storage

## Thermal Management

Pi 3 throttles at 80°C. Monitor temperature:
```bash
vcgencmd measure_temp
```

Solutions:
- Add heatsinks to CPU and RAM
- Use 5V GPIO-powered fan
- Ensure case ventilation
- Avoid overclocking for 24/7 operation

## Performance Expectations

| Metric | Expected Value |
|--------|---------------|
| Page load | 1-3 seconds (first), <1s cached |
| Data collection | 60 seconds per cycle |
| DB write latency | 50-200ms (SD), 10-50ms (SSD) |
| Chart render | 1-2 seconds (10k points) |
| Concurrent users | 5-10 |
| Memory usage | 600-800 MB |
| CPU idle | 5-15% |

## Known Limitations

1. **Heavy queries**: 30+ days of dense data may be slow → Use continuous aggregates
2. **Many sensors**: 20+ sensors may slow collection → Increase interval or batch writes
3. **Concurrent writes**: Database bottleneck → Use connection pooling

## Deployment Checklist

- [ ] Pi 3B+ with official power supply
- [ ] Fast microSD (UHS-I U3) or external SSD
- [ ] Heatsinks/active cooling installed
- [ ] All docker-compose services specify `platform: linux/arm/v7`
- [ ] Memory limits configured (total < 900MB)
- [ ] PostgreSQL tuned for low memory
- [ ] Node.js heap limits set
- [ ] TailwindCSS v3.x (not v4)
- [ ] Static IP configured
- [ ] Temperature monitoring enabled

## Upgrading to Pi 4

If performance insufficient, Pi 4 (4GB) provides:
- **4x RAM** (1GB → 4GB)
- **ARM64 architecture** (better package support)
- **USB 3.0** (much faster SSD I/O)
- **Gigabit Ethernet**

Migration: Change platform from `linux/arm/v7` to `linux/arm64`
