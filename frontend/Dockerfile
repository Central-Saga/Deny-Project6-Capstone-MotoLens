FROM node:20-alpine

WORKDIR /app

# Install all dependencies (including devDependencies required by Tailwind CSS & TypeScript)
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build argument for Next.js public API url
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js application
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

CMD ["npx", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
