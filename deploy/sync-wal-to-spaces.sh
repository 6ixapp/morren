#!/bin/bash

# ============================================================
# Morren Marketplace - WAL Archive Sync to DO Spaces (every 6 hours)
# Syncs PostgreSQL WAL files to offsite storage for
# point-in-time recovery even if the droplet is destroyed.
# ============================================================

WAL_DIR="/var/backups/morren/wal-archive"
SPACES_BUCKET="morren-backups"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

log() { echo "$LOG_PREFIX [WAL-SYNC] $1"; }
err() { echo "$LOG_PREFIX [WAL-SYNC-ERROR] $1"; }

# Check if s3cmd is configured
if ! command -v s3cmd &>/dev/null || [ ! -f "$HOME/.s3cfg" ]; then
  err "s3cmd not configured. WAL sync skipped."
  exit 1
fi

# Check if WAL directory exists and has files
if [ ! -d "$WAL_DIR" ]; then
  err "WAL archive directory not found: $WAL_DIR"
  exit 1
fi

WAL_COUNT=$(ls -1 "$WAL_DIR" 2>/dev/null | wc -l)
if [ "$WAL_COUNT" -eq 0 ]; then
  log "No WAL files to sync."
  exit 0
fi

log "Syncing $WAL_COUNT WAL files to Spaces..."

# Sync only new files (s3cmd sync handles this)
if s3cmd sync "$WAL_DIR/" "s3://$SPACES_BUCKET/wal-archive/" --no-delete-removed 2>&1; then
  log "WAL sync completed successfully"
else
  err "WAL sync FAILED! Point-in-time recovery may have gaps."
  exit 1
fi

# Report
SPACES_WAL_COUNT=$(s3cmd ls "s3://$SPACES_BUCKET/wal-archive/" 2>/dev/null | wc -l)
WAL_SIZE=$(du -sh "$WAL_DIR" 2>/dev/null | cut -f1)
log "Local WAL files: $WAL_COUNT ($WAL_SIZE), Spaces WAL files: $SPACES_WAL_COUNT"
