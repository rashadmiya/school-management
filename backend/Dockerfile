# backend/Dockerfile
# Use Node.js LTS
FROM node:22-alpine

# Create working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
# RUN npm install
RUN npm ci

# Copy application source
COPY . .

# Expose application port
EXPOSE 8000

# Start application
CMD ["npm", "start"]