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

  @Post()
  async create(@Body() mapping: DeepchatProxy): Promise<DeepchatProxy> {
    //return this.deepchatProxyService.create(mapping);
    return {} as DeepchatProxy;
  }

  @Delete('/:model')
  async delete(@Param('model') model: string): Promise<void> {
    await this.deepchatProxyService.delete(model);
  }

  @Post('proxy/:id')
  async proxyRequest(@Req() request: Request, @Param('id') id: string): Promise<any> {
    
    const modelData = await this.deepchatProxyService.get(id);
    if (!modelData) {
      throw new NotFoundException(`No model ${id} found`);
    }
    const body = request.body;
    const response = await this.deepchatProxyService.proxyRequest( modelData.model, modelData.url, modelData.apiKey, body);
    return response;
  }
}
