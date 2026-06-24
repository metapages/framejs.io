FROM denoland/deno:ubuntu-2.4.3

RUN apt-get update && apt-get install -y \
    bash \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Node.js 20.x (required by Vite)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get remove -y nodejs nodejs-doc libnode-dev || true \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/frontend
