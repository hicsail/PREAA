import { IsString, Validate } from 'class-validator';
import { IsUniqueModel, IsUniqueModelRule } from '../pipes/unique';

export class CreateLangFlowMapping {
  @IsString()
  @IsUniqueModel()
  model: string;

  @IsString()
  url: string;

  @IsString()
  historyComponentID: string;
}
