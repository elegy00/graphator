# Graphator Raspberry Pi 3 Deployment

This folder contains the Docker Compose configuration for running Graphator on a Raspberry Pi 3/3+ (ARMv7).

## Architecture

Graphator runs as 3 separate containers:
- **graphator-db**: PostgreSQL 16 database (optimized for Pi 3)
- **graphator-worker**: Background service collecting sensor data from Home Assistant
- **graphator-web**: React Router SSR web application serving the UI

All containers use pre-built multi-architecture images from Docker Hub, automatically pulling the correct ARMv7 variant for Raspberry Pi 3.

## Deployment to Raspberry Pi

### Deploy to black-pearl (user: pirate):

```bash
# 1. Copy the pi3 folder to your Raspberry Pi
scp -r pi3/ pirate@black-pearl:~/graphator/

# 2. SSH into the Pi
ssh pirate@black-pearl

# 3. Navigate to the folder
cd ~/graphator/pi3
```

Now follow the Quick Start steps below.

### Deploy to a different Raspberry Pi:

Replace `black-pearl` with your hostname and `pirate` with your username:

```bash
# Copy files
scp -r pi3/ your-username@your-hostname:~/graphator/

# SSH and navigate
ssh your-username@your-hostname
cd ~/graphator/pi3
```

## Quick Start

1. **Copy the environment file and configure it:**
   ```bash
   cp .env.example .env
   nano .env
   ```

2. **Update configuration in `.env`:**
   ```bash
   # Database password
   DB_PASSWORD=your_secure_password

   # Home Assistant credentials
   HOME_ASSISTANT_URL=http://192.168.1.100:8123
   HOME_ASSISTANT_TOKEN=your_actual_token_here
   ```

3. **Pull the latest image and start the container:**
   ```bash
   docker compose pull
   docker compose up -d
   ```

4. **Access Graphator:**
   Open `http://raspberry-pi-ip:3000` in your browser

## Commands

```bash
# Start the application
docker compose up -d

# View logs
docker compose logs -f

# Stop the application
docker compose down

# Update to latest version
docker compose pull
docker compose up -d

# Restart the application
docker compose restart

# Check status
docker compose ps
```

## Configuration

### Environment Variables

Edit the `.env` file to configure:

**Required:**
- `DB_PASSWORD`: PostgreSQL database password
- `HOME_ASSISTANT_URL`: Your Home Assistant instance URL
- `HOME_ASSISTANT_TOKEN`: Long-lived access token from Home Assistant

**Optional (with defaults):**
- `PORT`: Web server port (default: 3000)
- `COLLECTION_INTERVAL_MS`: Data collection frequency (default: 60000ms = 1 minute)
- `REDISCOVERY_INTERVAL_MS`: Sensor re-discovery frequency (default: 300000ms = 5 minutes)
- `CLEANUP_INTERVAL_MS`: Old data cleanup frequency (default: 3600000ms = 1 hour)
- `RETENTION_DAYS`: Data retention period (default: 30 days)

### Port Mapping

By default, Graphator runs on port 3000. To change it:

1. Edit `docker-compose.yml`:
   ```yaml
   ports:
     - "8080:3000"  # Maps host port 8080 to container port 3000
   ```

2. Restart the container:
   ```bash
   docker compose up -d
   ```

## Health Check

The container includes a health check that runs every 30 seconds. Check the health status:

```bash
docker compose ps
# or
docker inspect graphator | grep -A 10 Health
```

## Logs

View application logs:

```bash
# Follow logs in real-time
docker compose logs -f

# View last 100 lines
docker compose logs --tail 100

# View logs for specific time
docker compose logs --since 10m
```

Logs are automatically rotated (max 10MB per file, 3 files kept).

## Troubleshooting

### Container won't start

1. Check logs:
   ```bash
   docker compose logs
   ```

2. Verify environment variables:
   ```bash
   cat .env
   ```

3. Test Home Assistant connection:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://your-ha-url:8123/api/
   ```

### Port already in use

Change the host port in `docker-compose.yml`:
```yaml
ports:
  - "8080:3000"  # Use 8080 instead of 3000
```

### Container keeps restarting

Check if Home Assistant URL and token are correct:
```bash
docker compose logs | grep -i error
```

## Updates

To update to the latest version:

```bash
# Pull latest image
docker compose pull

# Recreate container with new image
docker compose up -d
```

## System Requirements

- **Hardware**: Raspberry Pi 3/3+ (ARMv7) or newer
- **Software**: Docker and Docker Compose
- **Memory**: At least 600MB free RAM
  - Database: ~256-384MB
  - Worker: ~128-256MB
  - Web: ~128-256MB
- **Storage**: Fast microSD card (UHS-I U3) or USB SSD recommended
- **Network**: Access to Home Assistant instance

## Memory Optimization

The docker-compose.yml includes memory limits optimized for Pi 3 (1GB RAM total):
- Database: 384MB max, 256MB reserved
- Worker: 256MB max, 128MB reserved
- Web: 256MB max, 128MB reserved

The included `postgres.conf` is tuned for Pi 3's limited memory.

## Installing Docker on Raspberry Pi

If Docker is not installed:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

Log out and back in for group changes to take effect.
