#!/bin/zsh
# Rebuild and restart the stack with all dependencies

set -e

# Stop and remove containers

echo "Stopping and removing Docker Compose containers..."
docker compose down

echo "Installing npm dependencies in proxy/..."
cd "$(dirname "$0")/../proxy" && npm install

echo "Installing npm dependencies in frontend/..."
cd "../frontend" && npm install

cd ..

echo "Rebuilding and starting Docker Compose in background..."
docker compose up -d --build

echo "Tailing Docker Compose logs..."
docker compose logs -f
