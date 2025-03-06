import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  Put,
  Delete,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { DeepchatProxyService } from './deepchat-proxy.service';
import { DeepchatProxy } from './deepchat-proxy.schema';
import { ProxyCompletion } from './dtos/proxy-completion.dto';

@Controller('deepchat-proxy')
export class DeepchatProxyController {
  constructor(private readonly deepchatProxyService: DeepchatProxyService) {}

  @Get('/:id')
  async get(@Param('id') id: string): Promise<DeepchatProxy> {
    const mapping = await this.deepchatProxyService.get(id);
    if (!mapping) {
      throw new NotFoundException(`No model with ${id} found`);
    }
    return mapping;
  }

  @Get()
  async getAll(): Promise<DeepchatProxy[]> {
    return this.deepchatProxyService.getAll();
  }

  // update a mapping
  @Put('/:id')
  async update(@Param('id') id: string, @Body() mapping: DeepchatProxy): Promise<DeepchatProxy> {
    const updatedMapping = await this.deepchatProxyService.update(id, mapping);
    if (!updatedMapping) {
      throw new NotFoundException(`No model with ${id} found`);
    }
    return updatedMapping;
  }

  @Post()
  async create(@Body() mapping: DeepchatProxy): Promise<DeepchatProxy> {
    return this.deepchatProxyService.create(mapping);
  }

  @Delete('/:model')
  async delete(@Param('model') model: string): Promise<void> {
    await this.deepchatProxyService.delete(model);
  }

  @Post('proxy/:id')
  async proxyRequest(@Body() request: ProxyCompletion, @Param('id') id: string): Promise<any> {
    
    const response = await this.deepchatProxyService.proxyRequest(id, request);
    return response;
  }
}
