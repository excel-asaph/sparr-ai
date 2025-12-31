# Use official Node.js LTS image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port (Cloud Run uses PORT env variable)
EXPOSE 8080

# Set environment variable for port
ENV PORT=8080

# Start the server
CMD ["node", "server.js"]
