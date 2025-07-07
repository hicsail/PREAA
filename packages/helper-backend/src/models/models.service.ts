import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { Client as LitellmClient } from '../client-litellm/client/types';
import { LITELLM_PROVIDER } from 'src/litellm/litellm.provider';
import { addNewModelModelNewPost, modelInfoV1ModelInfoGet } from 'src/client-litellm';

@Injectable()
export class ModelsService {
  constructor (@Inject(LITELLM_PROVIDER) private readonly litellm: LitellmClient) {}

  async create(createModelDto: CreateModelDto) {
    const result = await addNewModelModelNewPost({ body: createModelDto as any });

    if (result.error) {
      console.error(result.error);
      throw new InternalServerErrorException('Error response from LiteLLM API');
    }

    return 'This action adds a new model';
  }

  async findAll(): Promise<any[]> {
    const all = await modelInfoV1ModelInfoGet({ client: this.litellm });

    if (all.error) {
      console.error(all.error);
      throw new InternalServerErrorException('Error response from LiteLLM API');
    }

    if (!all.data) {
      console.error('No error, but no data returned');
      throw new InternalServerErrorException('Empty response from LiteLLM API');
    }

    // Need to add an ID field
    let models = (all.data as any).data as any[];
    models = models.map((model) => { return { ...model, id: model.model_info.id }})

    return models;
  }

  findOne(id: number) {
    return `This action returns a #${id} model`;
  }

  update(id: number, updateModelDto: UpdateModelDto) {
    return `This action updates a #${id} model`;
  }

  remove(id: number) {
    return `This action removes a #${id} model`;
  }
}
