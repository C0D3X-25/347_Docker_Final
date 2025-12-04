# 347_Docker_Final (Floppy Whale)

## Goal
A Flappy Bird clone using Python for the game and MySQL for storing player scores and C# to expose an API, containerized with Docker.

## Team Members
- Gianni Della Vecchia : Frontend Developer
- Jocelin Thumelin : Backend Developer

## Architecture

### Containers
| Container | Description | Host Port |
|-----------|-------------|-----------|
| frontend | Python Flappy Bird game | 3000 |
| backend-dev | C# ASP.NET Core API (dev) | 8081 |
| backend-prod | C# ASP.NET Core API (prod) | 8080 |
| mysql-dev | MySQL database (dev) | 3307 |
| mysql-prod | MySQL database (prod) | 3306 |

### Volumes
| Volume | Description |
|--------|-------------|
| mysql-dev-data | Persistent dev database storage (contains sample data for testing) |
| mysql-prod-data | Persistent prod database storage |

### Network
All containers communicate via `app-net` bridge network using internal port 3306 for MySQL and 8080 for backend.

## Quick Start

### Development
```sh
docker compose --profile dev up --build
```
API available at: `http://localhost:8081`

### Production
```sh
docker compose --profile prod up --build
```
API available at: `http://localhost:8080`

### Stop
```sh
docker compose --profile dev down
docker compose --profile prod down
```

### Reset database
```sh
docker compose --profile dev down -v
docker compose --profile dev up --build
```

## Tools
- Python
- C# / .NET 10
- MySQL 8.0
- Docker

## Repository
https://github.com/C0D3X-25/347_Docker_Final.git