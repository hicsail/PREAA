import { Body, Controller, Post } from '@nestjs/common';
import { LiteLLMService } from './litellm.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateNewModel } from './dtos/create-model.dto';

@ApiTags('LiteLLM')
@Controller('litellm')
export class LiteLLMController {
  constructor(private readonly liteLLMService: LiteLLMService) {}

  @ApiOperation({ summary: 'Create new LiteLLM model', description: 'Create a new model in LiteLLM' })
  @Post()
  async create(@Body() newModel: CreateNewModel): Promise<void> {
    return this.liteLLMService.create(newModel);
  }
}
