# 347_Docker_Final

## Goal
The goal is to make clone of Flappy Bird using phyton for the game.
And mySql for the database, where the score of the players will be saved.
We will use Docker to containerize the application.

## Team Members
- Gianni Della Vecchia : Frontend Developer
- Jocelin Thumelin : Backend Developer

## Tools
- Python
- MySql
- Docker
- GitHub

## Containerization
- Container_frontend : Python Application
- Container_backend_dev : MySql Database Development
- Container_backend_prod : MySql Database Production

Use a Docker Compose file to manage the multi-container application.

## Repository
https://github.com/C0D3X-25/347_Docker_Final.git

# Start the project
## Start all services
docker compose up

## Start development database only
docker compose up db_dev

## Start production database only
docker compose up db_prod

## Stop all services
docker compose down