# FIFA VIP Dashboard - AI Agent Instructions

## Project Overview
FIFA VIP Dashboard is a public-facing (no auth required) real-time information display built for Microsoft Surface Hub. Shows Zurich weather, world news, and football/FIFA news with auto-refresh. Stack: React 19 + TypeScript + Tailwind 4 + Express + tRPC + PostgreSQL (Supabase) + Drizzle ORM.

## Architecture & Data Flow

### Backend Structure (`server/`)
- **Entry**: `server/_core/index.ts` starts Express + tRPC, uses Vite in dev, static files in prod
- **Routers**: `server/routers.ts` exports `appRouter` with tRPC procedures:
  - `news.getWorld/getFootball()` - returns cached articles from `newsCache` table
  - `weather.getZurich()` - returns cached Zurich weather from `weatherCache` table
  - `matches.getLive()` - returns live/recent match scores from `matchesCache` table
- **Services**: `server/services.ts` contains API fetching logic (NewsAPI.org, Open-Meteo, match APIs)
- **Database**: `server/db.ts` contains Drizzle query helpers; schema in `drizzle/schema.ts`
- **Background Jobs**: `server/jobs.ts` runs periodic tasks (news/weather/match cache refresh every 5-15 min)

### Frontend Structure (`client/src/`)
- **App**: `App.tsx` uses `wouter` for routing (patched version in `patches/`), single route `/` → `Home.tsx`
- **API Calls**: `lib/trpc.ts` configures tRPC client; components call `trpc.news.getWorld.useQuery()` etc.
- **UI Components**: Radix UI primitives in `components/ui/`, custom components in `components/`
- **Styling**: Tailwind 4 with `@tailwindcss/vite`, theme in `ThemeContext.tsx` (default light mode)

### Database Schema (`drizzle/schema.ts`)
- `users` - Manus OAuth users (role: user|admin), but dashboard is public access
- `newsCache` - cached news articles (category: 'world'|'football')
- `weatherCache` - cached Zurich weather data
- `matchesCache` - cached match scores (status: 'scheduled'|'live'|'finished')

**Note:** Uses PostgreSQL (Supabase) with auto-incrementing identity columns.

## Key Commands

```bash
pnpm dev              # Dev server with tsx watch + Vite HMR (auto port 3000+)
pnpm build            # Vite build client + esbuild bundle server
pnpm start            # Production server from dist/
pnpm db:push          # Generate + migrate Drizzle schema
pnpm test             # Run vitest tests
pnpm check            # TypeScript check without emit
```

## Project-Specific Conventions

### tRPC Pattern
- All API routes are tRPC procedures in `server/routers.ts`
- Use `publicProcedure` (no auth required for this dashboard)
- Frontend calls via `trpc.*.useQuery()` from `@tanstack/react-query`

### Caching Strategy
- Background jobs fetch fresh data every 5-15 minutes (see `server/jobs.ts`)
- Database caches prevent excessive external API calls
- Query helpers in `server/db.ts` return latest cached records

### External APIs (see `API_RESEARCH.md`)
- **Weather**: Open-Meteo (no key, Zurich coords: 47.3769, 8.5472)
- **News**: NewsAPI.org (requires `NEWS_API_KEY` env var)
- **Matches**: Football-Data.org (requires `FOOTBALL_DATA_API_KEY` env var)
- **Database**: Supabase PostgreSQL (requires `DATABASE_URL` with SSL)

### Styling Approach
- Tailwind 4 with CSS variables for theming (see `client/src/index.css`)
- Radix UI + `class-variance-authority` for component variants
- `cn()` utility in `lib/utils.ts` merges Tailwind classes

### Patched Dependencies
- `wouter@3.7.1` has custom patch in `patches/` (applied via pnpm)
- Override `tailwindcss>nanoid` to 3.3.7 for compatibility

## When Adding Features

1. **New API endpoint**: Add procedure to `server/routers.ts`, implement in `server/services.ts`
2. **New cache table**: Update `drizzle/schema.ts`, run `pnpm db:push`, add query helpers to `server/db.ts`
3. **Background refresh**: Add job function to `server/jobs.ts` with interval
4. **UI component**: Use existing Radix primitives from `components/ui/` or create in `components/`
5. **Frontend query**: Call `trpc.<router>.<procedure>.useQuery()` with auto-refresh via `refetchInterval`

## Deployment Guide

### 1. Build Artifacts
`pnpm build` produces:
- Server bundle (ESM) at `dist/index.js`
- Client static assets under `dist/public/`

### 2. Containerization
A multi-stage `Dockerfile` is included:
1. Build stage installs all deps and runs `pnpm build`
2. Production stage installs only production deps then copies `dist/`

Build locally:
```bash
docker build -t fifa-vip:local .
docker run --env-file .env -p 3000:3000 fifa-vip:local
```
The server may auto-shift port if 3000 busy; container exposes 3000.

### 3. Database
Use PostgreSQL (Supabase recommended for free tier). Example docker-compose provided (`docker-compose.yml`) uses MariaDB for local dev. For production with Supabase:
```bash
# Get connection string from Supabase dashboard
export DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
pnpm db:push
```
See `SUPABASE_DEPLOYMENT.md` for detailed setup.

### 4. Environment Variables (Secrets)
Required for production:
- `DATABASE_URL` e.g. `postgresql://postgres:password@db.xxx.supabase.co:5432/postgres`
- `NEWS_API_KEY` (NewsAPI.org key)
- `FOOTBALL_DATA_API_KEY` (Football-Data.org key)
Optional / conditional: OAuth variables if enabling Manus authentication.
Store these in your cloud provider secrets (Render, Railway, Fly, Azure, etc.) or GitHub Encrypted Secrets for CI/CD.

### 5. GitHub Container Registry (GHCR) Publishing
Workflow `.github/workflows/deploy.yml` builds & pushes image `ghcr.io/<owner>/fifa-vip:latest` on pushes to `master`.
Consume the image on your host with:
```bash
docker pull ghcr.io/<owner>/fifa-vip:latest
docker run -e DATABASE_URL=... -e NEWS_API_KEY=... -e FOOTBALL_DATA_API_KEY=... -p 3000:3000 ghcr.io/<owner>/fifa-vip:latest
```

### 6. Hosting Options
- **Render / Railway**: Create a new Web Service from GitHub. Build Command: `pnpm install --frozen-lockfile && pnpm build`. Start Command: `pnpm start`. Add a separate Managed MySQL instance; set `DATABASE_URL` secret.
- **Fly.io**: Use the Docker image or generate a `fly.toml`. Provide persistent volume for database (or use external managed DB). Deploy with `fly launch` then `fly deploy`.
- **Azure App Service**: Use Docker image (recommended) or Node build. Configure Startup Command `node dist/index.js` after build. Use Azure Database for MySQL.
- **AWS (Elastic Beanstalk / ECS Fargate)**: Deploy container; attach RDS MySQL. Provide env vars in task definition.
- **Vercel**: Not ideal for long-lived background jobs (cron refresh). If used, move background jobs to serverless cron (Vercel Cron) or external worker and adapt code (avoid long-running intervals in server). Keep MySQL externally (PlanetScale).
- **GitHub Pages**: Only serves static assets—cannot host Express/tRPC. You would need to deploy backend elsewhere and point frontend to remote API (adjust TRPC client URL).

### 7. Scaling & Background Jobs
`server/jobs.ts` starts interval jobs when the process launches. For serverless platforms, replace intervals with scheduled invocations, or gate job start behind an env flag (e.g., `ENABLE_JOBS=true`).

### 8. Health & Monitoring
- Consider adding a `/api/health` procedure or simple Express route to report DB connectivity & cache stats for load balancers.
- Use container logs to watch for `429` rate limits on match API; implement exponential backoff if upgrading hosting.

### 9. Zero-Downtime Migrations
For production: run `pnpm db:push` in a CI step before deploying new app code, or use manual migration pipeline. Drizzle keeps snapshot files in `drizzle/`—version these with the repo.

### 10. Security Notes
- Do not bake secrets into the image.
- Ensure `NEWS_API_KEY` & `FOOTBALL_DATA_API_KEY` are read from environment only.
- Restrict DB user to necessary privileges.

### 11. Custom Domain
Set up reverse proxy (Nginx / Caddy / Traefik) terminating TLS and forwarding to container port 3000. Example Caddyfile:
```
yourdomain.com {
  reverse_proxy  localhost:3000
}
```

### 12. Future Enhancements (Deployment)
- Add multi-arch build (linux/arm/v8) with `docker buildx`.
- Introduce a `HEALTHCHECK` in Dockerfile hitting `/api/trpc` noop procedure.
- Add Sentry / OpenTelemetry instrumentation.


## Critical Files to Reference
- `server/routers.ts` - All tRPC API endpoints
- `drizzle/schema.ts` - Database tables and types
- `server/jobs.ts` - Background task scheduling
- `client/src/App.tsx` - Routing and theme setup
- `userGuide.md` - Product requirements and feature descriptions
