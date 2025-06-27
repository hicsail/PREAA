import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { Client as LitellmClient } from '../client-litellm/client/types';
import { LITELLM_PROVIDER } from 'src/litellm/litellm.provider';
import { modelListV1ModelsGet } from 'src/client-litellm';

@Injectable()
export class ModelsService {
  constructor (@Inject(LITELLM_PROVIDER) private readonly litellm: LitellmClient) {}

  create(createModelDto: CreateModelDto) {
    return 'This action adds a new model';
  }

  async findAll(): Promise<any[]> {
    const all = await modelListV1ModelsGet({ client: this.litellm });

    if (all.error) {
      console.error(all.error);
      throw new InternalServerErrorException('Error response from LiteLLM API');
    }

    if (!all.data) {
      console.error('No error, but no data returned');
      throw new InternalServerErrorException('Empty response from LiteLLM API');
    }
    console.log(all.data);

    return (all.data as any).data;
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
