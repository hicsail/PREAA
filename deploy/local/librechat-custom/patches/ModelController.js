const { CacheKeys } = require('librechat-data-provider');
const { loadDefaultModels, loadConfigModels } = require('~/server/services/Config');
const { getLogStores } = require('~/cache');
const { logger } = require('~/config');

/**
 * @param {ServerRequest} req
 */
const getModelsConfig = async (req) => {
  // Skip global cache - always load fresh models to allow per-user API keys
  const modelsConfig = await loadModels(req);
  return modelsConfig;
};

/**
 * Loads the models from the config.
 * @param {ServerRequest} req - The Express request object.
 * @returns {Promise<TModelsConfig>} The models config.
 */
async function loadModels(req) {
  // Skip global cache check - let loadConfigModels handle per-endpoint+key caching
  const defaultModelsConfig = await loadDefaultModels(req);
  const customModelsConfig = await loadConfigModels(req);

  const modelConfig = { ...defaultModelsConfig, ...customModelsConfig };

  // Don't cache globally - let individual endpoints cache their own models
  return modelConfig;
}

async function modelController(req, res) {
  try {
    const modelConfig = await loadModels(req);
    res.send(modelConfig);
  } catch (error) {
    logger.error('Error fetching models:', error);
    res.status(500).send({ error: error.message });
  }
}

module.exports = { modelController, loadModels, getModelsConfig }; 