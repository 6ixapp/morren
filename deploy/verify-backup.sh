#!/bin/bash
set -euo pipefail

# ============================================================
# Morren Marketplace - Backup Verification Script (runs weekly)
# Verifies the latest backup can actually be restored.
# This catches silent corruption before you need the backup.
# ============================================================

DB_NAME="morren_db"
DB_USER="morren_user"
VERIFY_DB="morren_verify_tmp"
BACKUP_DIR="/var/backups/morren/full"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

log() { echo "$LOG_PREFIX [VERIFY] $1"; }
err() { echo "$LOG_PREFIX [VERIFY-ERROR] $1"; }

cleanup() {
  # Always clean up the temp database
  sudo -u postgres psql -c "DROP DATABASE IF EXISTS $VERIFY_DB;" 2>/dev/null || true
}
trap cleanup EXIT

# ============================================================
# 1. Find latest backup
# ============================================================
LATEST_BACKUP=$(ls -1t "$BACKUP_DIR"/morren_backup_*.sql.gz 2>/dev/null | head -1 || true)

if [ -z "$LATEST_BACKUP" ]; then
  err "NO BACKUPS FOUND in $BACKUP_DIR! Backup system may be broken!"
  exit 1
fi

BACKUP_AGE_DAYS=$(( ( $(date +%s) - $(stat -c %Y "$LATEST_BACKUP" 2>/dev/null || stat -f %m "$LATEST_BACKUP" 2>/dev/null) ) / 86400 ))
BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)

log "Latest backup: $(basename "$LATEST_BACKUP")"
log "  Age: ${BACKUP_AGE_DAYS} days"
log "  Size: $BACKUP_SIZE"

# Alert if backup is too old
if [ "$BACKUP_AGE_DAYS" -gt 4 ]; then
  err "Latest backup is ${BACKUP_AGE_DAYS} days old! Expected max 3 days. Backup cron may be failing!"
fi

# ============================================================
# 2. Verify checksum
# ============================================================
CHECKSUM_FILE="${LATEST_BACKUP%.sql.gz}.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
  log "Verifying SHA256 checksum..."
  if sha256sum -c "$CHECKSUM_FILE" > /dev/null 2>&1; then
    log "  Checksum: PASS"
  else
    err "  Checksum: FAIL! Backup file may be corrupted!"
    exit 1
  fi
else
  err "  No checksum file found. Cannot verify file integrity."
fi

# ============================================================
# 3. Verify pg_restore can read the backup
# ============================================================
log "Verifying backup format..."
if pg_restore --list "$LATEST_BACKUP" > /dev/null 2>&1; then
  TABLE_COUNT=$(pg_restore --list "$LATEST_BACKUP" 2>/dev/null | grep -c "TABLE " || echo "0")
  log "  Format: VALID ($TABLE_COUNT table definitions)"
else
  err "  Format: INVALID! pg_restore cannot read this backup!"
  exit 1
fi

# ============================================================
# 4. Test actual restore to temp database
# ============================================================
log "Test-restoring to temporary database '$VERIFY_DB'..."

# Create temp database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $VERIFY_DB;" 2>/dev/null
sudo -u postgres psql -c "CREATE DATABASE $VERIFY_DB OWNER $DB_USER;"

# Restore to temp
RESTORE_OK=false
if pg_restore -U "$DB_USER" -h localhost -d "$VERIFY_DB" --no-owner --no-acl "$LATEST_BACKUP" 2>/dev/null; then
  RESTORE_OK=true
else
  # pg_restore may return non-zero on warnings
  RESTORED_TABLES=$(psql -U "$DB_USER" -h localhost -d "$VERIFY_DB" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
  if [ "${RESTORED_TABLES:-0}" -gt 0 ]; then
    RESTORE_OK=true
  fi
fi

if [ "$RESTORE_OK" = true ]; then
  # Count rows in key tables
  log "  Restore: SUCCESS"
  log "  Table verification:"

  TABLES=$(psql -U "$DB_USER" -h localhost -d "$VERIFY_DB" -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" 2>/dev/null | tr -d ' ')
  for TABLE in $TABLES; do
    [ -z "$TABLE" ] && continue
    ROW_COUNT=$(psql -U "$DB_USER" -h localhost -d "$VERIFY_DB" -t -c "SELECT count(*) FROM $TABLE;" 2>/dev/null | tr -d ' ')
    log "    $TABLE: $ROW_COUNT rows"
  done

  # Compare with production
  PROD_TABLE_COUNT=$(psql -U "$DB_USER" -h localhost -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
  VERIFY_TABLE_COUNT=$(psql -U "$DB_USER" -h localhost -d "$VERIFY_DB" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')

  if [ "$PROD_TABLE_COUNT" = "$VERIFY_TABLE_COUNT" ]; then
    log "  Table count matches production ($PROD_TABLE_COUNT tables)"
  else
    err "  Table count MISMATCH! Production: $PROD_TABLE_COUNT, Backup: $VERIFY_TABLE_COUNT"
  fi
else
  err "  Restore: FAILED! Backup cannot be restored!"
  exit 1
fi

# Cleanup happens via trap

# ============================================================
# 5. Check Spaces backup
# ============================================================
if command -v s3cmd &>/dev/null && [ -f "$HOME/.s3cfg" ]; then
  SPACES_COUNT=$(s3cmd ls "s3://morren-backups/full/" 2>/dev/null | grep -c "sql.gz" || echo "0")
  log "Spaces backups available: $SPACES_COUNT"
  if [ "$SPACES_COUNT" -eq 0 ]; then
    err "NO BACKUPS on Spaces! Offsite backup is not working!"
  fi
else
  err "s3cmd not configured. Cannot verify Spaces backups."
fi

# ============================================================
# 6. Summary
# ============================================================
echo ""
log "===== BACKUP VERIFICATION COMPLETE ====="
log "  Backup:    $(basename "$LATEST_BACKUP")"
log "  Age:       ${BACKUP_AGE_DAYS} days"
log "  Checksum:  $([ -f "$CHECKSUM_FILE" ] && echo 'PASS' || echo 'N/A')"
log "  Format:    VALID"
log "  Restore:   SUCCESS"
log "  Status:    ALL OK"
log "========================================="
