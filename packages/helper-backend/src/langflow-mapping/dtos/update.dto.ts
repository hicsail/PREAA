import { IsOptional, IsString } from 'class-validator';
import { DoesExistModel } from '../pipes/exists';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLangFlowMapping {
  @ApiProperty({ description: 'New model name' })
  @IsString()
  @DoesExistModel()
  model: string;

  @ApiProperty({ description: 'New url' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiProperty({ description: 'New history component' })
  @IsString()
  @IsOptional()
  historyComponentID: string;
}
