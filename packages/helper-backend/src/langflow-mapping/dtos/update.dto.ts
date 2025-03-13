import { IsOptional, IsString } from 'class-validator';
import { DoesExistModel } from '../pipes/exists';

export class UpdateLangFlowMapping {
  @IsString()
  @DoesExistModel()
  model: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  historyComponentID: string;
}
