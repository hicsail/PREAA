import "reflect-metadata";
import { container } from "tsyringe";
import { Client as LiteLLMClient } from './client-litellm/client/types';
import { createClient, ClientOptions, createConfig } from './client-litellm/client';
import mongoose from "mongoose";

// Register the LiteLLM client
const LITELLM_PROVIDER = 'LiteLLMClient';
container.register<LiteLLMClient>(LITELLM_PROVIDER, {
  useValue: createClient(createConfig<ClientOptions>({
    baseUrl: process.env.LITELLM_BASE_URL,
    auth: () => process.env.LITELLM_API_KEY
  }))
});

// Register the Mongoose Client
const MONGOOSE_PROVIDER = 'MongooseClient';
container.register(MONGOOSE_PROVIDER, {
  useFactory: async (_) => {
    return await mongoose.connect(process.env.MONGODB_URI!);
  }
});

// Re-export the container
export {
  container,
  LITELLM_PROVIDER,
  MONGOOSE_PROVIDER
};
