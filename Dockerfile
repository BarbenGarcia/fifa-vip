# syntax=docker/dockerfile:1
## Multi-stage build for FIFA VIP Dashboard
## Stage 1: Build client (Vite) + bundle server (esbuild)
FROM node:20-alpine AS build
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV NODE_ENV=development
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
COPY tsconfig.json vite.config.ts ./
COPY drizzle.config.ts ./
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY drizzle ./drizzle
COPY .github ./ .github
COPY API_RESEARCH.md userGuide.md ./
RUN pnpm install --frozen-lockfile
# Build client + server (creates dist/ with server bundle + dist/public with client assets)
RUN pnpm build

## Stage 2: Production runtime image
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
RUN corepack enable
# Copy package manifests & patches so pnpm can apply patch resolutions
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
# Install only production dependencies (esbuild bundle marks deps external)
RUN pnpm install --prod --frozen-lockfile
# Copy built artifacts from build stage
COPY --from=build /app/dist ./dist
# Expose preferred port (will auto-select available if busy)
EXPOSE 3000
# Default command
CMD ["node", "dist/index.js"]
