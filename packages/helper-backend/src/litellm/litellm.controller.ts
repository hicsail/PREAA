import { Body, Controller, Param, Post, Get, Put, Delete, NotFoundException } from '@nestjs/common';
import { LiteLLMService } from './litellm.service';
import { CreateNewModel } from './dtos/litellm.dto';

@Controller('litellm')
export class LiteLLMController {
  constructor(private readonly liteLLMService: LiteLLMService) {}

  @Post()
  async create(@Body() newModel: CreateNewModel): Promise<void> {
    return this.liteLLMService.create(newModel);
  }
}
