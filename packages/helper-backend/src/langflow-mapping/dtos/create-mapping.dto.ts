import { IsString, Validate } from 'class-validator';
import { IsUniqueModel, IsUniqueModelRule } from '../pipes/unique';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLangFlowMapping {
  @IsString()
  @IsUniqueModel()
  model: string;

  @IsString()
  url: string;

  @IsString()
  historyComponentID: string;
}

export class CreateLangFlowMappingDto {
  @ApiProperty({ description: 'The model name' })
  model: string;

  @ApiProperty({ description: 'The URL of the Langflow mapping' })
  url: string;

  @ApiProperty({ description: 'The history component ID' })
  historyComponentID: string;
}

