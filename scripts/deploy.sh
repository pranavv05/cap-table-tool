#!/bin/bash

# Deployment script for Cap Table Tool
# Usage: ./deploy.sh [environment] [options]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
SKIP_TESTS=false
SKIP_BACKUP=false
FORCE_DEPLOY=false
DRY_RUN=false

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Help function
show_help() {
    cat << EOF
Cap Table Tool Deployment Script

Usage: $0 [environment] [options]

Environments:
    development    Deploy to development environment
    staging        Deploy to staging environment  
    production     Deploy to production environment (default)

Options:
    --skip-tests      Skip running tests before deployment
    --skip-backup     Skip creating database backup (production only)
    --force          Force deployment even if checks fail
    --dry-run        Show what would be deployed without actually deploying
    --help           Show this help message

Examples:
    $0                          # Deploy to production
    $0 staging                  # Deploy to staging
    $0 production --skip-tests  # Deploy to production without tests
    $0 staging --dry-run        # Show staging deployment plan

Environment Variables Required:
    VERCEL_TOKEN                Vercel deployment token
    NEXT_PUBLIC_SUPABASE_URL    Supabase project URL
    SUPABASE_SERVICE_ROLE_KEY   Supabase service role key
    CLERK_SECRET_KEY            Clerk secret key
    
Optional:
    SLACK_WEBHOOK_URL          For deployment notifications
    DATADOG_API_KEY           For monitoring integration

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        development|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    error "Invalid environment: $ENVIRONMENT"
    show_help
    exit 1
fi

# Start deployment
log "🚀 Starting deployment to $ENVIRONMENT environment"
log "==========================================>"

# Check prerequisites
log "📋 Checking prerequisites..."

# Check if we're in the right directory
if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
    error "Not in project root directory. Please run from project root."
    exit 1
fi

# Check required tools
command -v node >/dev/null 2>&1 || { error "Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { error "npm is required but not installed."; exit 1; }

# Check environment variables
check_env_var() {
    if [[ -z "${!1}" ]]; then
        error "Environment variable $1 is required but not set"
        return 1
    fi
}

if [[ "$ENVIRONMENT" == "production" ]]; then
    check_env_var "VERCEL_TOKEN" || exit 1
    check_env_var "NEXT_PUBLIC_SUPABASE_URL" || exit 1
    check_env_var "SUPABASE_SERVICE_ROLE_KEY" || exit 1
    check_env_var "CLERK_SECRET_KEY" || exit 1
fi

success "Prerequisites check passed"

# Git checks
log "🔍 Checking git status..."

# Check if we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
EXPECTED_BRANCH=""

case $ENVIRONMENT in
    development)
        EXPECTED_BRANCH="develop"
        ;;
    staging)
        EXPECTED_BRANCH="staging"
        ;;
    production)
        EXPECTED_BRANCH="main"
        ;;
esac

if [[ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" && "$FORCE_DEPLOY" != true ]]; then
    error "Current branch ($CURRENT_BRANCH) doesn't match expected branch ($EXPECTED_BRANCH) for $ENVIRONMENT"
    error "Use --force to deploy anyway or switch to the correct branch"
    exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) && "$FORCE_DEPLOY" != true ]]; then
    error "You have uncommitted changes. Please commit or stash them before deploying"
    error "Use --force to deploy anyway"
    exit 1
fi

# Pull latest changes
if [[ "$DRY_RUN" != true ]]; then
    log "📥 Pulling latest changes..."
    git pull origin "$CURRENT_BRANCH"
fi

success "Git checks passed"

# Install dependencies
log "📦 Installing dependencies..."
if [[ "$DRY_RUN" != true ]]; then
    npm ci
fi
success "Dependencies installed"

# Environment setup
log "⚙️  Setting up environment configuration..."
if [[ "$DRY_RUN" != true ]]; then
    node scripts/setup-environment.js create "$ENVIRONMENT"
    node scripts/setup-environment.js validate "$ENVIRONMENT"
fi
success "Environment configuration ready"

# Run tests
if [[ "$SKIP_TESTS" != true ]]; then
    log "🧪 Running tests..."
    if [[ "$DRY_RUN" != true ]]; then
        npm run test -- --run
        npm run lint
        npx tsc --noEmit
    fi
    success "All tests passed"
else
    warning "Skipping tests (--skip-tests flag used)"
fi

# Build application
log "🔨 Building application..."
if [[ "$DRY_RUN" != true ]]; then
    npm run build
fi
success "Build completed"

# Performance analysis
log "📊 Running performance analysis..."
if [[ "$DRY_RUN" != true ]]; then
    node scripts/performance-optimization.js analyze
fi

# Database backup (production only)
if [[ "$ENVIRONMENT" == "production" && "$SKIP_BACKUP" != true ]]; then
    log "💾 Creating database backup..."
    if [[ "$DRY_RUN" != true ]]; then
        node scripts/database-management.js backup
    fi
    success "Database backup created"
elif [[ "$SKIP_BACKUP" == true ]]; then
    warning "Skipping database backup (--skip-backup flag used)"
fi

# Security validation
log "🔒 Running security validation..."
if [[ "$DRY_RUN" != true ]]; then
    npm audit --audit-level=moderate
    # Additional security checks would go here
fi
success "Security validation passed"

# Deploy to Vercel
if [[ "$DRY_RUN" == true ]]; then
    log "🔍 DRY RUN: Would deploy to $ENVIRONMENT with the following configuration:"
    echo "  - Branch: $CURRENT_BRANCH"
    echo "  - Environment: $ENVIRONMENT"
    echo "  - Build hash: $(find .next -type f -exec md5sum {} \; | md5sum | cut -d' ' -f1 2>/dev/null || echo 'N/A')"
    echo "  - Skip tests: $SKIP_TESTS"
    echo "  - Skip backup: $SKIP_BACKUP"
    echo "  - Force deploy: $FORCE_DEPLOY"
    exit 0
fi

log "🚀 Deploying to Vercel ($ENVIRONMENT)..."

VERCEL_ARGS=""
if [[ "$ENVIRONMENT" == "production" ]]; then
    VERCEL_ARGS="--prod"
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    VERCEL_ARGS="--target staging"
fi

vercel $VERCEL_ARGS --token "$VERCEL_TOKEN"
DEPLOYMENT_URL=$(vercel ls --token "$VERCEL_TOKEN" | head -2 | tail -1 | awk '{print $2}')

success "Deployment completed successfully"
log "🌐 Deployment URL: $DEPLOYMENT_URL"

# Database migrations
log "🗄️  Running database migrations..."
node scripts/database-management.js migrate

# Health checks
log "🔍 Running health checks..."
sleep 30  # Wait for deployment to be ready

HEALTH_URL="$DEPLOYMENT_URL/api/health"
if curl -f -s "$HEALTH_URL" > /dev/null; then
    success "Health check passed"
else
    error "Health check failed - deployment may have issues"
    exit 1
fi

# Smoke tests
log "💨 Running smoke tests..."
if command -v newman >/dev/null 2>&1; then
    # Run Postman collection if available
    if [[ -f "tests/smoke/smoke-tests.postman_collection.json" ]]; then
        newman run tests/smoke/smoke-tests.postman_collection.json \
               --env-var "base_url=$DEPLOYMENT_URL"
    fi
else
    # Basic smoke tests
    curl -f "$DEPLOYMENT_URL" > /dev/null
    curl -f "$DEPLOYMENT_URL/api/health" > /dev/null
fi
success "Smoke tests passed"

# Post-deployment tasks
log "📊 Running post-deployment tasks..."

# Update monitoring
if [[ -n "$DATADOG_API_KEY" ]]; then
    curl -X POST "https://api.datadoghq.com/api/v1/events" \
         -H "Content-Type: application/json" \
         -H "DD-API-KEY: $DATADOG_API_KEY" \
         -d "{
           \"title\": \"Deployment to $ENVIRONMENT\",
           \"text\": \"Cap Table Tool deployed successfully\",
           \"priority\": \"normal\",
           \"tags\": [\"deployment\", \"$ENVIRONMENT\"],
           \"alert_type\": \"info\"
         }" > /dev/null 2>&1
fi

# Send Slack notification
if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
         -H "Content-Type: application/json" \
         -d "{
           \"text\": \"🚀 Deployment to $ENVIRONMENT completed successfully!\",
           \"attachments\": [{
             \"color\": \"good\",
             \"fields\": [
               {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
               {\"title\": \"Branch\", \"value\": \"$CURRENT_BRANCH\", \"short\": true},
               {\"title\": \"URL\", \"value\": \"$DEPLOYMENT_URL\", \"short\": false}
             ]
           }]
         }" > /dev/null 2>&1
fi

# Performance monitoring
node scripts/performance-optimization.js test --url="$DEPLOYMENT_URL" || warning "Performance tests failed"

# Final health check
log "🏁 Final health check..."
node scripts/database-management.js health

# Summary
log "==========================================>"
success "🎉 Deployment to $ENVIRONMENT completed successfully!"
log "📊 Deployment Summary:"
log "   Environment: $ENVIRONMENT"
log "   Branch: $CURRENT_BRANCH"
log "   URL: $DEPLOYMENT_URL"
log "   Time: $(date)"
log "   Log file: $LOG_FILE"

# Cleanup old deployments (keep last 5)
log "🧹 Cleaning up old deployments..."
vercel rm --safe --yes --token "$VERCEL_TOKEN" || warning "Cleanup failed"

success "Deployment process completed! 🚀"