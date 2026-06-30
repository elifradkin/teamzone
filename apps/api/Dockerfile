# Build + run the NestJS API in a pnpm monorepo. Build context = repo root.
FROM node:22-slim AS build
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @teamzone/api exec prisma generate
RUN pnpm --filter @teamzone/api build

FROM node:22-slim AS runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3000
# Sync the schema (Phase 1 uses db push; migrations come before launch), then start.
CMD ["sh", "-c", "pnpm exec prisma db push --skip-generate --accept-data-loss && node dist/main.js"]
