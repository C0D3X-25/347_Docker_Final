# 347_Docker_Final (Floppy Whale)

## Goal
A Flappy Bird clone using Python for the game and MySQL for storing player scores and C# to expose an API, containerized with Docker.

## Team Members
- Gianni Della Vecchia : Frontend Developer
- Jocelin Thumelin : Backend Developer

## Architecture

### Containers
| Container | Description | Port |
|-----------|-------------|------|
| frontend | Python Flappy Bird game | 3000 |
| backend | C# ASP.NET Core API | 8080 |
| mysql-dev | MySQL database (dev) | 3306 |
| mysql-prod | MySQL database (prod) | 3307 |

### Volumes
| Volume | Description |
|--------|-------------|
| mysql-dev-data | Persistent dev database storage (contain sample data for testing) |
| mysql-prod-data | Persistent prod database storage |

### Network
All containers communicate via `app-net` bridge network.

## Quick Start

### Development
```sh
docker compose --profile dev up --build
```

### Production
```sh
docker compose --profile prod up --build
```

### Stop
```sh
docker compose --profile dev down
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