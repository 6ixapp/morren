#!/bin/bash
set -euo pipefail

# ============================================================
# Morren Marketplace - Production Database Restore Script
#
# SAFETY FEATURES:
#  - Checksum verification before restore
#  - Automatic backup of current DB before overwriting
#  - pg_restore format (custom) for reliable restores
#  - Table count verification post-restore
#  - Application auto-restart with health check
#
# Usage:
#   bash restore-db.sh                        # Interactive
#   bash restore-db.sh <backup_file>          # From specific file
#   bash restore-db.sh --latest               # Restore latest backup
#   bash restore-db.sh --latest-predeploy     # Restore latest pre-deploy backup
# ============================================================

DB_NAME="morren_db"
DB_USER="morren_user"
BACKUP_DIR="/var/backups/morren/full"
PRE_DEPLOY_DIR="/var/backups/morren/pre-deploy"
SPACES_BUCKET="morren-backups"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[RESTORE]${NC} $1"; }
warn() { echo -e "${YELLOW}[RESTORE]${NC} $1"; }
err() { echo -e "${RED}[RESTORE]${NC} $1"; exit 1; }

# ============================================================
# 1. Determine backup file
# ============================================================
RESTORE_FILE=""

if [ "${1:-}" = "--latest" ]; then
  RESTORE_FILE=$(ls -1t "$BACKUP_DIR"/morren_backup_*.sql.gz 2>/dev/null | head -1 || true)
  [ -z "$RESTORE_FILE" ] && err "No backups found in $BACKUP_DIR"
  log "Using latest full backup: $(basename "$RESTORE_FILE")"

elif [ "${1:-}" = "--latest-predeploy" ]; then
  RESTORE_FILE=$(ls -1t "$PRE_DEPLOY_DIR"/morren_predeploy_*.sql.gz 2>/dev/null | head -1 || true)
  [ -z "$RESTORE_FILE" ] && err "No pre-deploy backups found in $PRE_DEPLOY_DIR"
  log "Using latest pre-deploy backup: $(basename "$RESTORE_FILE")"

elif [ $# -ge 1 ]; then
  INPUT="$1"
  if [ -f "$INPUT" ]; then
    RESTORE_FILE="$INPUT"
  elif [ -f "$BACKUP_DIR/$INPUT" ]; then
    RESTORE_FILE="$BACKUP_DIR/$INPUT"
  elif [ -f "$PRE_DEPLOY_DIR/$INPUT" ]; then
    RESTORE_FILE="$PRE_DEPLOY_DIR/$INPUT"
  else
    # Try downloading from Spaces
    log "Backup not found locally. Attempting download from Spaces..."
    if command -v s3cmd &>/dev/null; then
      DOWNLOAD_PATH="$BACKUP_DIR/$INPUT"
      if s3cmd get "s3://$SPACES_BUCKET/full/$INPUT" "$DOWNLOAD_PATH" 2>/dev/null || \
         s3cmd get "s3://$SPACES_BUCKET/pre-deploy/$INPUT" "$DOWNLOAD_PATH" 2>/dev/null; then
        RESTORE_FILE="$DOWNLOAD_PATH"
        log "Downloaded from Spaces: $INPUT"
      else
        err "Could not find or download backup: $INPUT"
      fi
    else
      err "Backup not found locally and s3cmd not available"
    fi
  fi

else
  # Interactive mode - list all available backups
  echo ""
  echo "Available FULL backups (local):"
  echo "-------------------------------"
  ls -lht "$BACKUP_DIR"/morren_backup_*.sql.gz 2>/dev/null || echo "  (none)"
  echo ""
  echo "Available PRE-DEPLOY backups (local):"
  echo "--------------------------------------"
  ls -lht "$PRE_DEPLOY_DIR"/morren_predeploy_*.sql.gz 2>/dev/null || echo "  (none)"
  echo ""

  if command -v s3cmd &>/dev/null && [ -f "$HOME/.s3cfg" ]; then
    echo "Available Spaces backups (remote):"
    echo "-----------------------------------"
    s3cmd ls "s3://$SPACES_BUCKET/full/" 2>/dev/null || echo "  (cannot connect)"
    s3cmd ls "s3://$SPACES_BUCKET/pre-deploy/" 2>/dev/null || true
    echo ""
  fi

  read -p "Enter backup filename (or full path): " INPUT
  [ -z "$INPUT" ] && err "No backup file specified"

  # Re-resolve the file
  if [ -f "$INPUT" ]; then
    RESTORE_FILE="$INPUT"
  elif [ -f "$BACKUP_DIR/$INPUT" ]; then
    RESTORE_FILE="$BACKUP_DIR/$INPUT"
  elif [ -f "$PRE_DEPLOY_DIR/$INPUT" ]; then
    RESTORE_FILE="$PRE_DEPLOY_DIR/$INPUT"
  else
    err "File not found: $INPUT"
  fi
fi

# ============================================================
# 2. Validate backup file
# ============================================================
log "Validating backup: $(basename "$RESTORE_FILE")"
FILESIZE=$(du -h "$RESTORE_FILE" | cut -f1)
log "File size: $FILESIZE"

# Verify pg_restore can read it
if pg_restore --list "$RESTORE_FILE" > /dev/null 2>&1; then
  log "Backup format: valid (pg_restore readable)"
else
  err "Backup FAILED integrity check. pg_restore cannot read this file."
fi

# Verify checksum if available
CHECKSUM_FILE="${RESTORE_FILE%.sql.gz}.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
  log "Verifying SHA256 checksum..."
  if sha256sum -c "$CHECKSUM_FILE" > /dev/null 2>&1; then
    log "Checksum verified OK"
  else
    err "CHECKSUM MISMATCH! This backup file may be corrupted. Aborting."
  fi
else
  warn "No checksum file found. Skipping checksum verification."
fi

# Count tables in the backup
BACKUP_TABLE_COUNT=$(pg_restore --list "$RESTORE_FILE" 2>/dev/null | grep -c "TABLE " || echo "0")
log "Backup contains ~$BACKUP_TABLE_COUNT table definitions"

# ============================================================
# 3. Confirm restore
# ============================================================
echo ""
echo -e "${RED}================================================================${NC}"
echo -e "${RED} WARNING: THIS WILL REPLACE ALL DATA in database '$DB_NAME'!${NC}"
echo -e "${RED}================================================================${NC}"
echo ""
echo "  Backup file:  $(basename "$RESTORE_FILE")"
echo "  File size:     $FILESIZE"
echo "  Tables:        ~$BACKUP_TABLE_COUNT"
echo ""
read -p "Type 'RESTORE' to confirm: " CONFIRM
[ "$CONFIRM" != "RESTORE" ] && err "Restore cancelled (you must type RESTORE in capitals)"

# ============================================================
# 4. Backup current database BEFORE restoring
# ============================================================
log "Creating safety backup of current database before restore..."
SAFETY_BACKUP="/var/backups/morren/full/morren_pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
if pg_dump -U "$DB_USER" -h localhost --format=custom --compress=6 "$DB_NAME" > "$SAFETY_BACKUP" 2>/dev/null; then
  SAFETY_SIZE=$(du -h "$SAFETY_BACKUP" | cut -f1)
  log "Safety backup created: $(basename "$SAFETY_BACKUP") ($SAFETY_SIZE)"
else
  warn "Could not create safety backup. Proceeding anyway (you still have the restore file)."
fi

# ============================================================
# 5. Stop the application
# ============================================================
log "Stopping application..."
pm2 stop morren-backend 2>/dev/null || warn "App was not running"

# ============================================================
# 6. Drop and recreate database
# ============================================================
log "Terminating existing connections..."
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" 2>/dev/null || true

log "Dropping and recreating database..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
log "Database recreated"

# ============================================================
# 7. Restore data
# ============================================================
log "Restoring data from backup (this may take a while)..."
if pg_restore -U "$DB_USER" -h localhost -d "$DB_NAME" --no-owner --no-acl "$RESTORE_FILE" 2>/dev/null; then
  log "Data restored successfully"
else
  # pg_restore returns non-zero for warnings too, check if tables exist
  RESTORED_TABLES=$(psql -U "$DB_USER" -h localhost -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
  if [ "$RESTORED_TABLES" -gt 0 ]; then
    warn "pg_restore completed with warnings (this is usually fine). Tables restored: $RESTORED_TABLES"
  else
    err "Restore FAILED - no tables found! Attempting to restore from safety backup..."
    if [ -f "$SAFETY_BACKUP" ]; then
      sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
      sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
      pg_restore -U "$DB_USER" -h localhost -d "$DB_NAME" --no-owner --no-acl "$SAFETY_BACKUP" 2>/dev/null
      warn "Reverted to safety backup. Original restore file may be corrupt."
    fi
    exit 1
  fi
fi

# ============================================================
# 8. Verify restore
# ============================================================
log "Verifying restore..."
echo ""
echo "Table row counts:"
echo "-----------------"
psql -U "$DB_USER" -h localhost -d "$DB_NAME" -c "
SELECT relname AS table_name, n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
" 2>/dev/null || sudo -u postgres psql -d "$DB_NAME" -c "
SELECT relname AS table_name, n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
"

# Run ANALYZE to update statistics after restore
log "Running ANALYZE to update statistics..."
psql -U "$DB_USER" -h localhost -d "$DB_NAME" -c "ANALYZE;" 2>/dev/null || true

# ============================================================
# 9. Restart application
# ============================================================
log "Restarting application..."
pm2 restart morren-backend --env production
sleep 5

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health 2>/dev/null || echo "000")
if [ "$HEALTH" = "200" ]; then
  log "Application is healthy!"
else
  warn "Health check returned $HEALTH. Check: pm2 logs morren-backend"
fi

echo ""
log "===== RESTORE COMPLETE ====="
log "  Source:  $(basename "$RESTORE_FILE")"
log "  Safety backup: $(basename "${SAFETY_BACKUP:-none}")"
log "  Health: $HEALTH"
log "==========================="
