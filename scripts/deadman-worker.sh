#!/bin/sh
# Poll the dead-man's switch while this preview/server is up.
SECRET="${CRON_SECRET:-vaulty-dev-cron}"
while true; do
  sleep 45
  curl -sf -o /dev/null --max-time 8 -X POST \
    -H "Authorization: Bearer ${SECRET}" \
    http://127.0.0.1:8080/api/deadman/tick || true
done
