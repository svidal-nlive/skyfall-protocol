# Skyfall Protocol - Deployment Guide

## 🐳 Docker Deployment

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Traefik reverse proxy (already running)
- External network `proxy` configured
- Domain: `starfall.vectorhost.net` (DNS configured)

### Quick Deploy

```bash
# Navigate to project directory
cd /home/msn0624c/docker/apps/stacks/skyfall-protocol

# Build and start the container
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f skyfall-protocol
```

### Architecture

```
┌─────────────────────────────────────────┐
│         Traefik Reverse Proxy           │
│    (handles SSL & routing)              │
└───────────────┬─────────────────────────┘
                │ HTTPS
                ▼
┌─────────────────────────────────────────┐
│      skyfall-protocol container         │
│  ┌──────────────────────────────────┐   │
│  │   NGINX (port 80)                │   │
│  │   Serves static build files      │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Build Process

The Dockerfile uses a multi-stage build:

1. **Build Stage** (Node 20 Alpine)
   - Install npm dependencies
   - Build React/Vite production bundle
   - Output to `/app/dist`

2. **Production Stage** (Nginx Alpine)
   - Copy built files from build stage
   - Configure Nginx for SPA routing
   - Enable gzip compression

### Traefik Configuration

The service uses the following Traefik labels:

- **Router:** `skyfall-protocol`
- **Hostname:** `starfall.vectorhost.net`
- **Entrypoint:** `websecure` (HTTPS)
- **TLS:** Auto-generated via `vpsresolver`
- **Priority:** 600
- **Backend Port:** 80

### Nginx Configuration

Located in `nginx.conf`:

- Single-page application routing (`try_files`)
- Gzip compression enabled
- Cache headers for static assets
- Error page handling

### Updating the Application

```bash
# Pull latest changes
cd /home/msn0624c/docker/apps/stacks/skyfall-protocol
git pull

# Rebuild and restart
docker-compose up -d --build

# Or use docker-compose build if you want to build without restarting
docker-compose build
docker-compose up -d
```

### Troubleshooting

#### Container won't start
```bash
# Check logs
docker-compose logs skyfall-protocol

# Verify proxy network exists
docker network ls | grep proxy

# Ensure Traefik is running
docker ps | grep traefik
```

#### 502 Bad Gateway
```bash
# Check if container is healthy
docker-compose ps

# Verify nginx is listening on port 80
docker-compose exec skyfall-protocol netstat -tlnp

# Check Traefik logs
docker logs <traefik-container-id>
```

#### SSL Certificate Issues
```bash
# Check Traefik dashboard for certificate status
# Verify DNS is pointing to the correct server
# Ensure vpsresolver is properly configured
```

#### Build Failures
```bash
# Clean build
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check build logs
docker-compose build
```

### Resource Requirements

- **Memory:** ~512MB (build), ~64MB (runtime)
- **CPU:** 0.5 cores
- **Disk:** ~150MB

### Security Considerations

- All traffic is encrypted via Traefik SSL
- No environment variables required
- Read-only nginx serving static files
- Regular security updates via base image updates

### Monitoring

```bash
# View real-time logs
docker-compose logs -f

# Check resource usage
docker stats skyfall-protocol

# Inspect container
docker-compose exec skyfall-protocol sh
```

### Backup & Restore

Since this is a static site, no data backup is needed. The entire application state is in the Git repository.

```bash
# To redeploy from scratch
cd /home/msn0624c/docker/apps/stacks/skyfall-protocol
docker-compose down
docker-compose up -d --build
```

### Network Configuration

The container connects to the external `proxy` network managed by Traefik. This network must exist before starting the container.

```bash
# Verify network exists
docker network ls | grep proxy

# If needed, create it (usually done during Traefik setup)
docker network create proxy
```

## 🌐 Access

Once deployed, access the application at:
- **Production URL:** https://starfall.vectorhost.net

## 📊 Deployment Checklist

- [x] Docker Compose configuration created
- [x] Dockerfile with multi-stage build
- [x] Nginx configuration for SPA routing
- [x] Traefik labels configured
- [x] Modern favicon added
- [x] Git repository initialized
- [x] Remote repository created on GitHub
- [x] Code pushed to GitHub
- [x] Documentation updated

## 🔄 CI/CD (Future Enhancement)

Consider adding GitHub Actions for automated deployments:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy via SSH
        # Add deployment automation here
```

## 📝 Notes

- The application is a static React SPA with no backend
- All game logic runs client-side
- No database or persistent storage required
- Updates require rebuilding the Docker container
