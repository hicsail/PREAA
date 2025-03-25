import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLangFlowMapping {
  @ApiProperty({ description: 'The model name' })
  @IsString()
  model: string;

  @ApiProperty({ description: 'The URL of the Langflow mapping' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'The history component ID' })
  @IsString()
  historyComponentID: string;
}
