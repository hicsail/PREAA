import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: 'http://localhost:7860/openapi.json',
    output: 'src/app/lib/client-langflow',
    plugins: ['@hey-api/client-fetch'],
});
