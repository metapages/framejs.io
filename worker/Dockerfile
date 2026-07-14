# deno not node because long-term deno will be used for all non-trivial scripting
FROM denoland/deno:ubuntu-2.9.1

# Update package list and install essential packages
RUN apt-get update && apt-get install -y \
    bash \
    curl \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

###############################################################################
# vite@5 requires node >= 20
###############################################################################
# Install Node.js 20.x from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get remove -y nodejs nodejs-doc libnode-dev || true \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g npm@11.2.0
    
###############################################################################
# justfile for running commands, you will mostly interact with just https://github.com/casey/just
###############################################################################
# Install just from the official repository
RUN curl -fsSL https://just.systems/install.sh | bash -s -- --to /usr/local/bin

# alias "j" to just, it's just right there index finger
RUN echo '#!/bin/bash\njust "$@"' > /usr/bin/j && \
    chmod +x /usr/bin/j
ENV JUST_SUPPRESS_DOTENV_LOAD_WARNING=1

###############################################################################
# watchexec for fast development reloading
###############################################################################
# Install watchexec from the official repository
RUN curl -L -o /usr/local/bin/watchexec https://github.com/watchexec/watchexec/releases/download/v1.22.0/watchexec-1.22.0-x86_64-unknown-linux-gnu \
    && chmod +x /usr/local/bin/watchexec

WORKDIR /app/worker

# Ensure docs directory exists (overridden by volume mount when docs are built)
RUN mkdir -p /app/worker/docs
