const { EModelEndpoint, extractEnvVariable } = require('librechat-data-provider');
const { isUserProvided, normalizeEndpointName } = require('~/server/utils');
const { fetchModels } = require('~/server/services/ModelService');
const { getCustomConfig } = require('./getCustomConfig');

/**
 * Load config endpoints from the cached configuration object
 * @function loadConfigModels
 * @param {Express.Request} req - The Express request object.
 */
async function loadConfigModels(req) {
  const customConfig = await getCustomConfig();

  if (!customConfig) {
    return {};
  }

  const { endpoints = {} } = customConfig ?? {};
  const modelsConfig = {};
  const azureEndpoint = endpoints[EModelEndpoint.azureOpenAI];
  const azureConfig = req.app.locals[EModelEndpoint.azureOpenAI];
  const { modelNames } = azureConfig ?? {};

  if (modelNames && azureEndpoint) {
    modelsConfig[EModelEndpoint.azureOpenAI] = modelNames;
  }

  if (modelNames && azureEndpoint && azureEndpoint.plugins) {
    modelsConfig[EModelEndpoint.gptPlugins] = modelNames;
  }

  if (azureEndpoint?.assistants && azureConfig.assistantModels) {
    modelsConfig[EModelEndpoint.azureAssistants] = azureConfig.assistantModels;
  }

  if (!Array.isArray(endpoints[EModelEndpoint.custom])) {
    return modelsConfig;
  }

  const customEndpoints = endpoints[EModelEndpoint.custom].filter(
    (endpoint) =>
      endpoint.baseURL &&
      endpoint.apiKey &&
      endpoint.name &&
      endpoint.models &&
      (endpoint.models.fetch || endpoint.models.default),
  );

  /**
   * @type {Record<string, Promise<string[]>>}
   * Map for promises keyed by unique combination of baseURL and apiKey */
  const fetchPromisesMap = {};
  /**
   * @type {Record<string, string[]>}
   * Map to associate unique keys with endpoint names; note: one key may can correspond to multiple endpoints */
  const uniqueKeyToEndpointsMap = {};
  /**
   * @type {Record<string, Partial<TEndpoint>>}
   * Map to associate endpoint names to their configurations */
  const endpointsMap = {};

  for (let i = 0; i < customEndpoints.length; i++) {
    const endpoint = customEndpoints[i];
    const { models, name: configName, baseURL, apiKey } = endpoint;
    const name = normalizeEndpointName(configName);
    endpointsMap[name] = endpoint;

    let API_KEY = extractEnvVariable(apiKey);
    let BASE_URL = extractEnvVariable(baseURL);

    const userProvidesKey = isUserProvided(API_KEY);
    const userProvidesURL = isUserProvided(BASE_URL);

    // If user provides keys, try to resolve them using the CORRECT key name (not lowercased)
    if (req.user?.id && (userProvidesKey || userProvidesURL)) {
      try {
        // Dynamically import UserService only when needed to avoid circular dependencies
        const { getUserKeyValues } = require('~/server/services/UserService');
        // CRITICAL FIX: Use original configName, not normalized lowercase name
        const userValues = await getUserKeyValues({ userId: req.user.id, name: configName });
        
        if (userProvidesKey && userValues?.apiKey) {
          API_KEY = userValues.apiKey;
        }
        if (userProvidesURL && userValues?.baseURL) {
          BASE_URL = userValues.baseURL;
        }
      } catch (error) {
        // If user key resolution fails, fall back to default models
        modelsConfig[name] = Array.isArray(models.default) ? models.default : [];
        continue;
      }
    }

    // If we still have unresolved placeholders, use default models
    if (API_KEY === 'user_provided' || BASE_URL === 'user_provided') {
      modelsConfig[name] = Array.isArray(models.default) ? models.default : [];
      continue;
    }

    const uniqueKey = `${BASE_URL}__${API_KEY}`;

    modelsConfig[name] = [];

    // Now fetch models with properly resolved keys
    if (models.fetch) {
      fetchPromisesMap[uniqueKey] =
        fetchPromisesMap[uniqueKey] ||
        fetchModels({
          user: req.user?.id,
          baseURL: BASE_URL,
          apiKey: API_KEY,
          name,
          userIdQuery: models.userIdQuery,
        });
      uniqueKeyToEndpointsMap[uniqueKey] = uniqueKeyToEndpointsMap[uniqueKey] || [];
      uniqueKeyToEndpointsMap[uniqueKey].push(name);
      continue;
    }

    if (Array.isArray(models.default)) {
      modelsConfig[name] = models.default;
    }
  }

  const fetchedData = await Promise.all(Object.values(fetchPromisesMap));
  const uniqueKeys = Object.keys(fetchPromisesMap);

  for (let i = 0; i < fetchedData.length; i++) {
    const currentKey = uniqueKeys[i];
    const modelData = fetchedData[i];
    const associatedNames = uniqueKeyToEndpointsMap[currentKey];

    for (const name of associatedNames) {
      const endpoint = endpointsMap[name];
      modelsConfig[name] = !modelData?.length ? (endpoint.models.default ?? []) : modelData;
    }
  }

  return modelsConfig;
}

module.exports = loadConfigModels; 