import { IsString, Validate } from 'class-validator';
import { IsUniqueModel } from '../pipes/unique';

export class CreateLangFlowMapping {
  @IsString()
  @Validate(IsUniqueModel)
  model: string;

  @IsString()
  url: string;

  @IsString()
  historyComponentID: string;
}
