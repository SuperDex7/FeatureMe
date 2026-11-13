#!/bin/bash
#
# Makes the nginx container pick up renewed certificates (no downtime).
# certbot runs this after a successful renewal (see scripts/renew-certs.sh).

set -uo pipefail

cd /home/ubuntu/FeatureMe || exit 1

if docker-compose -f docker-compose.prod.yml exec -T nginx nginx -s reload 2>/dev/null; then
    echo "nginx reloaded"
    exit 0
fi

# Fall back to the container by name (e.g. if docker-compose isn't on PATH for cron)
CONTAINER=$(docker ps --filter "name=nginx" --format "{{.Names}}" | head -1)
if [ -n "$CONTAINER" ] && docker exec "$CONTAINER" nginx -s reload; then
    echo "nginx reloaded ($CONTAINER)"
    exit 0
fi

echo "Couldn't reload nginx. Run: docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload"
exit 1
