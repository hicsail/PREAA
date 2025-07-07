import { inject, singleton } from "tsyringe";
import { LITELLM_PROVIDER } from "../container";
import type { Client as LiteLLMClient } from "../client-litellm/core/types";
import { addNewModelModelNewPost, deleteModelModelDeletePost, Deployment, modelInfoV1ModelInfoGet } from "@/app/lib/client-litellm";

@singleton()
export class ModelService {
  constructor(@inject(LITELLM_PROVIDER) private readonly litellmClient: LiteLLMClient) {}

  async create(newModel: any): Promise<Deployment> {
    const result = await addNewModelModelNewPost({ body: newModel, client: this.litellmClient as any });

    if (result.error) {
      console.error(result.error);
      throw new Error('Failed to create model');
    }

    if (!result.data) {
      console.error('Missing data payload');
      throw new Error('Missing LiteLLM Payload');
    }

    // Add ID field
    return { ...result.data, id: (result.data as any).model_id } as any;
  }

  async get(id: string): Promise<Deployment> {
    const result = await modelInfoV1ModelInfoGet({ query: { litellm_model_id: id }, client: this.litellmClient as any });

    if (result.error) {
      console.error(result.error);
      throw new Error('Failed to find model');
    }

    if (!result.data) {
      console.error('Missing data payload');
      throw new Error('No model data provided');
    }

    // Add ID field
    return { ...result.data, id: (result.data as any).model_id } as any;
  }

  async getAll(): Promise<Deployment[]> {
    const result = await modelInfoV1ModelInfoGet({ client: this.litellmClient as any });

    if (result.error) {
      console.error(result.error);
      throw new Error('Failed to find model');
    }

    if (!result.data) {
      console.error('Missing data payload');
      throw new Error('No model data provided');
    }

    // Add ID field
    let models = (result.data as any).data as any[];
    return models.map((model) => { return { ...model, id: model.model_info.id }});
  }

  async delete(id: string): Promise<Deployment> {
    const existing = await this.get(id);

    const result = await deleteModelModelDeletePost({ body: { id }, client: this.litellmClient as any });

    if (result.error) {
      console.error(result.error);
      throw new Error('Failed to delete model');
    }

    if (!result.data) {
      console.error('Missing data payload');
      throw new Error('Missing payload on delete request');
    }

    return existing;
  }
}
