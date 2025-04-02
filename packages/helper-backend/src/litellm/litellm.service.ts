import { CompletionResponse } from './dtos/litellm.dto';
import { CreateNewModel } from './dtos/create-model.dto';

export class LiteLLMService {
  constructor() {}

  async completion(model: string, apiKey: string, url: string, body: any): Promise<CompletionResponse> {
    body.messages.forEach((message: any) => {
      message.content = message.text;
    });
    body.model = model;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(body)
    });

    // reshape the response
    const responseJson = await response.json();
    responseJson.text = responseJson.choices[0].message.content;
    return responseJson;
  }

  async create(newModel: CreateNewModel): Promise<void> {
    const response = await fetch(`${process.env.LITE_LLM_BASE_URL}/model/new`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-goog-api-key': newModel.litellm_params.api_key
      },
      body: JSON.stringify({
        model_name: newModel.model_name,
        litellm_params: newModel.litellm_params
      })
    });
    if (!response.ok) {
      const errorText = await response.text(); // Get the error message from the response
      console.error(`Failed to create model: ${errorText}`); // Log the error
      throw new Error('Failed to create model');
    }
  }
}
