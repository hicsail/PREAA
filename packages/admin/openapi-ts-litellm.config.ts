import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'http://localhost:4000/openapi.json',
  output: 'src/app/lib/client-litellm',
  plugins: ['@hey-api/client-fetch'],
});
