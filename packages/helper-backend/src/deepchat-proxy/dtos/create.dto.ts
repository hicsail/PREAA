import { IsString, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProxyMappingDto {
  @ApiProperty({
    description: 'The model identifier used for LLM requests',
    example: 'gpt-4',
    required: true
  })
  @IsString()
  model: string;

  @ApiProperty({
    description: 'Base URL for the API service',
    example: 'https://api.openai.com/v1',
    required: true
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'API key for authentication with the LLM provider',
    example: 'sk-...',
    required: true
  })
  @IsString()
  apiKey: string;
}
