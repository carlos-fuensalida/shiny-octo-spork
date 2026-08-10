FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
ENV HUSKY=0
RUN npm ci --include=optional

FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL
ARG INTERNAL_API_BASE_URL
ARG NEXT_PUBLIC_CHAT_API_BASE_URL
# Next.js inlines NEXT_PUBLIC_* into the browser bundle at build time, so a
# missing value can't be caught at runtime the way a normal env var would be.
# src/services/http.ts and src/proxy.ts both fall back to '' when unset,
# which builds successfully but 500s on every request. Fail the build instead.
RUN test -n "$NEXT_PUBLIC_API_BASE_URL" || (echo "NEXT_PUBLIC_API_BASE_URL build-arg is required" && exit 1)
RUN test -n "$NEXT_PUBLIC_CHAT_API_BASE_URL" || (echo "NEXT_PUBLIC_CHAT_API_BASE_URL build-arg is required" && exit 1)
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV INTERNAL_API_BASE_URL=${INTERNAL_API_BASE_URL}
ENV NEXT_PUBLIC_CHAT_API_BASE_URL=${NEXT_PUBLIC_CHAT_API_BASE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL
ARG INTERNAL_API_BASE_URL
ARG NEXT_PUBLIC_CHAT_API_BASE_URL
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV INTERNAL_API_BASE_URL=${INTERNAL_API_BASE_URL}
ENV NEXT_PUBLIC_CHAT_API_BASE_URL=${NEXT_PUBLIC_CHAT_API_BASE_URL}

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
