#!/bin/zsh
# Ensure PATH includes all possible Docker locations, Homebrew, and system locations for docker
export PATH="/Applications/Docker.app/Contents/Resources/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Rebuild and restart the stack with all dependencies and run verification tests

set -euo pipefail

# Simple Docker Compose detection - use system docker
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
  DC=(docker compose)
  echo "[INFO] Using 'docker compose' command."
elif command -v docker-compose &>/dev/null; then
  DC=(docker-compose)
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

# Parse arguments
FORCE_REBUILD=false
for arg in "$@"; do
  if [[ "$arg" == "-force-rebuild" ]]; then
    FORCE_REBUILD=true
  fi
  # ...add more flags here as needed...
done

# Clean up
print_step "Stopping and removing Docker Compose containers..."
eval "${DC[@]}" down -v

if $FORCE_REBUILD; then
  print_step "Forcing full Docker image and npm cache rebuild..."
  eval "$DC down -v --rmi all --remove-orphans"
  docker builder prune -f || true
  print_step "Cleaning all node_modules and npm caches..."
  rm -rf "$PROJECT_ROOT/proxy/node_modules" "$PROJECT_ROOT/frontend/node_modules"
  rm -f "$PROJECT_ROOT/proxy/package-lock.json" "$PROJECT_ROOT/frontend/package-lock.json"
  npm cache clean --force || true
fi

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

# Build Tailwind CSS
print_step "Building Tailwind CSS..."
npx tailwindcss -i input.css -o tailwind.css

# Build frontend (Vite)
print_step "Building frontend (Vite)..."
npm run build

# Build frontend image first to ensure node_modules and build artifacts are ready
print_step "Building frontend Docker image..."
cd "$PROJECT_ROOT/frontend"
eval "$DC build frontend"

# Build proxy image after frontend is ready
print_step "Building proxy Docker image..."
cd "$PROJECT_ROOT/proxy"
eval "$DC build proxy"

cd "$PROJECT_ROOT"

# Start services
print_step "Rebuilding and starting Docker Compose in background..."
eval "$DC up -d --build"

# Tail logs unless NOTAIL is set to true
if [[ "${NOTAIL:-false}" != "true" ]]; then
  print_step "Tailing logs (Ctrl+C to exit without stopping containers)..."
  ( "${DC[@]}" logs -f )
else
  print_step "Skipping log tailing (NOTAIL=true)..."
fi

# Health checks
check_health "Proxy API" "http://localhost:3000/health" 10 3
check_health "Frontend" "http://localhost:5173" 10 3

print_success "Build and verification complete! 🚀"
print_step "Services are running at:"
echo "  Frontend: http://localhost:5173"
echo "  Proxy API: http://localhost:3000"
echo -e "\nUse '$DC logs -f' to view logs"
echo "Use '$DC down' to stop services"
