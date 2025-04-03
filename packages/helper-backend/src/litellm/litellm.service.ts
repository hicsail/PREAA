import { CompletionResponse } from './dtos/completion.dto';
import { CreateNewModel } from './dtos/create-model.dto';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LiteLLMService {
  private readonly liteLLMBaseURL: string;
  private readonly liteLLMAPIKey: string;
  constructor(configService: ConfigService) {
    this.liteLLMBaseURL = configService.getOrThrow<string>('litellm.uri');
    this.liteLLMAPIKey = configService.getOrThrow<string>('litellmAPIKey');
  }

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
    const response = await fetch(`${this.liteLLMBaseURL}/model/new`, {
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

  async delete(model: string): Promise<boolean> {
    const modelResponse = await fetch(`${this.liteLLMBaseURL}/model/info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.liteLLMAPIKey
      }
    });
    const modelInfo = await modelResponse.json();
    const models = modelInfo.data.map((model: any) => model);
    const modelId = models.find((modelT: any) => modelT.model_name === model).model_info.id;

    if (!modelId) {
      return false;
    }

    const deleteResponse = await fetch(`${this.liteLLMBaseURL}/model/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.liteLLMAPIKey
      },
      body: JSON.stringify({
        id: modelId
      })
    });
    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error(`Failed to delete model: ${errorText}`);
    }
    return true;
  }
}
