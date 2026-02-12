#!/bin/bash

# ============================================================
# Morren Marketplace - Disk Space Monitor (runs daily)
# Alerts on low disk space and cleans up if critical.
# ============================================================

LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"
WARN_THRESHOLD=80   # Warning at 80%
CRITICAL_THRESHOLD=90  # Emergency cleanup at 90%

log() { echo "$LOG_PREFIX [DISK] $1"; }
err() { echo "$LOG_PREFIX [DISK-CRITICAL] $1"; }

# Get disk usage percentage for root partition
DISK_PERCENT=$(df / | awk 'NR==2 {gsub(/%/,""); print $5}')
DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}')

log "Disk usage: ${DISK_PERCENT}% (${DISK_AVAIL} available)"

# ============================================================
# 1. Warning level
# ============================================================
if [ "$DISK_PERCENT" -ge "$WARN_THRESHOLD" ] && [ "$DISK_PERCENT" -lt "$CRITICAL_THRESHOLD" ]; then
  err "Disk usage at ${DISK_PERCENT}%! Available: ${DISK_AVAIL}"
  log "Consider cleaning: old logs, WAL archives, or old backups"
fi

# ============================================================
# 2. Critical level - emergency cleanup
# ============================================================
if [ "$DISK_PERCENT" -ge "$CRITICAL_THRESHOLD" ]; then
  err "EMERGENCY: Disk at ${DISK_PERCENT}%! Running cleanup..."

  # Clean old PM2 logs (keep last 1000 lines)
  pm2 flush 2>/dev/null && log "Flushed PM2 logs"

  # Clean old WAL archives (keep last 3 days instead of 7)
  CLEANED=$(find /var/backups/morren/wal-archive -type f -mtime +3 -delete -print 2>/dev/null | wc -l)
  log "Cleaned $CLEANED old WAL archive files"

  # Clean old pre-deploy backups (keep last 1)
  PRE_DEPLOY_COUNT=$(ls -1 /var/backups/morren/pre-deploy/morren_predeploy_*.sql.gz 2>/dev/null | wc -l)
  if [ "$PRE_DEPLOY_COUNT" -gt 1 ]; then
    ls -1t /var/backups/morren/pre-deploy/morren_predeploy_*.sql.gz | tail -n +2 | while read -r f; do
      rm -f "$f" && log "Deleted old pre-deploy backup: $(basename "$f")"
    done
  fi

  # Clean apt cache
  apt-get clean 2>/dev/null && log "Cleaned apt cache"

  # Clean old systemd journal logs (keep 3 days)
  journalctl --vacuum-time=3d 2>/dev/null && log "Cleaned journal logs"

  NEW_PERCENT=$(df / | awk 'NR==2 {gsub(/%/,""); print $5}')
  log "After cleanup: ${NEW_PERCENT}%"

  if [ "$NEW_PERCENT" -ge "$CRITICAL_THRESHOLD" ]; then
    err "STILL CRITICAL after cleanup (${NEW_PERCENT}%). MANUAL INTERVENTION REQUIRED!"
  fi
fi

# ============================================================
# 3. Check backup directory sizes
# ============================================================
log "Backup storage usage:"
log "  Full backups:      $(du -sh /var/backups/morren/full 2>/dev/null | cut -f1 || echo 'N/A')"
log "  Pre-deploy:        $(du -sh /var/backups/morren/pre-deploy 2>/dev/null | cut -f1 || echo 'N/A')"
log "  WAL archives:      $(du -sh /var/backups/morren/wal-archive 2>/dev/null | cut -f1 || echo 'N/A')"
log "  App logs:          $(du -sh /var/log/morren 2>/dev/null | cut -f1 || echo 'N/A')"
