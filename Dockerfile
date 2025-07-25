# Multi-stage Docker build for Rust Terminal Forge
# Optimized for security, performance, and minimal image size

# Frontend build stage
FROM node:18-alpine AS frontend-builder
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --only=production --silent

# Copy source and build
COPY . .
RUN npm run build

# Rust build stage
FROM rust:1.75-alpine AS rust-builder

# Install build dependencies
RUN apk add --no-cache \
    musl-dev \
    openssl-dev \
    pkgconfig

WORKDIR /app

# Copy Cargo files first for dependency caching
COPY Cargo.toml Cargo.lock ./

# Create dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm src/main.rs

# Copy real source and build
COPY src ./src
RUN touch src/main.rs
RUN cargo build --release

# Final runtime stage
FROM alpine:latest

# Install runtime dependencies
RUN apk add --no-cache \
    nodejs \
    npm \
    ca-certificates \
    tzdata \
    tini

# Install serve globally for static file serving
RUN npm install -g serve

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy built assets with correct ownership
COPY --from=frontend-builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=rust-builder --chown=appuser:appgroup /app/target/release/server ./server
COPY --from=rust-builder --chown=appuser:appgroup /app/target/release/pty-server ./pty-server

# Make binaries executable
RUN chmod +x ./server ./pty-server

# Create start script
RUN echo '#!/bin/sh' > start.sh && \
    echo './server &' >> start.sh && \
    echo './pty-server &' >> start.sh && \
    echo 'serve -s dist -p ${PORT:-8080}' >> start.sh && \
    chmod +x start.sh && \
    chown appuser:appgroup start.sh

# Switch to non-root user
USER appuser:appgroup

# Expose ports
EXPOSE 3000 8080 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start all services
CMD ["./start.sh"]