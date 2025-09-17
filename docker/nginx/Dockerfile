FROM nginx:1.27-alpine

# Create directories for SSL certificates (will be mounted via volumes)
RUN mkdir -p /etc/nginx/certs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health >/dev/null 2>&1 || exit 1

EXPOSE 80 443
