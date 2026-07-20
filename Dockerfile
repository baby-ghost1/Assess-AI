# ---- Build Client ----
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production 2>/dev/null || npm install
COPY client/ .
RUN npm run build

# ---- Build Server ----
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --only=production 2>/dev/null || npm install
COPY server/ .

# ---- Production ----
FROM node:20-alpine
RUN apk add --no-cache tini
WORKDIR /app

COPY --from=server-build /app/server /app/server
COPY --from=client-build /app/client/dist /app/client/dist

EXPOSE 5000

ENV NODE_ENV=production
ENV CLIENT_URL=""
ENV MONGODB_URI=""
ENV REDIS_URL=""
ENV JWT_ACCESS_SECRET=""
ENV JWT_REFRESH_SECRET=""

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/src/app.js"]
