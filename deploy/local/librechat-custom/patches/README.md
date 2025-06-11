# LibreChat Dynamic Model Loading Patches

This directory contains patches that enable LibreChat to dynamically load models when users provide their own API keys, instead of being limited to models cached at startup.

## Files

### `ModelController.js`
- **Purpose**: Removes global model caching to allow per-request model fetching
- **Original Issue**: Models were cached globally on startup, preventing dynamic loading
- **Fix**: Removes the caching mechanism to allow fresh model fetching on each request

### `loadConfigModels.js`
- **Purpose**: Implements proper user key resolution and per-endpoint caching
- **Key Fixes**:
  - Uses correct endpoint name (`configName`) when looking up user keys instead of lowercase normalization
  - Implements deferred UserService import to avoid circular dependencies
  - Properly resolves user-provided API keys from the database
  - Falls back to default models when user keys are not available

## Problem Solved

Before these patches:
- Users could only see models that were available at LibreChat startup
- Entering custom API keys in the UI had no effect on available models
- Models were cached globally, preventing dynamic loading

After these patches:
- Users can enter their own API keys and see all available models for that endpoint
- Models are fetched dynamically based on user-provided credentials
- Proper fallback to default models when user keys are not provided

## Usage

These patches are automatically applied when building the custom LibreChat Docker image via the `Dockerfile` in the parent directory. 