FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY generated ./generated
COPY server.cjs ./server.cjs
USER node
CMD ["node", "server.cjs"]
