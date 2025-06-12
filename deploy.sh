#!/bin/zsh

# Production deployment script for News Aggregator
# This script helps deploy the application to production environment

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logger function
log() {
    echo "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warn() {
    echo "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check required environment variables
check_env() {
    log "Checking environment variables..."
    
    if [[ -z "${NEWS_API_KEY}" ]]; then
        error "NEWS_API_KEY is not set"
        exit 1
    fi
    
    if [[ -z "${XAI_API_KEY}" ]]; then
        error "XAI_API_KEY is not set"
        exit 1
    fi
}

# Build the application
build() {
    log "Building application..."
    
    # Frontend build
    cd frontend
    log "Installing frontend dependencies..."
    npm ci
    
    log "Building frontend..."
    npm run build
    
    # Run tests
    log "Running tests..."
    npm test
    
    cd ..
    
    # Backend build
    cd proxy
    log "Installing backend dependencies..."
    npm ci
    cd ..
}

# Deploy using Docker Compose
deploy() {
    log "Deploying application..."
    
    # Build and start containers
    docker compose -f docker-compose.prod.yml build
    docker compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    sleep 10
    
    # Check service health
    if ! curl -s http://localhost:3000/health > /dev/null; then
        error "Backend service is not healthy"
        docker compose -f docker-compose.prod.yml logs proxy
        exit 1
    fi
    
    if ! curl -s http://localhost:8080/health > /dev/null; then
        error "Frontend service is not healthy"
        docker compose -f docker-compose.prod.yml logs frontend
        exit 1
    fi
}

# Main deployment process
main() {
    log "Starting deployment process..."
    
    # Check environment
    check_env
    
    # Build application
    build
    
    # Deploy
    deploy
    
    log "Deployment completed successfully!"
    log "Frontend available at: http://localhost:8080"
    log "Backend available at: http://localhost:3000"
}

# Run main function
main
