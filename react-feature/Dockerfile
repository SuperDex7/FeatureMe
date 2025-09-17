# Multi-stage Dockerfile for React (Vite)

# ===== Build stage =====
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

# ===== Runtime stage (nginx) =====
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy build output
COPY --from=build /app/dist/ .

# Copy nginx configuration for client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Basic healthcheck on root
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ >/dev/null 2>&1 || exit 1

EXPOSE 80
