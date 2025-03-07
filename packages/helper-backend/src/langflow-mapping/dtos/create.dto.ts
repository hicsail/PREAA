import { IsString } from 'class-validator';
import { IsUniqueModel } from '../pipes/unique';

export class CreateLangFlowMapping {
  @IsString()
  @IsUniqueModel()
  model: string;

  @IsString()
  url: string;

  @IsString()
  historyComponentID: string;
}
