import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  Put,
  Delete,
  NotFoundException,
  UseInterceptors,
  ClassSerializerInterceptor
} from '@nestjs/common';
import { DeepchatProxyService } from './deepchat-proxy.service';
import { DeepchatProxy } from './deepchat-proxy.schema';
import { ProxyCompletion } from './dtos/proxy-completion.dto';
import { CompletionResponse } from 'src/litellm/dtos/litellm.dto';
import { ApiOperation, ApiTags, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProxyDto } from './dtos/create-proxy.dto';

@ApiTags('Deepchat Proxy')
@Controller('deepchat-proxy')
@UseInterceptors(ClassSerializerInterceptor)
export class DeepchatProxyController {
  constructor(private readonly deepchatProxyService: DeepchatProxyService) {}

  @Get('/:id')
  @ApiOperation({ summary: 'Get proxy by ID', description: 'Retrieves a specific Deepchat proxy by ID' })
  @ApiParam({ name: 'id', description: 'Proxy identifier' })
  @ApiResponse({ status: 200, description: 'The proxy has been found', type: DeepchatProxy })
  @ApiResponse({ status: 404, description: 'Proxy not found' })
  async get(@Param('id') id: string): Promise<DeepchatProxy> {
    const mapping = await this.deepchatProxyService.get(id);
    if (!mapping) {
      throw new NotFoundException(`No model with ${id} found`);
    }
    return mapping;
  }

  @Get()
  @ApiOperation({ summary: 'Get all proxies', description: 'Retrieves all available Deepchat proxies' })
  @ApiResponse({ status: 200, description: 'List of all proxies', type: [DeepchatProxy] })
  async getAll(): Promise<DeepchatProxy[]> {
    return this.deepchatProxyService.getAll();
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update a proxy', description: 'Updates an existing Deepchat proxy' })
  @ApiParam({ name: 'id', description: 'Proxy identifier' })
  @ApiBody({ type: DeepchatProxy, description: 'Updated proxy data' })
  @ApiResponse({ status: 200, description: 'The proxy has been successfully updated', type: DeepchatProxy })
  @ApiResponse({ status: 404, description: 'Proxy not found' })
  async update(@Param('id') id: string, @Body() mapping: DeepchatProxy): Promise<DeepchatProxy> {
    const updatedMapping = await this.deepchatProxyService.update(id, mapping);
    if (!updatedMapping) {
      throw new NotFoundException(`No model with ${id} found`);
    }
    return updatedMapping;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new proxy', description: 'Creates a new Deepchat proxy with the provided data' })
  @ApiBody({ type: DeepchatProxy, description: 'Deepchat proxy data' })
  @ApiResponse({ status: 201, description: 'The proxy has been successfully created', type: DeepchatProxy })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() mapping: DeepchatProxy): Promise<DeepchatProxy> {
    return this.deepchatProxyService.create(mapping);
  }

  @Delete('/:model')
  @ApiOperation({ summary: 'Delete a proxy', description: 'Deletes a Deepchat proxy by model name' })
  @ApiParam({ name: 'model', description: 'Model identifier to delete' })
  @ApiResponse({ status: 200, description: 'The proxy has been successfully deleted' })
  @ApiResponse({ status: 404, description: 'Proxy not found' })
  async delete(@Param('model') model: string): Promise<void> {
    await this.deepchatProxyService.delete(model);
  }

  @Post('proxy/:id')
  @ApiOperation({ summary: 'Proxy a request', description: 'Proxies a completion request to the specified model' })
  @ApiParam({ name: 'id', description: 'Proxy identifier' })
  @ApiBody({ type: ProxyCompletion, description: 'Completion request data' })
  @ApiResponse({ status: 200, description: 'Successful completion response', type: CompletionResponse })
  @ApiResponse({ status: 404, description: 'Proxy not found' })
  async proxyRequest(@Body() request: ProxyCompletion, @Param('id') id: string): Promise<CompletionResponse> {
    const response = await this.deepchatProxyService.proxyRequest(id, request);
    return response;
  }
}
