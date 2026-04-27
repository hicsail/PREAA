import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: 'http://localhost:5678/api/v1/openapi.yml',
    output: 'src/app/lib/client-n8n',
    plugins: ['@hey-api/client-fetch'],
});
