#!/bin/zsh
# Rebuild and restart the stack with all dependencies and run verification tests

set -euo pipefail

# Simple Docker Compose detection - use system docker
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
  DC="docker compose"
  echo "[INFO] Using 'docker compose' command."
elif command -v docker-compose &>/dev/null; then
  DC="docker-compose"
  echo "[INFO] Using 'docker-compose' command."
else
  echo "docker or docker-compose is required but not installed. Aborting."
  exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "\n${YELLOW}==> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check for required commands
for cmd in npm npx curl; do
  if ! command -v $cmd &>/dev/null; then
    print_error "$cmd is required but not installed. Aborting."
    exit 1
  fi
done

# Determine project root
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

check_health() {
    local service=$1
    local url=$2
    local max_attempts=$3
    local wait_seconds=$4
    print_step "Checking $service health at $url..."
    for (( i=1; i<=$max_attempts; i++ )); do
        if curl -s -f "$url" &>/dev/null; then
            print_success "$service is healthy"
            return 0
        fi
        echo "Attempt $i/$max_attempts - $service not ready, waiting ${wait_seconds}s..."
        sleep $wait_seconds
    done
    print_error "$service failed health check"
    return 1
}

# Clean up
print_step "Stopping and removing Docker Compose containers..."
eval "$DC down -v"

# Clean node_modules
print_step "Cleaning node_modules..."
rm -rf "$PROJECT_ROOT/proxy/node_modules" "$PROJECT_ROOT/frontend/node_modules"
rm -f "$PROJECT_ROOT/proxy/package-lock.json" "$PROJECT_ROOT/frontend/package-lock.json"

# Install dependencies
print_step "Installing proxy dependencies..."
cd "$PROJECT_ROOT/proxy"
npm install

print_step "Installing frontend dependencies..."
cd "$PROJECT_ROOT/frontend"
npm install

# Install Playwright browsers
print_step "Installing Playwright browsers..."
npx playwright install chromium

# Build Tailwind CSS
print_step "Building Tailwind CSS..."
npx tailwindcss -i input.css -o tailwind.css

cd "$PROJECT_ROOT"

# Start services
print_step "Rebuilding and starting Docker Compose in background..."
eval "$DC up -d --build"

# Health checks
check_health "Proxy API" "http://localhost:3000/health" 10 3
check_health "Frontend" "http://localhost:8080" 10 3

print_success "Build and verification complete! 🚀"
print_step "Services are running at:"
echo "  Frontend: http://localhost:8080"
echo "  Proxy API: http://localhost:3000"
echo -e "\nUse 'docker compose logs -f' to view logs"
echo "Use 'docker compose down' to stop services"
