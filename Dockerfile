
FROM node:20-bookworm-slim

WORKDIR /app

# Install production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy backend source code
COPY . .

# Create uploads directory
RUN mkdir -p /app/upload

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]
