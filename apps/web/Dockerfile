# ============================================================
# Stage 1: install dependencies
# ============================================================
FROM node:22-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ============================================================
# Stage 2: build the app
# ============================================================
FROM node:22-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `prisma generate` only needs the schema, not a live connection - but
# prisma.config.ts resolves DATABASE_URL via env() and errors if it's
# entirely unset. This placeholder never reaches the runtime image (only
# this build stage sees it); the real value is injected at container
# start via docker-compose.yml's environment block.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

# Prisma needs its client generated against this stage's platform
# (linux) before the Next.js build, since API routes import it directly.
RUN npx prisma generate

# DATABASE_URL isn't needed at build time for this project (no static
# generation touches the DB), but Next.js still requires *some* value
# for env vars referenced in code during the build step.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================================
# Stage 3: run - minimal image, only what's needed at runtime
# ============================================================
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Standalone output already bundles only the necessary node_modules
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma's generated client + query engine binary aren't always fully
# picked up by the standalone trace - copy them explicitly to be safe.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
