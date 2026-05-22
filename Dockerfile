FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN npm install turbo --global

FROM base AS builder
# Set working directory
WORKDIR /app
COPY . .
ARG APP_NAME
RUN turbo prune ${APP_NAME} --docker

FROM base AS installer
WORKDIR /app

# First install the dependencies
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install --legacy-peer-deps

# Build the project
COPY --from=builder /app/out/full/ .

# Generate prisma client for the database package
RUN npm run db:generate || true

ARG APP_NAME
# Set dummy environment variables for build time
ENV OPENAI_API_KEY="dummy-key-for-build"
ENV NEXTAUTH_SECRET="dummy-secret-for-build"
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npx turbo run build --filter=${APP_NAME}...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=installer /app/apps/${APP_NAME}/next.config.mjs .
COPY --from=installer /app/apps/${APP_NAME}/package.json .

# Copy nextjs standalone output
COPY --from=installer --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public

EXPOSE 3000

CMD node apps/${APP_NAME}/server.js
