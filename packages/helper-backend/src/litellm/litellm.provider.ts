import { Provider } from '@nestjs/common';
import { Client } from '../client-litellm/client/types';
import { createClient, ClientOptions, createConfig } from '../client-litellm/client';
import { ConfigService } from '@nestjs/config';

export const LITELLM_PROVIDER = 'LITELLM_PROVIDER';

export const litellmProvider: Provider<Client> = {
  provide: LITELLM_PROVIDER,
  useFactory: (configService: ConfigService) => {
    const apiKey = configService.getOrThrow<string>('litellmAPIKey');
    console.log(apiKey)
    return createClient(createConfig<ClientOptions>({
      baseUrl: configService.getOrThrow<string>('litellm.uri'),
      auth: () => apiKey
    }));
  },
  inject: [ConfigService]
};
