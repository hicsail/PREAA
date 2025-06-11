#!/bin/bash

# Build script for custom LibreChat with model caching fix

echo "🔨 Building custom LibreChat image with model caching fix..."

# Change to the correct directory
cd "$(dirname "$0")"

# Build the custom LibreChat image
docker-compose build librechat

echo "✅ Custom LibreChat image built successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start the services: docker-compose up -d"
echo "2. Test by entering your LiteLLM API key in LibreChat"
echo "3. Models should now refresh when you add new API keys"
echo ""
echo "🔧 Key features added:"
echo "- Per-endpoint+key model caching instead of global caching"
echo "- Models cache invalidation when user keys are updated"
echo "- Dynamic model fetching for user-provided API keys" 