# Original LibreChat Files (Backup)

This directory contains backup copies of the original LibreChat files before our patches were applied.

## Files

### `original-loadConfigModels.js`
- **Original LibreChat file**: `/app/api/server/services/Config/loadConfigModels.js`
- **Key Issue**: Line 69 had `if (models.fetch && !isUserProvided(API_KEY) && !isUserProvided(BASE_URL))` which prevented model fetching when users provided their own API keys
- **Our Fix**: Changed the condition and added proper user key resolution

### `original-ModelController.js`  
- **Original LibreChat file**: `/app/api/server/controllers/ModelController.js`
- **Key Issue**: Had global model caching that prevented dynamic loading
- **Our Fix**: Removed the caching mechanism to allow per-request model fetching

## Purpose

These files are kept for:
- **Reference**: Understanding what we changed
- **Documentation**: Showing the "before" state  
- **Rollback**: If we ever need to revert changes (though unlikely)

## Not Used in Production

These files are **NOT** used by the running application - they're purely for reference. The actual patches are in the `../patches/` directory. 