import "reflect-metadata";
import { container } from "tsyringe";
import { Client as LiteLLMClient } from './client-litellm/client/types';
import { createClient, ClientOptions, createConfig } from './client-litellm/client';
import mongoose, { Mongoose } from "mongoose";


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
const connection = await mongoose.connect(process.env.MONGODB_URI!);
container.register<Mongoose>(MONGOOSE_PROVIDER, {
  useValue: connection
});

// Re-export the container
export {
  container,
  LITELLM_PROVIDER,
  MONGOOSE_PROVIDER
};
