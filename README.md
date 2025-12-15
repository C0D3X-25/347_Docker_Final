# 347_Docker_Final (Floppy Whale)

A Flappy Bird clone using Python for the game, C# ASP.NET Core for the API, and MySQL for storing player scores — all containerized with Docker.

## Team Members
- **Gianni Della Vecchia** : Frontend Developer
- **Jocelin Thumelin** : Backend Developer

---

## Project Structure

```
347_Docker_Final/
??? frontend/                 # Python Flask game
?   ??? Dockerfile
??? backend/                  # C# ASP.NET Core API
?   ??? Dockerfile
?   ??? init.sql             # Database schema
?   ??? dev-seed.sql         # Sample data (dev only)
??? docker-compose-git.yml    # Build from source (Dockerfiles)
??? docker-compose-docker.yml # Pull from Docker Hub
```

### Architecture

| Service | Technology | Dev Port | Prod Port |
|---------|------------|----------|-----------|
| Frontend | Python Flask | 5001 | 5000 |
| Backend | C# ASP.NET Core | 8081 | 8080 |
| MySQL | MySQL 8.0 | 3307 | 3306 |

All services communicate via the `app-net` bridge network.

---

## Option 1: Run from GitHub (Build Locally)

Build images from Dockerfiles and run the application.

### Clone and Run

```sh
# Clone the repository
git clone https://github.com/C0D3X-25/347_Docker_Final.git
cd 347_Docker_Final

# Run development environment
docker compose -f docker-compose-git.yml --profile dev up --build

# Or run production environment
docker compose -f docker-compose-git.yml --profile prod up --build
```

### Stop

```sh
docker compose -f docker-compose-git.yml --profile dev down
docker compose -f docker-compose-git.yml --profile prod down
```

### Reset Database

```sh
docker compose -f docker-compose-git.yml --profile dev down -v
docker compose -f docker-compose-git.yml --profile dev up --build
```

---

## Option 2: Run from Docker Hub (Pre-built Images)

Use pre-built images from Docker Hub — no build required.

### Pull Images

```sh
# For production
docker pull codex25/frontend:prod
docker pull codex25/backend:prod

# For development
docker pull codex25/frontend:dev
docker pull codex25/backend:dev
```

### Run

```sh
# Clone repository (needed for init.sql and compose file)
git clone https://github.com/C0D3X-25/347_Docker_Final.git
cd 347_Docker_Final

# Run development environment
docker compose -f docker-compose-docker.yml --profile dev up

# Or run production environment
docker compose -f docker-compose-docker.yml --profile prod up
```

### Stop

```sh
docker compose -f docker-compose-docker.yml --profile dev down
docker compose -f docker-compose-docker.yml --profile prod down
```

---

## Build and Push to Docker Hub

Instructions for maintainers to build and push images.

### Login

```sh
docker login
```

### Build and Push Frontend

```sh
# Production
docker build -f frontend/Dockerfile -t codex25/frontend:prod ./frontend
docker push codex25/frontend:prod

# Development
docker build -f frontend/Dockerfile -t codex25/frontend:dev ./frontend
docker push codex25/frontend:dev
```

### Build and Push Backend

```sh
# Production
docker build -f backend/Dockerfile -t codex25/backend:prod ./backend
docker push codex25/backend:prod

# Development
docker build -f backend/Dockerfile -t codex25/backend:dev ./backend
docker push codex25/backend:dev
```

---

## Access the Application

| Environment | Frontend | API | MySQL |
|-------------|----------|-----|-------|
| Development | http://localhost:5001 | http://localhost:8081 | localhost:3307 |
| Production | http://localhost:5000 | http://localhost:8080 | localhost:3306 |

---

## Docker Compose Files

| File | Description |
|------|-------------|
| `docker-compose-git.yml` | Builds images locally from Dockerfiles |
| `docker-compose-docker.yml` | Uses pre-built images from Docker Hub |

---

## Docker Hub Images

| Image | Description |
|-------|-------------|
| `codex25/frontend:prod` | Production frontend |
| `codex25/frontend:dev` | Development frontend |
| `codex25/backend:prod` | Production backend |
| `codex25/backend:dev` | Development backend |

---

## Tools
- Python 3.x
- C# / .NET 10
- MySQL 8.0
- Docker & Docker Compose

## Repository
- **GitHub**: https://github.com/C0D3X-25/347_Docker_Final
- **Docker Hub**: https://hub.docker.com/u/codex25