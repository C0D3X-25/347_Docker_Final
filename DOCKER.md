# Docker Configuration

## Overview

This project uses Docker Compose to orchestrate multiple containers and Dockerfiles to build custom images.

---

## docker-compose.yml

Defines and runs the multi-container application.

### Services

| Service | Image | Purpose |
|---------|-------|---------|
| backend | Custom (Dockerfile) | C# API |
| mysql-dev | mysql:8.0 | Dev database with sample data |
| mysql-prod | mysql:8.0 | Production database |
| frontend | Custom (Dockerfile) | Python game (coming soon) |

### Profiles

Profiles allow running different configurations without modifying the compose file.

- `dev` - Starts mysql-dev which includes sample test data from `dev-seed.sql`
- `prod` - Starts mysql-prod with empty tables (schema only from `init.sql`)

**Why use profiles?**
- Avoids starting unnecessary containers
- Keeps dev and prod data completely separate
- Allows different initialization scripts per environment

### Volumes

Volumes persist data outside the container filesystem.

- `mysql-dev-data` ? `/var/lib/mysql`
- `mysql-prod-data` ? `/var/lib/mysql`

**Why use volumes?**
- Data survives container restarts and rebuilds
- Database doesn't reinitialize on every start
- Can backup/restore data independently from containers

### Networks

All services share `app-net` bridge network.

**Why a custom network?**
- Containers can communicate using service names (e.g., `mysql-dev` instead of IP addresses)
- Isolated from other Docker networks on the host
- Frontend can call `http://backend:8080` directly

### Environment Variables

Backend reads database connection info from environment:

```yaml
DB_HOST: mysql-dev    # Service name, resolved by Docker DNS
DB_PORT: 3306         # MySQL default port
DB_NAME: db_347       # Database name created by MySQL init
DB_USER: appuser      # Non-root user for application
DB_PASSWORD: apppassword
```

**Why environment variables?**
- No hardcoded credentials in code
- Easy to change between environments
- Follows 12-factor app principles

### Health Checks

MySQL containers report their health status. Backend waits before starting:

```yaml
depends_on:
  mysql-dev:
    condition: service_healthy
```

**Why health checks?**
- MySQL takes time to initialize on first run
- Prevents backend from crashing on startup
- `depends_on` alone only waits for container start, not service readiness

### Init Scripts

MySQL runs scripts in `/docker-entrypoint-initdb.d/` on first start only:

- `00-init.sql` - Creates tables (users, scores)
- `10-dev-seed.sql` - Inserts sample data (dev only)

**Why numbered prefixes?**
- Scripts run in alphabetical order
- Schema must exist before inserting data

---

## backend/Dockerfile

Multi-stage build for the C# API.

### Stages

```dockerfile
# 1. BASE - Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
```
Uses the ASP.NET runtime image. This is the minimal image needed to run a .NET web application (no SDK, no build tools).

```dockerfile
# 2. BUILD - Compile the code
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
COPY ["347_Docker_Final.csproj", "."]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build
```
Uses the full SDK to restore NuGet packages and compile the C# code. The SDK image is large (~900MB) but only used during build.

```dockerfile
# 3. PUBLISH - Create optimized output
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false
```
Creates a production-ready output. `UseAppHost=false` skips creating a native executable since we run via `dotnet` command.

```dockerfile
# 4. FINAL - Copy published files to runtime
FROM base AS final
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "347_Docker_Final.dll"]
```
Copies only the published DLLs into the small runtime image. Final image is ~200MB instead of ~900MB.

### Why Multi-Stage?

| Benefit | Explanation |
|---------|-------------|
| Smaller image | Final image only contains runtime (~200MB vs ~900MB) |
| Faster deploys | Less data to transfer to servers |
| Layer caching | Unchanged layers reuse cache, speeding rebuilds |
| Security | No compilers or build tools in production image |
| Clean separation | Build dependencies don't leak into runtime |

---

## frontend/Dockerfile (Coming Soon)

Will be a Python-based container for the Flappy Bird game.

### Expected Structure

```dockerfile
# Base Python image
FROM python:3.12-slim
```
Uses slim variant to reduce image size (~150MB vs ~1GB for full image).

```dockerfile
# Set working directory
WORKDIR /app
```
All subsequent commands run from `/app`. Creates the directory if it doesn't exist.

```dockerfile
# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt
```
Copies only `requirements.txt` first. This layer is cached and only rebuilds when dependencies change, not when code changes.

```dockerfile
# Copy game files
COPY . .
```
Copies all source files. This layer rebuilds on any code change, but dependency layer stays cached.

```dockerfile
# Expose port
EXPOSE 3000
```
Documents which port the container listens on. Doesn't actually publish the port (that's done in compose).

```dockerfile
# Run the game
CMD ["python", "main.py"]
```
Default command when container starts. Can be overridden at runtime.

### Communication with Backend

The frontend receives `BACKEND_URL=http://backend:8080` from docker-compose. It uses this to make HTTP requests to the C# API for:
- User registration and login
- Saving scores after game over
- Fetching leaderboard data
