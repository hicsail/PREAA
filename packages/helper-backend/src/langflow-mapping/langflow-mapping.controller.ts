import { Body, Controller, Param, Post, Get, Put, Delete, NotFoundException } from '@nestjs/common';
import { LangflowMappingService } from './langflow-mapping.service';
import { CreateLangFlowMapping } from './dtos/create.dto';
import { LangFlowMapping } from './langflow-mapping.schema';
import { UpdateLangFlowMapping } from './dtos/update.dto';

@Controller('mapping')
export class LangflowMappingController {
  constructor(private readonly langFlowMappingService: LangflowMappingService) {}

  @Post()
  async create(@Body() mapping: CreateLangFlowMapping): Promise<LangFlowMapping> {
    return this.langFlowMappingService.create(mapping);
  }

  @Get('/:model')
  async get(@Param('model') model: string): Promise<LangFlowMapping> {
    const mapping = await this.langFlowMappingService.get(model);
    if (!mapping) {
      throw new NotFoundException(`No model ${model} found`);
    }
    return mapping;
  }

  @Get()
  async getAll(): Promise<LangFlowMapping[]> {
    return this.langFlowMappingService.getAll();
  }

  @Put()
  async update(@Body() mapping: UpdateLangFlowMapping): Promise<LangFlowMapping> {
    const update = await this.langFlowMappingService.update(mapping);
    if (!update) {
      throw new NotFoundException(`No model ${mapping.model} found`);
    }
    return update;
  }

  @Delete('/:model')
  async delete(@Param('model') model: string): Promise<void> {
    await this.langFlowMappingService.delete(model);
  }
}
