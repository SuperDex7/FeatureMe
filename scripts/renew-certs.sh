#!/bin/bash
#
# Renews the featureme.co Let's Encrypt certificate when it's due, without
# stopping the site, and reloads nginx so it serves the new one.
#
#   sudo ./scripts/renew-certs.sh            renew if due (within 30 days of expiry)
#   sudo ./scripts/renew-certs.sh --dry-run  test the whole process against Let's Encrypt's
#                                            test server without changing anything
#
# Safe to run as often as you like: certbot does nothing until the certificate
# is within 30 days of expiring. The first run also schedules itself twice a
# day (/etc/cron.d/featureme-certbot), and every deploy to main runs it too.
#
# How it works: Let's Encrypt checks we own the domain by fetching
# http://featureme.co/.well-known/acme-challenge/<token>. certbot writes the
# token into /var/www/certbot, which the nginx container serves on port 80
# (see docker/nginx.conf and the nginx volumes in deploy.yml), so nginx keeps
# running the whole time.

set -euo pipefail

# cron starts with a minimal PATH; certbot is usually in /snap/bin
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin:$PATH"

PROJECT_DIR=/home/ubuntu/FeatureMe
WEBROOT=/var/www/certbot
SELF="$PROJECT_DIR/scripts/renew-certs.sh"
RELOAD_HOOK="$PROJECT_DIR/scripts/reload-nginx.sh"
CRON_FILE=/etc/cron.d/featureme-certbot
LOG=/var/log/featureme-certbot.log

if [ "$EUID" -ne 0 ]; then
    echo "Run with sudo: sudo $0 $*"
    exit 1
fi

if ! command -v certbot >/dev/null 2>&1; then
    echo "certbot isn't installed. Install it with: sudo snap install --classic certbot"
    exit 1
fi

mkdir -p "$WEBROOT"

# Schedule this script twice a day (random minute so we don't all hit
# Let's Encrypt on the hour). Written once, and again if it's from an older version.
if [ ! -f "$CRON_FILE" ] || ! grep -q "/snap/bin" "$CRON_FILE"; then
    MINUTE=$((RANDOM % 60))
    cat > "$CRON_FILE" <<EOF
# Renews the featureme.co certificate when due (installed by scripts/renew-certs.sh)
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin
$MINUTE 3,15 * * * root $SELF >> $LOG 2>&1
EOF
    chmod 644 "$CRON_FILE"
    echo "Scheduled automatic renewal: $CRON_FILE"
fi

echo "[$(date -Is)] Checking certificates"

# --webroot here also replaces an older "standalone" setup (which needs nginx
# stopped) in certbot's saved settings at the next renewal. --deploy-hook runs
# only when a certificate was actually renewed.
certbot renew \
    --non-interactive \
    --webroot -w "$WEBROOT" \
    --deploy-hook "$RELOAD_HOOK" \
    "$@"

echo "[$(date -Is)] Done"
