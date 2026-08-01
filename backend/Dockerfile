# syntax=docker/dockerfile:1

FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml nest-cli.json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
COPY tests ./tests
ENV DB_USER=postgres DB_PASSWORD=postgres DB_HOST=localhost DB_PORT=5432 DB_NAME=logs_loadtest
RUN pnpm exec prisma generate && pnpm build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate \
  && mkdir -p /tmp/log-uploads-loadtest
COPY package.json pnpm-lock.yaml nest-cli.json prisma.config.ts ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
EXPOSE 3335
HEALTHCHECK --interval=10s --timeout=5s --retries=12 --start-period=20s \
  CMD node -e "fetch('http://127.0.0.1:3335/log-files?page=1&pageSize=1').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/src/main.js"]
