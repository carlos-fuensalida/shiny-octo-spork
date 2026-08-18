# Minimal hello-world — test image for proving out the Docker + Cloud Run
# pipeline in isolation, independent of the frontend/backend apps.
#
# Single stage: there are no dependencies and no build step, so there's
# nothing to gain from splitting into deps/build/runner stages the way the
# backend's Dockerfile does.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./

# node:22-alpine ships a non-root "node" user (uid 1000) out of the box —
# no need to addgroup/adduser like the backend's Dockerfile does for its
# custom "nestjs" user.
USER node

# Cloud Run injects PORT to match whatever --port the deploy step used;
# server.js reads process.env.PORT at runtime. 8080 documents the Cloud Run
# convention this pipeline deploys with (same as backend/frontend).
EXPOSE 8080
CMD ["node", "server.js"]
