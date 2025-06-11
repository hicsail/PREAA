# LibreChat Model Caching Fix (Safer Approach)

This custom LibreChat implementation fixes the issue where models don't appear when users enter new API keys using a **minimal, safer approach**.

## Problem

The original LibreChat caches models globally on startup. When users enter their own API keys (like LiteLLM virtual keys), the models associated with those keys don't appear because the cache isn't refreshed.

## Solution

This implementation applies a **minimal fix** inspired by [LibreChat PR #3251](https://github.com/danny-avila/LibreChat/pull/3251/files) that removes global model caching while keeping all original code structure intact.

### Key Changes (Minimal Approach)

1. **ModelController.js**: Only removes global model caching behavior
   - Keeps all original imports and structure
   - Skips `CacheKeys.MODELS_CONFIG` global cache
   - Lets `loadConfigModels` handle its own per-endpoint caching
   - **No replacement of other core files**

## Features

- ✅ **Minimal changes**: Only modifies caching behavior, keeps everything else
- ✅ **Safer approach**: No complex file replacements or import changes  
- ✅ **Dynamic model loading**: Models refresh when users add API keys
- ✅ **Backward compatible**: Maintains all original LibreChat functionality

## Usage

1. **Build the custom image:**
   ```bash
   ./build-librechat.sh
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Test the fix:**
   - Go to LibreChat at http://localhost:3080
   - Enter your LiteLLM API key in the endpoint settings
   - Models should now dynamically load and appear

## How It Works

1. **Original Behavior**: LibreChat cached all models globally at startup
2. **Fixed Behavior**: Models are loaded fresh each time, allowing:
   - User-specific API keys to fetch their own models
   - Different endpoints to cache their models independently
   - Dynamic model discovery when keys are updated

## Files Modified

- `librechat-custom/patches/ModelController-minimal.js` (replaces ModelController.js)
- `docker-compose.yml` (updated to use custom build)

## Benefits

- ✅ **Minimal risk**: Only touches caching logic, not core functionality
- ✅ **Easy debugging**: Small change surface area
- ✅ **Works with LiteLLM**: Supports virtual keys and custom endpoints
- ✅ **No breaking changes**: Maintains all original API contracts

## Testing

1. **Basic functionality**: LibreChat works normally
2. **Static models**: Default models still appear
3. **Dynamic models**: User API keys now fetch their associated models
4. **Performance**: Minimal impact since individual endpoints handle their own caching 