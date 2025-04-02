import { IsOptional, IsString } from 'class-validator';
import { DoesExistModel } from '../pipes/exists';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLangFlowMapping {
  @ApiProperty({
    description: 'The model name to update',
    example: 'gpt-4',
    required: true
  })
  @IsString()
  @DoesExistModel()
  model: string;

  @ApiProperty({
    description: 'The updated URL of the Langflow mapping',
    example: 'http://langflow.ai/api/v1/run/8e785198-f630-4d9f-94fa-26c8e945da80',
    required: false
  })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({
    description: 'The updated history component ID',
    example: 'CompletionInterface-qNlsX',
    required: false
  })
  @IsString()
  @IsOptional()
  historyComponentID: string;
}
