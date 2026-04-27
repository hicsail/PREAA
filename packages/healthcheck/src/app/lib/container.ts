import { createClient, createConfig } from './client-litellm/client';
import { createClient as createLangflowClient, createConfig as createLangflowConfig } from './client-langflow/client';
import { createClient as createN8nClient, createConfig as createN8nConfig } from './client-n8n/client';
import { createClient as createLangfuseClient, createConfig as createLangfuseConfig } from './client-langfuse/client';

export const litellmClient = createClient(createConfig({
    baseUrl: process.env.LITELLM_BASE_URL,
    auth: () => process.env.LITELLM_API_KEY
}));

export const langflowClient = createLangflowClient(createLangflowConfig({
    baseUrl: process.env.LANGFLOW_BASE_URL
}));

export const n8nClient = createN8nClient(createN8nConfig({
    baseUrl: process.env.N8N_BASE_URL
}));

export const langfuseClient = createLangfuseClient(createLangfuseConfig({
    baseUrl: process.env.LANGFUSE_BASE_URL
}));
