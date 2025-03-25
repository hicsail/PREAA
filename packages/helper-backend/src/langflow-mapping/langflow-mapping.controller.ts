import { Body, Controller, Param, Post, Get, Put, Delete, NotFoundException } from '@nestjs/common';
import { LangflowMappingService } from './langflow-mapping.service';
import { CreateLangFlowMapping } from './dtos/create.dto';
import { LangFlowMapping } from './langflow-mapping.schema';
import { UpdateLangFlowMapping } from './dtos/update.dto';
import { ApiOperation, ApiTags, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateLangFlowMappingDto } from './dtos/create.dto';

@ApiTags('Langflow Mapping')
@Controller('mapping')
export class LangflowMappingController {
  constructor(private readonly langFlowMappingService: LangflowMappingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new mapping', description: 'Creates a new Langflow mapping with the provided data' })
  @ApiBody({ type: CreateLangFlowMappingDto, description: 'Langflow mapping data' })
  @ApiResponse({ status: 201, description: 'The mapping has been successfully created', type: LangFlowMapping })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() mapping: CreateLangFlowMapping): Promise<LangFlowMapping> {
    return this.langFlowMappingService.create(mapping);
  }

  @Get('/:model')
  @ApiOperation({ summary: 'Get mapping by model name', description: 'Retrieves a specific Langflow mapping by model name' })
  @ApiParam({ name: 'model', description: 'Model identifier' })
  @ApiResponse({ status: 200, description: 'The mapping has been found', type: LangFlowMapping })
  @ApiResponse({ status: 404, description: 'Mapping not found' })
  async get(@Param('model') model: string): Promise<LangFlowMapping> {
    const mapping = await this.langFlowMappingService.get(model);
    if (!mapping) {
      throw new NotFoundException(`No model ${model} found`);
    }
    return mapping;
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all mappings', 
    description: 'Retrieves all available Langflow mappings with complete configuration details'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all mappings with their configurations', 
    type: [LangFlowMapping],
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'Unique identifier' },
          model: { type: 'string', description: 'Model name' },
          langflowId: { type: 'string', description: 'Langflow flow identifier' },
          langflowUrl: { type: 'string', description: 'URL to the Langflow instance' },
          createdAt: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Server error' })
  async getAll(): Promise<LangFlowMapping[]> {
    return this.langFlowMappingService.getAll();
  }

  @Put()
  @ApiOperation({ summary: 'Update a mapping', description: 'Updates an existing Langflow mapping' })
  @ApiBody({ type: UpdateLangFlowMapping, description: 'Updated mapping data' })
  @ApiResponse({ status: 200, description: 'The mapping has been successfully updated', type: LangFlowMapping })
  @ApiResponse({ status: 404, description: 'Mapping not found' })
  async update(@Body() mapping: UpdateLangFlowMapping): Promise<LangFlowMapping> {
    const update = await this.langFlowMappingService.update(mapping);
    if (!update) {
      throw new NotFoundException(`No model ${mapping.model} found`);
    }
    return update;
  }

  @Delete('/:model')
  @ApiOperation({ summary: 'Delete a mapping', description: 'Deletes a Langflow mapping by model name' })
  @ApiParam({ name: 'model', description: 'Model identifier to delete' })
  @ApiResponse({ status: 200, description: 'The mapping has been successfully deleted' })
  @ApiResponse({ status: 404, description: 'Mapping not found' })
  async delete(@Param('model') model: string): Promise<void> {
    await this.langFlowMappingService.delete(model);
  }
}