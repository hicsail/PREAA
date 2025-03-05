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

  @Post('/proxy')
  async proxyRequest(@Req() request: Request): Promise<any> {
    const apiKey = "";
    const model = "";
    const url = "";
    const body = request.body;
    const response = await this.deepchatProxyService.proxyRequest( model, url, apiKey, body);
    return response;
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
}
