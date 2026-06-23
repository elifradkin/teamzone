# Single-stage image; the app runs TypeScript directly via tsx (simple for this scale).
FROM node:20-slim

WORKDIR /app

# Install deps first for better layer caching.
COPY package.json ./
RUN npm install --omit=dev && npm install tsx typescript

# App source + knowledge base.
COPY tsconfig.json ./
COPY src ./src
COPY knowledge ./knowledge

# users/ is a mounted volume at runtime (persistent private data) — not baked in.
ENV NODE_ENV=production
EXPOSE 3000

CMD ["npx", "tsx", "src/index.ts"]
