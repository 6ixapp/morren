FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies
RUN npm ci --only=production && npm cache clean --force

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
