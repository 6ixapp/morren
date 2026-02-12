#!/bin/bash
set -euo pipefail

# ============================================================
# Morren Marketplace - Production Deployment Script
#
# SAFETY FEATURES:
#  - Automatic pre-deploy database backup
#  - Git commit hash tracking for rollback
#  - Health check with auto-rollback on failure
#  - Build verification before restart
#  - Graceful PM2 reload (zero-downtime)
#  - Deployment log with full audit trail
#
# Usage: bash deploy.sh
# Rollback: bash deploy.sh --rollback
# ============================================================

APP_DIR="/opt/morren"
APP_USER="morren"
DEPLOY_LOG="/var/log/morren/deploy.log"
STATE_FILE="$APP_DIR/.deploy-state"
HEALTH_URL="http://localhost:5000/health"
HEALTH_RETRIES=10
HEALTH_WAIT=3

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [DEPLOY] $1"
  echo -e "${GREEN}${msg}${NC}"
  echo "$msg" >> "$DEPLOY_LOG"
}
warn() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1"
  echo -e "${YELLOW}${msg}${NC}"
  echo "$msg" >> "$DEPLOY_LOG"
}
err() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"
  echo -e "${RED}${msg}${NC}"
  echo "$msg" >> "$DEPLOY_LOG"
}

health_check() {
  for i in $(seq 1 $HEALTH_RETRIES); do
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    if [ "$HEALTH_STATUS" = "200" ]; then
      return 0
    fi
    if [ "$i" -lt "$HEALTH_RETRIES" ]; then
      sleep "$HEALTH_WAIT"
    fi
  done
  return 1
}

# ============================================================
# ROLLBACK MODE
# ============================================================
if [ "${1:-}" = "--rollback" ]; then
  log "===== ROLLBACK INITIATED ====="

  if [ ! -f "$STATE_FILE" ]; then
    err "No deploy state file found. Cannot rollback."
    exit 1
  fi

  PREV_COMMIT=$(grep "^previous_commit=" "$STATE_FILE" | cut -d= -f2)
  if [ -z "$PREV_COMMIT" ]; then
    err "No previous commit recorded. Cannot rollback."
    exit 1
  fi

  log "Rolling back to commit: $PREV_COMMIT"

  cd "$APP_DIR"
  git checkout "$PREV_COMMIT"

  cd "$APP_DIR/backend"
  npm install --production
  npm run build

  pm2 reload morren-backend --env production

  sleep 3
  if health_check; then
    log "Rollback successful! Running on commit: $PREV_COMMIT"
  else
    err "Rollback health check FAILED. Manual intervention required."
    err "Check: pm2 logs morren-backend"
    exit 1
  fi

  exit 0
fi

# ============================================================
# DEPLOY MODE
# ============================================================
log "===== DEPLOYMENT STARTED ====="

# --- Pre-checks ---
if [ ! -d "$APP_DIR/backend" ]; then
  err "Backend not found at $APP_DIR/backend. Clone your repo first."
  exit 1
fi

cd "$APP_DIR"

# ============================================================
# 1. Record current state for rollback
# ============================================================
CURRENT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
log "Current commit: $CURRENT_COMMIT"

# ============================================================
# 2. PRE-DEPLOY DATABASE BACKUP (critical!)
# ============================================================
log "Creating pre-deploy database backup..."
if [ -x "$APP_DIR/deploy/backup-db.sh" ]; then
  if bash "$APP_DIR/deploy/backup-db.sh" --pre-deploy; then
    log "Pre-deploy backup completed successfully"
  else
    err "Pre-deploy backup FAILED! Aborting deployment."
    err "Fix backup issues before deploying. Your data safety is at risk."
    exit 1
  fi
else
  warn "backup-db.sh not found or not executable. Skipping pre-deploy backup."
  warn "This is DANGEROUS in production!"
fi

# ============================================================
# 3. Pull latest code
# ============================================================
log "Pulling latest code..."
git fetch origin main
NEW_COMMIT=$(git rev-parse origin/main)

if [ "$CURRENT_COMMIT" = "$NEW_COMMIT" ]; then
  warn "Already up to date (commit: $CURRENT_COMMIT). Nothing to deploy."
  exit 0
fi

git pull origin main
log "Updated to commit: $NEW_COMMIT"

# Save state for rollback
cat > "$STATE_FILE" << STATE_EOF
previous_commit=$CURRENT_COMMIT
current_commit=$NEW_COMMIT
deploy_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
STATE_EOF

# ============================================================
# 4. Install dependencies
# ============================================================
log "Installing backend dependencies..."
cd "$APP_DIR/backend"
npm install --production

# ============================================================
# 5. Build TypeScript
# ============================================================
log "Building backend..."
if npm run build; then
  log "Build successful"
else
  err "Build FAILED! Rolling back to previous commit."
  cd "$APP_DIR"
  git checkout "$CURRENT_COMMIT"
  err "Rolled back to: $CURRENT_COMMIT. Fix build errors and redeploy."
  exit 1
fi

# Verify build output exists
if [ ! -f "$APP_DIR/backend/dist/index.js" ]; then
  err "Build output missing (dist/index.js not found). Rolling back."
  cd "$APP_DIR"
  git checkout "$CURRENT_COMMIT"
  exit 1
fi

# ============================================================
# 6. Symlink .env
# ============================================================
if [ -f "$APP_DIR/.env" ] && [ ! -f "$APP_DIR/backend/.env" ]; then
  ln -sf "$APP_DIR/.env" "$APP_DIR/backend/.env"
  log "Symlinked .env to backend"
fi

# ============================================================
# 7. Run database migrations
# ============================================================
log "Running database migrations..."
cd "$APP_DIR/backend"
if npm run migrate 2>/dev/null; then
  log "Migrations completed"
else
  warn "Migration returned non-zero (may already be up to date)"
fi

# ============================================================
# 8. Graceful restart via PM2 reload (zero-downtime)
# ============================================================
log "Restarting application (graceful reload)..."
if pm2 describe morren-backend > /dev/null 2>&1; then
  pm2 reload morren-backend --env production
else
  pm2 start ecosystem.config.js --env production
  pm2 save
fi

# ============================================================
# 9. Health check with auto-rollback
# ============================================================
log "Running health checks (${HEALTH_RETRIES} attempts, ${HEALTH_WAIT}s interval)..."

if health_check; then
  log "Health check PASSED!"
else
  err "Health check FAILED after $HEALTH_RETRIES attempts!"
  err "AUTO-ROLLBACK: Reverting to commit $CURRENT_COMMIT..."

  cd "$APP_DIR"
  git checkout "$CURRENT_COMMIT"
  cd "$APP_DIR/backend"
  npm install --production
  npm run build

  pm2 reload morren-backend --env production
  sleep 5

  if health_check; then
    warn "Rollback successful. Server is running on previous version."
  else
    err "CRITICAL: Rollback also failed! Manual intervention required."
    err "Check: pm2 logs morren-backend"
  fi

  err "Deployment ABORTED. Fix the issue and try again."
  exit 1
fi

# ============================================================
# 10. Summary
# ============================================================
echo ""
log "===== DEPLOYMENT SUCCESSFUL ====="
log "  Previous: $CURRENT_COMMIT"
log "  Current:  $NEW_COMMIT"
log "  Time:     $(date '+%Y-%m-%d %H:%M:%S')"
log "================================="
echo ""
pm2 status
echo ""
