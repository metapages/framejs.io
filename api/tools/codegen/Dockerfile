# Bugs in codegen dependencies, need to containerize as a specific node version


FROM ubuntu:24.04

# Avoid interactive prompts during build
ENV DEBIAN_FRONTEND=noninteractive

# Install system deps
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22 from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get update \
    && apt-get install -y nodejs just \
    && rm -rf /var/lib/apt/lists/*

# Verify install
RUN node --version && npm --version

# Set working directory
WORKDIR /app/api/tools/codegen

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

