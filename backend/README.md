# Backend API

C# ASP.NET Core API for user registration, login, and score management.

## Build & Run

### Development (with sample data)

```sh
docker compose --profile dev up --build
```

### Production

```sh
docker compose --profile prod up --build
```

### Stop containers

```sh
docker compose --profile dev down
docker compose --profile prod down
```

### Reset database (delete volume and reseed)

```sh
docker compose --profile dev down -v
docker compose --profile dev up --build
```

## Check Database (CLI)

### Show tables

```sh
docker exec -it app-stack-mysql-dev-1 mysql -u appuser -papppassword db_347 -e "SHOW TABLES;"
```

### View users

```sh
docker exec -it app-stack-mysql-dev-1 mysql -u appuser -papppassword db_347 -e "SELECT * FROM users;"
```

### View scores

```sh
docker exec -it app-stack-mysql-dev-1 mysql -u appuser -papppassword db_347 -e "SELECT * FROM scores;"
```

### Interactive MySQL shell

```sh
docker exec -it app-stack-mysql-dev-1 mysql -u appuser -papppassword db_347
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users` | Register a user |
| GET | `/users/{name}` | Get user by name |
| POST | `/login` | Authenticate user |
| POST | `/scores` | Save a score |
| GET | `/scores/{name}` | Get user scores |
| GET | `/scores` | Get leaderboard |

## Test Users (dev only)

| Username | Password |
|----------|----------|
| alice | password1 |
| bob | password2 |
| charlie | password3 |
| diana | password4 |
| edward | password5 |
| fiona | password6 |
| george | password7 |
| hannah | password8 |
| ian | password9 |
| jane | password10 |
