import { Body, Controller, Param, Post, Get, Put, Delete, NotFoundException } from '@nestjs/common';
import { DeepchatProxyService } from './deepchat-proxy.service';
import { DeepchatProxy } from './deepchat-proxy.schema';

@Controller('deepchat-proxy')
export class DeepchatProxyController {

  constructor(private readonly deepchatProxyService: DeepchatProxyService) {}

  @Get('/:model')
  async get(@Param('model') model: string): Promise<DeepchatProxy> {
    const mapping = await this.deepchatProxyService.get(model);
    if (!mapping) {
      throw new NotFoundException(`No model ${model} found`);
    }
    return mapping;
  }

  @Get()
  async getAll(): Promise<DeepchatProxy[]> {
    return this.deepchatProxyService.getAll();
  }

  @Post()
  async create(@Body() mapping: DeepchatProxy): Promise<DeepchatProxy> {
    return this.deepchatProxyService.create(mapping);
  }

  @Delete('/:model')
  async delete(@Param('model') model: string): Promise<void> {
    await this.deepchatProxyService.delete(model);
  }

}
