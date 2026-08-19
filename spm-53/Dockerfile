# SPMS Frontend — Next.js (standalone) on Google Cloud Run.
#
# `next build` runs BEFORE `docker build`, in the pipeline's "Build Next.js
# App" step (plain node:22-alpine, no Docker-in-Docker) — see
# bitbucket-pipelines.yml. This file only packages that already-built output
# into the runtime image.
#
# Moved out of `docker build` on 2026-08-11: running `next build` inside the
# Docker-in-Docker sidecar (`services: [docker]`) was 30-100x slower than
# running the identical command directly in a plain step (Turbopack likely
# over-detects available CPU inside the nested container and thrashes) —
# confirmed by comparing this Dockerfile's old in-image build against the
# other step's direct build (seconds vs. a run that blew Bitbucket's
# 120-minute step limit). NEXT_PUBLIC_* vars are therefore resolved and
# baked into `.next/standalone` at that earlier step, not here — this stage
# never sees them and doesn't need to.
FROM node:22-alpine AS runner
WORKDIR /app
ARG INTERNAL_API_BASE_URL
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV INTERNAL_API_BASE_URL=${INTERNAL_API_BASE_URL}

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --chown=nextjs:nodejs .next/standalone ./
COPY --chown=nextjs:nodejs .next/static ./.next/static
COPY --chown=nextjs:nodejs public ./public
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
