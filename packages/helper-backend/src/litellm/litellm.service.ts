import { CompletionResponse, CreateNewModel } from './dtos/litellm.dto';

export class LiteLLMService {
  constructor() {}

  async completion(model: string, apiKey: string, url: string, body: any): Promise<CompletionResponse> {
    try {
      body.model = model;
      console.log(`Sending request to ${url} for model ${model}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        console.error(`Error response: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      // Check content type to ensure we're getting JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error(`Received non-JSON response: ${text}`);
        throw new Error('API response was not JSON');
      }

      // Parse response
      const responseJson = await response.json();
      console.log('Received response:', JSON.stringify(responseJson).substring(0, 200) + '...');

      // Reshape the response
      responseJson.text = responseJson.choices[0].message.content;
      return responseJson;
    } catch (error) {
      console.error('Error in completion:', error);
      throw error;
    }
  }

  async create(newModel: CreateNewModel): Promise<void> {
    const response = await fetch(`${process.env.LITE_LLM_BASE_URL}/model/new`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newModel.litellm_params.api_key}`
      },
      body: JSON.stringify({
        model_name: newModel.model_name,
        litellm_params: newModel.litellm_params
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to create model: ${errorText}`);
      throw new Error(`Failed to create model: ${response.status} ${response.statusText}`);
    }
  }
}
