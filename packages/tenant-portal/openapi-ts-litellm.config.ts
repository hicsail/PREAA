import { defineConfig } from '@hey-api/openapi-ts';

// Regenerate the LiteLLM TypeScript client by running:
//   npm run codegen:litellm
//
// Requires a LiteLLM instance reachable at the URL below; locally this
// usually means starting the compose stack and ensuring port 4000 is
// available. Generated code lands in src/app/lib/clients/client-litellm
// (and should NOT be hand-edited).
export default defineConfig({
  input: 'http://localhost:4000/openapi.json',
  output: 'src/app/lib/clients/client-litellm',
  plugins: ['@hey-api/client-fetch'],
});
