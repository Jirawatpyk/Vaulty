#!/bin/sh
set -eu
cd /workspace
export CRON_SECRET="${CRON_SECRET:-vaulty-dev-cron}"
# :8081 is QA-only — a revive must never inherit a stale built-output preview.
node scripts/preview.mjs stop || true
WORKER_PID=/tmp/deadman-worker.pid
if [ -f "$WORKER_PID" ] && kill -0 "$(cat "$WORKER_PID")" 2>/dev/null; then
  kill "$(cat "$WORKER_PID")" 2>/dev/null || true
  sleep 0.2
fi
sh /workspace/scripts/deadman-worker.sh >>/tmp/deadman-worker.log 2>&1 &
echo $! > "$WORKER_PID"
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
