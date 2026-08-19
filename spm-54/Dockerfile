# SPMS Data API (Backend A) — NestJS, built for Google Cloud Run.
#
# Multi-stage: dev dependencies (needed for `nest build`) never end up in the
# final image, and the app runs as a non-root user. Runtime config
# (FRONTEND_BASE_URL required; PORT, FRONTEND_ORIGIN, SESSION_COOKIE_DOMAIN,
# SESSION_JWT_SECRET optional) is read from process.env at container start —
# nothing here is baked in at build time, so no --build-arg is needed
# (see src/app.module.ts, src/main.ts).

# ---- deps: install once with dev deps, reused by the build stage ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile TypeScript (nest build) ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- prod-deps: same lockfile, production dependencies only ----
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- runner: minimal runtime image ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Cloud Run injects PORT to match the --port value the service was deployed
# with (main.ts reads process.env.PORT, default 3001 for local runs).
# 8080 documents the Cloud Run convention this pipeline deploys with.
EXPOSE 8080

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER nestjs

CMD ["node", "dist/main"]
