import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: 'http://localhost:3000/generated/api/openapi.yml',
    output: 'src/app/lib/client-langfuse',
    plugins: ['@hey-api/client-fetch'],
});