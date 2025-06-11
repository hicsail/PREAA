# Custom LibreChat image with dynamic model loading fix
FROM ghcr.io/danny-avila/librechat:latest

# Copy the patches that enable dynamic model loading for user-provided API keys
# - ModelController.js: Removes global model caching to allow per-request model fetching
# - loadConfigModels.js: Implements proper user key resolution and per-endpoint caching
COPY patches/ModelController.js /app/api/server/controllers/ModelController.js
COPY patches/loadConfigModels.js /app/api/server/services/Config/loadConfigModels.js

# Set working directory
WORKDIR /app

# The base image already has all dependencies installed and the app built
# No need to rebuild unless we're changing package.json dependencies 