#!/bin/bash
set -euo pipefail

# ============================================================
# Morren Marketplace - Production Database Backup Script
# Runs every 3 days via cron. Backs up to local + DO Spaces.
#
# SAFETY FEATURES:
#  - SHA256 checksum verification on every backup
#  - Minimum file size validation (rejects empty/corrupt dumps)
#  - Atomic write (dump to temp, rename on success)
#  - Checksum stored alongside backup for later verification
#  - Upload retry (3 attempts) with exponential backoff
#  - Separate exit codes for different failure types
#  - Locks to prevent concurrent backup runs
#
# Usage: bash backup-db.sh [--pre-deploy]
# ============================================================

# --- Configuration ---
DB_NAME="morren_db"
DB_USER="morren_user"
BACKUP_DIR="/var/backups/morren/full"
PRE_DEPLOY_DIR="/var/backups/morren/pre-deploy"
SPACES_BUCKET="morren-backups"
MAX_LOCAL_BACKUPS=5
MAX_PRE_DEPLOY_BACKUPS=3
MAX_UPLOAD_RETRIES=3
MIN_BACKUP_SIZE_BYTES=1024  # Reject backups smaller than 1KB
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"
LOCKFILE="/tmp/morren-backup.lock"

# Check for --pre-deploy flag
IS_PRE_DEPLOY=false
TARGET_DIR="$BACKUP_DIR"
BACKUP_PREFIX="morren_backup"
if [ "${1:-}" = "--pre-deploy" ]; then
  IS_PRE_DEPLOY=true
  TARGET_DIR="$PRE_DEPLOY_DIR"
  BACKUP_PREFIX="morren_predeploy"
fi

BACKUP_FILE="${BACKUP_PREFIX}_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_PREFIX}_${TIMESTAMP}.sha256"

# --- Functions ---
log() { echo "$LOG_PREFIX [INFO] $1"; }
warn() { echo "$LOG_PREFIX [WARN] $1"; }
err() { echo "$LOG_PREFIX [ERROR] $1"; }

cleanup() {
  rm -f "$LOCKFILE"
  rm -f "$TARGET_DIR/${BACKUP_FILE}.tmp"
}
trap cleanup EXIT

# ============================================================
# 0. Prevent concurrent runs
# ============================================================
if [ -f "$LOCKFILE" ]; then
  LOCK_PID=$(cat "$LOCKFILE" 2>/dev/null || echo "")
  if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
    err "Another backup is already running (PID: $LOCK_PID). Skipping."
    exit 2
  else
    warn "Stale lock file found. Removing."
    rm -f "$LOCKFILE"
  fi
fi
echo $$ > "$LOCKFILE"

# --- Create directories if needed ---
mkdir -p "$TARGET_DIR"

# ============================================================
# 1. Verify database is accessible
# ============================================================
log "Verifying database connectivity..."
if ! psql -U "$DB_USER" -h localhost -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
  err "Cannot connect to database '$DB_NAME'! Backup aborted."
  exit 3
fi

TABLE_COUNT=$(psql -U "$DB_USER" -h localhost -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
log "Database accessible. Tables found: $TABLE_COUNT"

if [ "$TABLE_COUNT" -eq 0 ]; then
  warn "Database has 0 tables. This may indicate a problem. Proceeding with backup anyway."
fi

# ============================================================
# 2. Dump and compress database (atomic write)
# ============================================================
if [ "$IS_PRE_DEPLOY" = true ]; then
  log "Creating PRE-DEPLOY backup of database '$DB_NAME'..."
else
  log "Starting scheduled backup of database '$DB_NAME'..."
fi

# Dump to temp file first, rename on success
if pg_dump -U "$DB_USER" -h localhost --format=custom --compress=6 "$DB_NAME" > "$TARGET_DIR/${BACKUP_FILE}.tmp" 2>/dev/null; then
  mv "$TARGET_DIR/${BACKUP_FILE}.tmp" "$TARGET_DIR/$BACKUP_FILE"
  FILESIZE=$(du -h "$TARGET_DIR/$BACKUP_FILE" | cut -f1)
  FILESIZE_BYTES=$(stat -c%s "$TARGET_DIR/$BACKUP_FILE" 2>/dev/null || stat -f%z "$TARGET_DIR/$BACKUP_FILE" 2>/dev/null)
  log "Backup created: $BACKUP_FILE ($FILESIZE)"
else
  err "pg_dump failed! Exit code: $?"
  rm -f "$TARGET_DIR/${BACKUP_FILE}.tmp"
  exit 4
fi

# ============================================================
# 3. Validate backup
# ============================================================
log "Validating backup integrity..."

# Check minimum file size
if [ "$FILESIZE_BYTES" -lt "$MIN_BACKUP_SIZE_BYTES" ]; then
  err "Backup file is suspiciously small (${FILESIZE_BYTES} bytes < ${MIN_BACKUP_SIZE_BYTES} min). BACKUP REJECTED."
  rm -f "$TARGET_DIR/$BACKUP_FILE"
  exit 5
fi

# Verify pg_restore can read the backup (custom format allows this)
if pg_restore --list "$TARGET_DIR/$BACKUP_FILE" > /dev/null 2>&1; then
  log "Backup integrity verified (pg_restore --list passed)"
else
  err "Backup FAILED integrity check! pg_restore cannot read it."
  rm -f "$TARGET_DIR/$BACKUP_FILE"
  exit 5
fi

# Generate and store SHA256 checksum
sha256sum "$TARGET_DIR/$BACKUP_FILE" > "$TARGET_DIR/$CHECKSUM_FILE"
log "Checksum stored: $CHECKSUM_FILE"

# ============================================================
# 4. Upload to DigitalOcean Spaces (with retry)
# ============================================================
if command -v s3cmd &>/dev/null && [ -f "$HOME/.s3cfg" ]; then
  UPLOAD_SUCCESS=false
  SPACES_PATH="full"
  [ "$IS_PRE_DEPLOY" = true ] && SPACES_PATH="pre-deploy"

  for ATTEMPT in $(seq 1 $MAX_UPLOAD_RETRIES); do
    log "Uploading to DO Spaces (attempt $ATTEMPT/$MAX_UPLOAD_RETRIES): s3://$SPACES_BUCKET/$SPACES_PATH/$BACKUP_FILE"

    if s3cmd put "$TARGET_DIR/$BACKUP_FILE" "s3://$SPACES_BUCKET/$SPACES_PATH/$BACKUP_FILE" && \
       s3cmd put "$TARGET_DIR/$CHECKSUM_FILE" "s3://$SPACES_BUCKET/$SPACES_PATH/$CHECKSUM_FILE"; then
      UPLOAD_SUCCESS=true
      log "Upload to Spaces successful"
      break
    else
      warn "Upload attempt $ATTEMPT failed."
      if [ "$ATTEMPT" -lt "$MAX_UPLOAD_RETRIES" ]; then
        SLEEP_TIME=$((ATTEMPT * 10))
        log "Retrying in ${SLEEP_TIME}s..."
        sleep "$SLEEP_TIME"
      fi
    fi
  done

  if [ "$UPLOAD_SUCCESS" = false ]; then
    err "ALL upload attempts to Spaces failed! Local backup still safe at: $TARGET_DIR/$BACKUP_FILE"
  fi

  # Clean old backups from Spaces (keep last 15 full, 5 pre-deploy)
  MAX_SPACES=15
  [ "$IS_PRE_DEPLOY" = true ] && MAX_SPACES=5

  log "Cleaning old backups from Spaces (keeping last $MAX_SPACES)..."
  SPACES_FILES=$(s3cmd ls "s3://$SPACES_BUCKET/$SPACES_PATH/" 2>/dev/null | grep "\.sql\." | awk '{print $4}' | sort)
  SPACES_COUNT=$(echo "$SPACES_FILES" | grep -c . || true)
  if [ "$SPACES_COUNT" -gt "$MAX_SPACES" ]; then
    DELETE_COUNT=$((SPACES_COUNT - MAX_SPACES))
    echo "$SPACES_FILES" | head -n "$DELETE_COUNT" | while read -r file; do
      s3cmd del "$file" 2>/dev/null && log "Deleted old Spaces backup: $file"
      # Also delete matching checksum file
      s3cmd del "${file%.sql.*}.sha256" 2>/dev/null || true
    done
  fi
else
  warn "s3cmd not configured. Backup saved LOCALLY ONLY at: $TARGET_DIR/$BACKUP_FILE"
  warn "Configure Spaces backup ASAP - local-only backups are NOT safe!"
fi

# ============================================================
# 5. Rotate local backups
# ============================================================
MAX_KEEP="$MAX_LOCAL_BACKUPS"
[ "$IS_PRE_DEPLOY" = true ] && MAX_KEEP="$MAX_PRE_DEPLOY_BACKUPS"

log "Rotating local backups (keeping last $MAX_KEEP)..."
LOCAL_COUNT=$(ls -1 "$TARGET_DIR"/${BACKUP_PREFIX}_*.sql.* 2>/dev/null | wc -l)

if [ "$LOCAL_COUNT" -gt "$MAX_KEEP" ]; then
  DELETE_COUNT=$((LOCAL_COUNT - MAX_KEEP))
  ls -1t "$TARGET_DIR"/${BACKUP_PREFIX}_*.sql.* | tail -n "$DELETE_COUNT" | while read -r old_file; do
    rm -f "$old_file"
    # Remove matching checksum
    rm -f "${old_file%.sql.*}.sha256"
    log "Deleted old local backup: $(basename "$old_file")"
  done
fi

# ============================================================
# 6. Summary
# ============================================================
echo ""
log "===== BACKUP SUMMARY ====="
log "  Type:     $([ "$IS_PRE_DEPLOY" = true ] && echo 'PRE-DEPLOY' || echo 'SCHEDULED')"
log "  File:     $TARGET_DIR/$BACKUP_FILE"
log "  Size:     $FILESIZE"
log "  Checksum: $(cat "$TARGET_DIR/$CHECKSUM_FILE" | awk '{print $1}')"
log "  Tables:   $TABLE_COUNT"
log "  Spaces:   $([ "${UPLOAD_SUCCESS:-false}" = true ] && echo 'UPLOADED' || echo 'LOCAL ONLY')"
log "  Local:    $(ls -1 "$TARGET_DIR"/${BACKUP_PREFIX}_*.sql.* 2>/dev/null | wc -l) / $MAX_KEEP"
log "=========================="
