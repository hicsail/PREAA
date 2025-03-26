import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsUniqueModel } from '../pipes/unique';

export class CreateLangFlowMapping {
  @ApiProperty({ description: 'The model name' })
  @IsUniqueModel()
  model: string;

  @ApiProperty({ description: 'The URL of the Langflow mapping' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'The history component ID' })
  @IsString()
  historyComponentID: string;
}
