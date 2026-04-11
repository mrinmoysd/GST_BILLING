FROM node:22-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY prisma prisma
RUN npm ci

FROM deps AS builder
COPY tsconfig.json tsconfig.json
COPY apps/api apps/api
RUN npm --workspace apps/api run prisma:generate
RUN npm --workspace apps/api run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY prisma prisma
RUN npm ci --omit=dev
RUN npm --workspace apps/api run prisma:generate:prod

COPY --from=builder /app/apps/api/dist apps/api/dist

EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
