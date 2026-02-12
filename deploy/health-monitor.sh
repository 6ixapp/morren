#!/bin/bash

# ============================================================
# Morren Marketplace - Health Monitor (runs every 5 minutes)
# Checks app health, DB connectivity, and auto-restarts on failure.
# ============================================================

LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"
HEALTH_URL="http://localhost:5000/health"
DB_NAME="morren_db"
DB_USER="morren_user"
FAILURES_FILE="/tmp/morren-health-failures"

log() { echo "$LOG_PREFIX [MONITOR] $1"; }
err() { echo "$LOG_PREFIX [MONITOR-ERROR] $1"; }

# ============================================================
# 1. Check application health
# ============================================================
APP_HEALTHY=true
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" != "200" ]; then
  APP_HEALTHY=false
  err "App health check failed (HTTP $HTTP_CODE)"
fi

# ============================================================
# 2. Check PM2 process
# ============================================================
PM2_STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
try:
    procs = json.load(sys.stdin)
    for p in procs:
        if p['name'] == 'morren-backend':
            print(p['pm2_env']['status'])
            break
    else:
        print('not_found')
except:
    print('error')
" 2>/dev/null || echo "error")

if [ "$PM2_STATUS" != "online" ]; then
  APP_HEALTHY=false
  err "PM2 process status: $PM2_STATUS (expected: online)"
fi

# ============================================================
# 3. Check PostgreSQL
# ============================================================
DB_HEALTHY=true
if ! psql -U "$DB_USER" -h localhost -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
  DB_HEALTHY=false
  err "Database connection failed!"
fi

# ============================================================
# 4. Auto-recovery
# ============================================================
if [ "$APP_HEALTHY" = false ] && [ "$DB_HEALTHY" = true ]; then
  # Track consecutive failures
  FAILURES=$(cat "$FAILURES_FILE" 2>/dev/null || echo "0")
  FAILURES=$((FAILURES + 1))
  echo "$FAILURES" > "$FAILURES_FILE"

  if [ "$FAILURES" -ge 2 ]; then
    err "App unhealthy for $FAILURES consecutive checks. Restarting PM2..."
    pm2 restart morren-backend --env production 2>/dev/null
    sleep 5

    # Re-check after restart
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
      log "Auto-restart successful. App recovered."
      echo "0" > "$FAILURES_FILE"
    else
      err "Auto-restart FAILED. App still unhealthy after restart. Manual intervention needed."
    fi
  else
    err "App unhealthy ($FAILURES consecutive). Will restart after 2 failures."
  fi
elif [ "$APP_HEALTHY" = true ]; then
  # Reset failure counter on success
  echo "0" > "$FAILURES_FILE"
fi

if [ "$DB_HEALTHY" = false ]; then
  err "DATABASE IS DOWN! Checking if PostgreSQL service is running..."
  if ! systemctl is-active --quiet postgresql; then
    err "PostgreSQL service is stopped! Attempting restart..."
    sudo systemctl restart postgresql 2>/dev/null || err "Cannot restart PostgreSQL. MANUAL INTERVENTION REQUIRED."
  else
    err "PostgreSQL running but cannot connect. Check pg_hba.conf or credentials."
  fi
fi

# ============================================================
# 5. Memory check
# ============================================================
MEM_PERCENT=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_PERCENT" -gt 90 ]; then
  err "HIGH MEMORY USAGE: ${MEM_PERCENT}%! OOM risk."
fi

# Only log when there's something noteworthy
if [ "$APP_HEALTHY" = true ] && [ "$DB_HEALTHY" = true ] && [ "$MEM_PERCENT" -lt 90 ]; then
  # Quiet on success (log once per hour via minute check)
  MINUTE=$(date +%M)
  if [ "$MINUTE" = "00" ] || [ "$MINUTE" = "30" ]; then
    log "OK (HTTP:$HTTP_CODE, PM2:$PM2_STATUS, DB:ok, MEM:${MEM_PERCENT}%)"
  fi
fi
